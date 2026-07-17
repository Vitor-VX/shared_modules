import { AppError } from "../../utils/AppError";
import { ContingencyModel, IContingency, IContingencyCreate } from "../ContingencyModel";
import { FilterQuery, UpdateQuery } from "mongoose";

class ContingencyManager {
    /**
     * Cria uma nova configuração de contingência do zero
     */
    async createContingency(data: IContingencyCreate): Promise<IContingency> {
        try {
            const contingency = new ContingencyModel(data);
            return await contingency.save();
        } catch (error: any) {
            throw new AppError("Erro ao criar configuração de contingência", 400, error);
        }
    }

    /**
     * Busca uma contingência pelo ID interno do Mongo
     */
    async getContingencyById(id: string): Promise<IContingency | null> {
        try {
            const contingency = await ContingencyModel.findById(id).exec();
            if (!contingency) throw new AppError("Configuração de contingência não encontrada", 404);
            return contingency;
        } catch (error: any) {
            throw new AppError("Erro ao buscar contingência por ID", 400, error);
        }
    }

    /**
     * Busca a contingência vinculada a um Bot específico através do botId
     */
    async getContingencyByBotId(botId: string): Promise<IContingency | null> {
        try {
            const contingency = await ContingencyModel.findOne({ botId }).exec();
            // Retorna null caso não tenha contingência configurada para o bot, sem estourar erro impeditivo
            return contingency;
        } catch (error: any) {
            throw new AppError("Erro ao buscar contingência pelo ID do bot", 400, error);
        }
    }

    /**
     * Busca uma contingência por filtros dinâmicos
     */
    async getContingency(filter: FilterQuery<IContingency>): Promise<IContingency | null> {
        try {
            const contingency = await ContingencyModel.findOne(filter).exec();
            if (!contingency) return null;

            return contingency;
        } catch (error: any) {
            if (error instanceof AppError) {
                throw error;
            }

            throw new AppError("Erro ao buscar contingência por filtros", 400, error);
        }
    }

    /**
     * Lista contingências com base em um filtro genérico
     */
    async getContingencies(filter: FilterQuery<IContingency> = {}): Promise<IContingency[]> {
        try {
            return await ContingencyModel.find(filter).exec();
        } catch (error: any) {
            if (error instanceof AppError) {
                throw error;
            }

            throw new AppError("Erro ao listar contingências", 400, error);
        }
    }

    /**
     * Atualiza uma contingência passando o ID do Mongo
     */
    async updateContingency(id: string, update: UpdateQuery<IContingency>): Promise<IContingency | null> {
        try {
            const contingency = await ContingencyModel.findByIdAndUpdate(id, update, { new: true }).exec();
            if (!contingency) throw new AppError("Configuração de contingência não encontrada para atualização", 404);
            return contingency;
        } catch (error: any) {
            throw new AppError("Erro ao atualizar contingência", 400, error);
        }
    }

    /**
     * Salva ou atualiza a contingência de forma atômica (Upsert).
     * Ideal para o fluxo da Modal Svelte onde o registro pode ou não existir previamente.
     */
    async saveOrUpdateContingency(
        clientId: string,
        sessionId: string,
        botId: string,
        configData: Omit<IContingencyCreate, "clientId" | "sessionId" | "botId">
    ): Promise<IContingency | null> {
        try {
            const contingency = await ContingencyModel.findOneAndUpdate(
                { clientId, sessionId, botId },
                { $set: configData },
                { new: true, upsert: true }
            ).exec();

            return contingency;
        } catch (error: any) {
            throw new AppError("Erro ao salvar/atualizar os parâmetros de contingência", 400, error);
        }
    }

    /**
     * Deleta uma contingência pelo ID interno do Mongo
     */
    async deleteContingency(id: string): Promise<IContingency | null> {
        try {
            const contingency = await ContingencyModel.findByIdAndDelete(id).exec();
            if (!contingency) throw new AppError("Configuração de contingência não encontrada para exclusão", 404);
            return contingency;
        } catch (error: any) {
            throw new AppError("Erro ao deletar contingência", 400, error);
        }
    }

    /**
     * Remove a contingência associada a um bot específico (usado na ação "Apagar Configuração")
     */
    async deleteContingencyByBotId(botId: string): Promise<IContingency | null> {
        try {
            const contingency = await ContingencyModel.findOneAndDelete({ botId }).exec();
            if (!contingency) throw new AppError("Nenhuma contingência encontrada para este bot", 404);
            return contingency;
        } catch (error: any) {
            throw new AppError("Erro ao remover contingência vinculada ao bot", 400, error);
        }
    }
}

export const contingencyManager = new ContingencyManager();