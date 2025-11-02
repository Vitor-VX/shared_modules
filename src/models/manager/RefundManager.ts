import { AppError } from "../../utils";
import { RefundModel, IRefund } from "../RefundModel";

export class RefundManager {
    static async createRefund(data: {
        clientId: string;
        paymentId: string;
        sessionId: string;
        transactionId: string | null;
        amount: number;
        reason: string;
        gateway?: "mercadopago" | "manual" | "pix" | "stripe";
        status?: "pending" | "approved" | "failed";
        metadata?: Record<string, any>;
    }): Promise<IRefund> {
        try {
            const refund = await RefundModel.create({
                ...data,
                refundDate: new Date(),
            })
            return refund;
        } catch (error) {
            console.error("[RefundManager:createRefund]", error);
            throw new AppError("Erro ao criar registro de reembolso.", 500, error);
        }
    }

    static async getRefundsByClientId(clientId: string): Promise<IRefund[]> {
        try {
            return await RefundModel.find({ clientId }).sort({ createdAt: -1 });
        } catch (error) {
            throw new AppError("Erro ao buscar reembolsos do cliente.", 500, error);
        }
    }

    static async getRefundsByPayment(sessionId: string): Promise<IRefund[]> {
        try {
            return await RefundModel.find({ sessionId }).sort({ createdAt: -1 });
        } catch (error) {
            throw new AppError("Erro ao buscar reembolsos por pagamento.", 500, error);
        }
    }

    static async updateRefund(
        sessionId: string,
        updates: Partial<IRefund>
    ): Promise<IRefund | null> {
        try {
            const refund = await RefundModel.findOneAndUpdate(
                { sessionId },
                { $set: { ...updates, updatedAt: new Date() } },
                { new: true }
            );

            if (!refund) {
                throw new AppError("Reembolso não encontrado para atualização.", 404);
            }

            return refund;
        } catch (error) {
            console.error("[RefundManager:updateRefund]", error);
            if (error instanceof AppError) throw error;
            throw new AppError("Erro ao atualizar registro de reembolso.", 500, error);
        }
    }
};