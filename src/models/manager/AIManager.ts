import { AppError } from "../../utils/AppError";
import { AIModel, Calling, IAIModel } from "../AIModel";
import { FilterQuery, UpdateQuery, type MongooseBulkWriteResult } from "mongoose";

export interface IAICreate {
    clientId: string;
    botId: string;
    apiKey: string;
    systemPrompt?: string;
    isActive?: boolean;
    isActiveTranscribe?: boolean;
    callings?: Calling[];
};

export interface ICallingStatusUpdate {
    key: string;
    enabled: boolean;
};

class AIManager {
    /**
     * Cria ou atualiza a configuração de IA para um bot específico.
     * Usa upsert para simplificar a lógica: se não existir, cria; se existir, atualiza.
     */
    async saveAIConfiguration(data: IAICreate): Promise<IAICreate> {
        try {
            const filter = { clientId: data.clientId, botId: data.botId };
            const update = {
                $set: data
            };

            const options = {
                new: true,
                upsert: true
            };

            const aiConfig = await AIModel.findOneAndUpdate(filter, update, options).exec();
            if (!aiConfig) {
                throw new AppError("Não foi possível salvar a configuração da IA.", 500);
            }

            return aiConfig;
        } catch (error: any) {
            throw new AppError("Erro ao salvar a configuração da IA", 400, error);
        }
    }

    /**
     * Busca a configuração de IA ativa para um bot específico.
     * Este é o método principal que o Gateway usará para obter as instruções da IA.
     * @param clientId O ID do cliente (usuário do seu SAAS).
     * @param phone O número do bot.
     */
    async getActiveAIConfig(clientId: string, botId: string): Promise<IAIModel | null> {
        try {
            const aiConfig = await AIModel.findOne({
                clientId,
                botId,
                isActive: true
            }).exec();

            return aiConfig;
        } catch (error: any) {
            throw new AppError("Erro ao buscar a configuração da IA", 500, error);
        }
    }

    /**
   * Busca uma configuração de IA por qualquer filtro.
   * Útil para painéis de admin ou verificações internas.
   */
    async getAIConfig(filter: FilterQuery<IAIModel>): Promise<IAIModel> {
        try {
            const aiConfig = await AIModel.findOne(filter).exec();
            if (!aiConfig) {
                throw new AppError("Configuração de IA não encontrada.", 404);
            }
            return aiConfig;
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            throw new AppError("Erro ao buscar a configuração da IA.", 500, error);
        }
    }

    async updateCallingStatuses(clientId: string, botId: string, updates: ICallingStatusUpdate[]): Promise<MongooseBulkWriteResult> {
        try {
            if (!updates || updates.length === 0) {
                return {
                    ok: 1,
                    result: { ok: 1, n: 0 },
                    insertedCount: 0,
                    matchedCount: 0,
                    modifiedCount: 0,
                    deletedCount: 0,
                    upsertedCount: 0,
                    upsertedIds: {},
                    insertedIds: {}
                } as unknown as MongooseBulkWriteResult;
            }

            const bulkOperations = updates.map(update => ({
                updateOne: {
                    filter: {
                        clientId,
                        botId,
                        "callings.key": update.key
                    },
                    update: {
                        $set: { "callings.$.enabled": update.enabled }
                    }
                }
            }));

            const result = await AIModel.bulkWrite(bulkOperations);
            return result;
        } catch (error: any) {
            throw new AppError("Erro ao executar a atualização em massa das callings", 500, error);
        }
    }

    /**
     * Atualiza parcialmente a configuração de IA de um bot.
     */
    async updateAIConfig(clientId: string, botId: string, update: UpdateQuery<IAIModel>): Promise<IAIModel | null> {
        try {
            const aiConfig = await AIModel.findOneAndUpdate(
                { clientId, botId },
                update,
                { new: true }
            ).exec();

            if (!aiConfig) {
                throw new AppError("Configuração de IA não encontrada para atualização", 404);
            }
            return aiConfig;
        } catch (error: any) {
            throw new AppError("Erro ao atualizar a configuração da IA", 400, error);
        }
    }

    /**
     * Deleta a configuração de IA de um bot.
     */
    async deleteAIConfig(clientId: string, botId: string): Promise<{ deletedCount: number }> {
        try {
            const result = await AIModel.deleteOne({ clientId, botId }).exec();
            if (result.deletedCount === 0) {
                throw new AppError("Configuração de IA não encontrada para exclusão", 404);
            }
            return result;
        } catch (error: any) {
            throw new AppError("Erro ao deletar a configuração da IA", 500, error);
        }
    }
}

export const aiManager = new AIManager();