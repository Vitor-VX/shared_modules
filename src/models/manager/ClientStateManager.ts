import { ClientStateModel, IClientState } from "../ClientStateModel";
import { AppError } from '../../utils';

class ClientStateManager {
    async findOne(clientId: string, botPhone: string, clientPhone: string): Promise<IClientState | null> {
        try {
            return await ClientStateModel.findOne({
                clientId,
                botPhone,
                "client.phone": clientPhone,
            }).lean().exec();
        } catch (error) {
            throw new AppError("Erro ao buscar estado do cliente no DB.", 500, error);
        }
    }

    async findAll(clientId: string, botPhone: string): Promise<IClientState[]> {
        try {
            return await ClientStateModel.find({ clientId, botPhone }).lean().exec();
        } catch (error) {
            throw new AppError(`Erro ao buscar todos os clientes no DB.`, 500, error);
        }
    }

    async save(state: IClientState): Promise<IClientState> {
        try {
            const { _id, ...updateData } = state;

            return await ClientStateModel.findOneAndUpdate(
                { clientId: state.clientId, botPhone: state.botPhone, "client.phone": state.client.phone },
                { $set: updateData },
                { upsert: true, new: true }
            ).exec();
        } catch (error) {
            throw new AppError("Erro ao salvar estado do cliente no DB.", 500, error);
        }
    }

    async deleteState(clientId: string, botPhone: string, clientPhone: string): Promise<{ deletedCount: number }> {
        try {
            const result = await ClientStateModel.deleteOne({
                clientId,
                botPhone,
                "client.phone": clientPhone
            }).exec();

            return result;
        } catch (error) {
            throw new AppError("Erro ao deletar o estado do cliente no DB.", 500, error);
        }
    }

    async createOrUpdate(
        clientId: string,
        botPhone: string,
        clientPhone: string,
        clientName: string
    ): Promise<IClientState | null> {
        try {
            const filter = { clientId, botPhone, "client.phone": clientPhone };

            const update = {
                $setOnInsert: {
                    clientId,
                    botPhone,
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