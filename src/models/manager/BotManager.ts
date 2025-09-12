import { AppError } from "../../utils/AppError";
import { BotModel, IBot, IBotCreate } from "../BotModel";
import { FilterQuery, UpdateQuery } from "mongoose";

class BotManager {
    /**
     * Cria um novo bot
    */
    async createBot(data: IBotCreate): Promise<IBot> {
        try {
            const bot = new BotModel(data);
            return await bot.save();
        } catch (error: any) {
            throw new AppError("Erro ao criar bot", 400, error);
        }
    }

    /**
     * Busca um bot pelo ID do Mongo
     */
    async getBotById(id: string): Promise<IBot | null> {
        try {
            const bot = await BotModel.findById(id).exec();
            if (!bot) throw new AppError("Bot não encontrado", 404);
            return bot;
        } catch (error: any) {
            throw new AppError("Erro ao buscar bot por ID", 400, error);
        }
    }

    /**
     * Busca um bot pelo ID do Mongo
     */
    async getBotBySession(session: string): Promise<IBot | null> {
        try {
            const bot = await BotModel.findOne({ sessionId: session }).exec();
            if (!bot) return null;

            return bot;
        } catch (error: any) {
            throw new AppError("Erro ao buscar bot por ID", 400, error);
        }
    }

    /**
     * Busca um bot por filtros dinâmicos
     */
    async getBot(filter: FilterQuery<IBot>): Promise<IBot | null> {
        try {
            const bot = await BotModel.findOne(filter).exec();
            console.log(bot?.id);

            if (!bot) return null;

            return bot;
        } catch (error: any) {
            if (error instanceof AppError) {
                throw error;
            }

            throw new AppError("Erro ao buscar bot", 400, error);
        }
    }

    /**
     * Lista bots com base em um filtro
     */
    async getBots(filter: FilterQuery<IBot> = {}): Promise<IBot[]> {
        try {
            return await BotModel.find(filter).exec();
        } catch (error: any) {
            if (error instanceof AppError) {
                throw error;
            }

            console.log(error);


            throw new AppError("Erro ao listar bots", 400, error);
        }
    }

    /**
     * Atualiza um bot pelo ID
     */
    async updateBot(id: string, update: UpdateQuery<IBot>): Promise<IBot | null> {
        try {
            const bot = await BotModel.findByIdAndUpdate(id, update, { new: true }).exec();
            if (!bot) throw new AppError("Bot não encontrado para atualização", 404);
            return bot;
        } catch (error: any) {
            throw new AppError("Erro ao atualizar bot", 400, error);
        }
    }

    async saveTokenAndServer(
        clientId: string,
        sessionId: string,
        token: string,
        urlToRegister: string,
        replicaNumber: number
    ): Promise<IBot | null> {
        try {
            const bot = await BotModel.findOneAndUpdate(
                { clientId, sessionId },
                { authorization: token, url: urlToRegister, replicaNumber: replicaNumber },
                { new: true, upsert: true }
            ).exec();

            return bot;
        } catch (error: any) {
            throw new AppError("Erro ao salvar token do bot", 400, error);
        }
    }

    /**
     * Atualiza o lastCheck de um bot usando clientId e phone
     */
    async updateLastChecAndStatus(clientId: string, sessionId: string, lastCheck: string, status: "connected" | "disconnected"): Promise<IBot | null> {
        try {
            const bot = await BotModel.findOneAndUpdate(
                { clientId, sessionId },
                { lastCheck, status: status },
                { new: true }
            ).exec();

            if (!bot) throw new AppError("Bot não encontrado para atualização de lastCheck", 404);
            return bot;
        } catch (error: any) {
            throw new AppError("Erro ao atualizar lastCheck do bot", 400, error);
        }
    }

    /**
     * Deleta um bot pelo ID
     */
    async deleteBot(id: string): Promise<IBot | null> {
        try {
            const bot = await BotModel.findByIdAndDelete(id).exec();
            if (!bot) throw new AppError("Bot não encontrado para exclusão", 404);
            return bot;
        } catch (error: any) {
            throw new AppError("Erro ao deletar bot", 400, error);
        }
    }

    /**
     * Atualiza o status de um bot (online/offline)
     */
    async updateStatus(id: string, status: "online" | "offline"): Promise<IBot | null> {
        try {
            const bot = await BotModel.findByIdAndUpdate(
                id,
                { status },
                { new: true }
            ).exec();

            if (!bot) throw new AppError("Bot não encontrado para atualização de status", 404);
            return bot;
        } catch (error: any) {
            throw new AppError("Erro ao atualizar status do bot", 400, error);
        }
    }
}

export const botManager = new BotManager();