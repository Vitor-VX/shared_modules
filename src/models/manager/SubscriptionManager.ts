import { AppError } from "../../utils/AppError";
import { SubscriptionModel, ISubscription } from "../Subscription";
import { TypePayment } from "../../utils/TypePayment";

export class SubscriptionManager {
    private static log(context: string, error: any) {
        console.error(`[SubscriptionManager:${context}]`, error);
    }

    static async createSubscription(data: {
        clientId: string;
        planName: TypePayment;
        paymentID: string;
        durationDays: number;
    }): Promise<ISubscription> {
        try {
            const startDate = new Date();
            const expiresAt = new Date(startDate.getTime() + data.durationDays * 86400000);

            return await SubscriptionModel.create({
                clientId: data.clientId,
                planName: data.planName,
                paymentID: data.paymentID,
                startDate,
                expiresAt,
                extraSlots: {
                    expireAt: expiresAt,
                    slots: []
                }
            });
        } catch (error: any) {
            this.log("createSubscription", error);
            throw new AppError("Erro ao criar assinatura", 500, error);
        }
    }

    static async upgradeSubscription({
        clientId,
        newPlan,
        paymentID,
        durationDays = 30
    }: {
        clientId: string;
        newPlan: TypePayment;
        paymentID: string;
        durationDays?: number;
    }) {
        try {
            const sub = await SubscriptionModel.findOne({ clientId, status: "active" });
            if (!sub) throw new AppError("Assinatura ativa não encontrada para upgrade.", 404);

            const now = new Date();
            const newExpiresAt = new Date(now.getTime() + durationDays * 86400000);

            sub.planName = newPlan;
            sub.paymentID = paymentID;
            sub.startDate = now;
            sub.expiresAt = newExpiresAt;
            sub.extraSlots.expireAt = newExpiresAt;

            await sub.save();
            return sub;
        } catch (error: any) {
            this.log("upgradeSubscription", error);
            throw new AppError("Erro ao processar upgrade de plano", 500, error);
        }
    }

    static async cancelSubscription(clientId: string, reason: string): Promise<ISubscription | null> {
        try {
            const sub = await this.getActiveSubscription(clientId);
            if (!sub) throw new AppError("Assinatura ativa não encontrada para cancelamento.", 404);

            sub.status = "cancelled";
            await sub.save();

            console.log(`[SubscriptionManager] Assinatura cancelada para clientId=${clientId}. Motivo: ${reason}`);
            return sub;
        } catch (error: any) {
            this.log("cancelSubscription", error);
            throw new AppError("Erro ao cancelar assinatura", 500, error);
        }
    }

    static async isExpiringSoon(clientId: string): Promise<boolean> {
        try {
            const sub = await this.getActiveSubscription(clientId);
            if (!sub) return false;

            const now = new Date();
            const diffMs = sub.expiresAt.getTime() - now.getTime();
            const diffDays = diffMs / (1000 * 60 * 60 * 24);

            return diffDays <= 7 && diffDays > 0;
        } catch (error: any) {
            this.log("isExpiringSoon", error);
            throw new AppError("Erro ao verificar expiração da assinatura", 500, error);
        }
    }

    static async getActiveSubscription(clientId: string): Promise<ISubscription | null> {
        try {
            return await SubscriptionModel.findOne({ clientId, status: "active" }).exec();
        } catch (error: any) {
            this.log("getActiveSubscription", error);
            throw new AppError("Erro ao buscar assinatura ativa", 500, error);
        }
    }

    static async isSubscriptionValid(clientId: string): Promise<boolean> {
        try {
            const sub = await this.getActiveSubscription(clientId);
            if (!sub) return false;

            const now = new Date();
            if (sub.expiresAt < now) {
                await this.expireSubscription(String(sub._id));
                return false;
            }
            return true;
        } catch (error: any) {
            this.log("isSubscriptionValid", error);
            return false;
        }
    }

    static async expireSubscription(subscriptionId: string): Promise<void> {
        try {
            await SubscriptionModel.findByIdAndUpdate(subscriptionId, { $set: { status: "expired" } }).exec();
        } catch (error: any) {
            this.log("expireSubscription", error);
            throw new AppError("Erro ao expirar assinatura", 500, error);
        }
    }

    static async renewSubscription(
        clientId: string,
        paymentID: string,
        durationDays: number,
        renewWithSlots: boolean
    ): Promise<ISubscription | null> {
        try {
            const now = new Date();
            const newExpiresAt = new Date(now.getTime() + durationDays * 86400000);
            const sub = await this.getActiveSubscription(clientId);
            if (!sub) throw new AppError("Assinatura não encontrada", 404);

            if (renewWithSlots) {
                sub.expiresAt = newExpiresAt;
                sub.extraSlots.expireAt = newExpiresAt;
            } else {
                sub.expiresAt = newExpiresAt;
                sub.extraSlots = { expireAt: sub.extraSlots.expireAt, slots: [] };
            }

            sub.paymentID = paymentID;
            sub.startDate = now;
            await sub.save();
            return sub;
        } catch (error: any) {
            this.log("renewSubscription", error);
            throw new AppError("Erro ao renovar assinatura", 500, error);
        }
    }

    static async addExtraSlots(clientId: string, count: number, paymentID: string): Promise<ISubscription | null> {
        try {
            const sub = await this.getActiveSubscription(clientId);
            if (!sub) throw new AppError("Assinatura ativa não encontrada", 404);

            sub.extraSlots.expireAt = sub.expiresAt;
            sub.extraSlots.slots.push({ count, paymentID });
            await sub.save();
            return sub;
        } catch (error: any) {
            this.log("addExtraSlots", error);
            throw new AppError("Erro ao adicionar slots extras", 500, error);
        }
    }

    static async removeExtraSlotsByPayment(clientId: string, paymentID: string): Promise<ISubscription | null> {
        try {
            const sub = await this.getActiveSubscription(clientId);
            if (!sub) throw new AppError("Assinatura ativa não encontrada", 404);

            sub.extraSlots.slots = sub.extraSlots.slots.filter(s => s.paymentID !== paymentID);
            await sub.save();
            return sub;
        } catch (error: any) {
            this.log("removeExtraSlotsByPayment", error);
            throw new AppError("Erro ao remover slots extras", 500, error);
        }
    }

    static async getTotalSlots(clientId: string): Promise<number> {
        try {
            const sub = await this.getActiveSubscription(clientId);
            if (!sub) return 0;
            return sub.extraSlots.slots.reduce((sum: number, s: any) => sum + s.count, 0);
        } catch (error: any) {
            this.log("getTotalSlots", error);
            throw new AppError("Erro ao calcular total de slots", 500, error);
        }
    }

    static async expireOutdatedSubscriptions(): Promise<void> {
        try {
            const now = new Date();
            await SubscriptionModel.updateMany(
                { expiresAt: { $lt: now }, status: "active" },
                { $set: { status: "expired" } }
            );
        } catch (error: any) {
            this.log("expireOutdatedSubscriptions", error);
            throw new AppError("Erro ao expirar assinaturas vencidas", 500, error);
        }
    }
}