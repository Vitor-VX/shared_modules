import { AppError } from "../../utils/AppError";
import { MetricAIModel } from "../AIMetricsModel";

interface CreateMetricParams {
    clientId: string;
    name: string;
    number: string;
    lastMessage: string;
    botName: string;
    botNumber: string;
    category: string;
    reason: string;
    timestamp: string;
}

export class MetricAIManager {
    async createMetric(data: CreateMetricParams): Promise<void> {
        try {
            await MetricAIModel.create(data);
        } catch (e: any) {
            throw new AppError(`Erro ao salvar métrica de IA: ${e.message}`, 500);
        }
    }

    async getAllMetrics(clientId: string): Promise<CreateMetricParams[]> {
        try {
            const metrics = await MetricAIModel.find({ clientId })
                .sort({ timestamp: -1 })
                .lean<CreateMetricParams[]>();
            return metrics;
        } catch (e: any) {
            throw new AppError(`Erro ao buscar métricas do cliente: ${e.message}`, 500);
        }
    }

    async getMetricsByNumber(clientId: string, number: string): Promise<CreateMetricParams[]> {
        try {
            const metrics = await MetricAIModel.find({ clientId, number }).lean<CreateMetricParams[]>();
            return metrics;
        } catch (e: any) {
            throw new AppError(`Erro ao buscar métricas do número ${number}: ${e.message}`, 500);
        }
    }

    async getMetricsByCategory(clientId: string, category: string): Promise<CreateMetricParams[]> {
        try {
            const metrics = await MetricAIModel.find({ clientId, category }).lean<CreateMetricParams[]>();
            return metrics;
        } catch (e: any) {
            throw new AppError(`Erro ao buscar métricas da categoria ${category}: ${e.message}`, 500);
        }
    }

    async getMetricsByBotName(clientId: string, botName: string): Promise<CreateMetricParams[]> {
        try {
            const metrics = await MetricAIModel.find({ clientId, botName }).lean<CreateMetricParams[]>();
            return metrics;
        } catch (e: any) {
            throw new AppError(`Erro ao buscar métricas do bot ${botName}: ${e.message}`, 500);
        }
    }

    async getMetricsByCategoryAndBot(clientId: string, category: string, botName: string): Promise<CreateMetricParams[]> {
        try {
            const metrics = await MetricAIModel.find({ clientId, category, botName }).lean<CreateMetricParams[]>();
            return metrics;
        } catch (e: any) {
            throw new AppError(`Erro ao buscar métricas da categoria ${category} para o bot ${botName}: ${e.message}`, 500);
        }
    }

    async deleteAllMetricsByClient(clientId: string): Promise<number> {
        try {
            const result = await MetricAIModel.deleteMany({ clientId });
            return result.deletedCount || 0;
        } catch (e: any) {
            throw new AppError(`Erro ao deletar métricas do cliente ${clientId}: ${e.message}`, 500);
        }
    }

    async deleteMetricsByBot(clientId: string, botName: string): Promise<number> {
        try {
            const result = await MetricAIModel.deleteMany({ clientId, botName });
            return result.deletedCount || 0;
        } catch (e: any) {
            throw new AppError(`Erro ao deletar métricas do bot ${botName} para cliente ${clientId}: ${e.message}`, 500);
        }
    }

    async deleteMetricsByClientNumber(clientId: string, clientNumber: string, botName: string): Promise<number> {
        try {
            const result = await MetricAIModel.deleteMany({ clientId, number: clientNumber, botName });
            return result.deletedCount || 0;
        } catch (e: any) {
            throw new AppError(`Erro ao deletar métricas do número ${clientNumber}: ${e.message}`, 500);
        }
    }

    async deleteMetricById(clientId: string, id: string): Promise<boolean> {
        try {
            const result = await MetricAIModel.deleteOne({ _id: id, clientId });
            if (result.deletedCount === 0) throw new AppError("Métrica não encontrada para este cliente.", 404);
            return true;
        } catch (e: any) {
            throw new AppError(`Erro ao deletar métrica: ${e.message}`, 500);
        }
    }

    async hasClientMadePayment(clientId: string, clientNumber: string, botName: string): Promise<boolean> {
        try {
            const paymentMetric = await MetricAIModel.findOne({
                clientId,
                number: clientNumber,
                botName,
                category: "payment_made"
            }).lean();

            return !!paymentMetric;
        } catch (e: any) {
            throw new AppError(`Erro ao verificar pagamento para ${clientNumber} no bot ${botName}: ${e.message}`, 500);
        }
    }
}

export const metricAIManager = new MetricAIManager();