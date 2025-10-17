import { ClientStateModel, IClientState } from "../ClientStateModel";
import { AppError } from '../../utils';
import { PipelineStage } from "mongoose";

class ClientStateManager {
    async findOne(clientId: string, botId: string, clientPhone: string): Promise<IClientState | null> {
        try {
            return await ClientStateModel.findOne({
                clientId,
                botId,
                "client.phone": clientPhone,
            }).lean().exec();
        } catch (error) {
            throw new AppError("Erro ao buscar estado do cliente no DB.", 500, error);
        }
    }

    async findAll(clientId: string, botId: string): Promise<IClientState[]> {
        try {
            return await ClientStateModel.find({ clientId, botId }).lean().exec();
        } catch (error) {
            throw new AppError(`Erro ao buscar todos os clientes no DB.`, 500, error);
        }
    }

    async findContactsByBotIdAndSearch(
        clientId: string,
        botId: string,
        search: string
    ): Promise<any[]> {
        try {
            const searchQuery = search
                ? {
                    $or: [
                        { "client.phone": { $regex: search, $options: "i" } },
                        { "client.name": { $regex: search, $options: "i" } }
                    ]
                }
                : {};

            return await ClientStateModel.find(
                {
                    clientId,
                    botId,
                    ...searchQuery
                },
                {
                    _id: 0,
                    "client.name": 1,
                    "client.phone": 1,
                    "client.completedFunnel": 1,
                    lastInteraction: 1
                }
            )
                .lean()
                .exec();
        } catch (error) {
            console.log(error);

            throw new AppError(`Erro ao buscar clientes no DB.`, 500, error);
        }
    }

    async findAllgetPaginatedContacts(
        botId: string,
        userId: string,
        page: number = 1,
        limit: number = 10
    ) {
        try {
            const skip = (page - 1) * limit;

            const aggregationPipeline: PipelineStage[] = [
                { $match: { botId, clientId: userId } },
                {
                    $facet: {
                        paginatedResults: [
                            { $sort: { lastInteraction: -1 } },
                            { $skip: skip },
                            { $limit: limit },
                            {
                                $project: {
                                    _id: 0,
                                    lastInteraction: 1,
                                    completedFunnel: "$client.completedFunnel",
                                    client: {
                                        name: "$client.name",
                                        phone: "$client.phone",
                                    }
                                }
                            }
                        ],
                        totalCount: [
                            { $count: "total" }
                        ],
                        finishedCount: [
                            { $match: { "client.completedFunnel": true } },
                            { $count: "totalFinish" }
                        ]
                    }
                }
            ];

            const result = await ClientStateModel.aggregate(aggregationPipeline);

            const data = result[0].paginatedResults;
            const total = result[0].totalCount[0]?.total || 0;
            const totalFinish = result[0].finishedCount[0]?.totalFinish || 0;
            const totalNotFinish = total - totalFinish;
            const totalPages = Math.ceil(total / limit);

            return {
                data,
                page,
                limit,
                total,
                totalPages,
                totalFinish,
                totalNotFinish
            };
        } catch (error) {
            console.error(`[getPaginatedContacts] Erro ao buscar contatos:`, error);
            throw new AppError("Ocorreu um erro ao tentar obter os contatos.", 500);
        }
    }

    async save(state: IClientState): Promise<IClientState> {
        try {
            const { _id, ...updateData } = state;

            return await ClientStateModel.findOneAndUpdate(
                { clientId: state.clientId, botId: state.botId, "client.phone": state.client.phone },
                { $set: updateData },
                { upsert: true, new: true }
            ).lean<IClientState>().exec();
        } catch (error) {
            throw new AppError("Erro ao salvar estado do cliente no DB.", 500, error);
        }
    }

    async deleteState(clientId: string, botId: string, clientPhone: string): Promise<{ deletedCount: number }> {
        try {
            const result = await ClientStateModel.deleteOne({
                clientId,
                botId,
                "client.phone": clientPhone
            }).exec();

            return result;
        } catch (error) {
            throw new AppError("Erro ao deletar o estado do cliente no DB.", 500, error);
        }
    }

    async deleteAllStatesByBot(clientId: string, botId: string): Promise<void> {
        try {
            await ClientStateModel.deleteMany({
                clientId,
                botId
            }).exec();
        } catch (error) {
            throw new AppError("Erro ao deletar todos os estados do bot no DB.", 500, error);
        }
    }

    async markFunnelAsCompleted(phone: string, botId: string) {
        try {
            const result = await ClientStateModel.findOneAndUpdate(
                { "client.phone": phone, botId },
                { $set: { "client.completedFunnel": true } },
                { new: true }
            );

            if (!result) {
                throw new AppError(`Cliente com telefone ${phone} e botId ${botId} não encontrado`, 404);
            }

            return result;
        } catch (error) {
            console.error(`[markFunnelAsCompleted] Erro ao atualizar funil:`, error);
            throw error;
        }
    }
    async createOrUpdate(
        clientId: string,
        botId: string,
        clientPhone: string,
        clientName: string
    ): Promise<IClientState | null> {
        try {
            const filter = { clientId, botId, "client.phone": clientPhone };

            const update = {
                $setOnInsert: {
                    clientId,
                    botId,
                    "client.phone": clientPhone,
                    "client.currentNode": "1",
                    "client.completedFunnel": false,
                    "client.waiting": false,
                },
                $set: {
                    "client.name": clientName,
                    lastInteraction: new Date()
                }
            };

            const options = { upsert: true, new: true };
            const clientState = await ClientStateModel.findOneAndUpdate(filter, update, options)
                .lean<IClientState>()
                .exec();
            if (!clientState) return null;

            return clientState;
        } catch (error) {
            console.error(`Erro ao criar/atualizar estado do cliente no DB: ${error}`);
            return null;
        }
    }
}

export const clientStateManager = new ClientStateManager();