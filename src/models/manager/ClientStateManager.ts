import { ClientStateModel, IClientState } from "../ClientStateModel";
import { AppError } from '../../utils';

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

    async save(state: IClientState): Promise<IClientState> {
        try {
            const { _id, ...updateData } = state;

            return await ClientStateModel.findOneAndUpdate(
                { clientId: state.clientId, botId: state.botId, "client.phone": state.client.phone },
                { $set: updateData },
                { upsert: true, new: true }
            ).exec();
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
            const clientState = await ClientStateModel.findOneAndUpdate(filter, update, options).exec();
            if (!clientState) return null;

            return clientState;
        } catch (error) {
            console.error(`Erro ao criar/atualizar estado do cliente no DB: ${error}`);
            return null;
        }
    }
}

export const clientStateManager = new ClientStateManager();