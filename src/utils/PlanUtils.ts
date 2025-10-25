import { ISubscription } from "../models";
import { IUser } from "../models/UserModel";
import { TypePayment } from "./TypePayment";

/**
 * Retorna true se o plano do cliente está ativo.
 */
export function isPlanActive(planUser: ISubscription): boolean {
    const expiresAt = planUser.expiresAt;
    if (!expiresAt) return false;

    return new Date(expiresAt).getTime() > Date.now();
}

/**
 * Retorna true se o plano expirou.
 */
export function isPlanExpired(planUser: ISubscription): boolean {
    const expiresAt = planUser.expiresAt;
    if (!expiresAt) return true;

    return new Date(expiresAt).getTime() <= Date.now();
}

/**
 * Retorna o nível numérico do plano do cliente:
 * 1 = Standard
 * 2 = Business
 * 3 = Enterprise
 * 0 = Nenhum (ou plano inválido)
 */
export function getPlanLevel(planName: TypePayment | null = null): number {
    switch (planName) {
        case TypePayment.STANDARD:
            return 1;
        case TypePayment.BUSINESS:
            return 2;
        case TypePayment.ENTERPRISE:
            return 3;
        default:
            return 0;
    }
}

/**
 * Retorna quantos dias faltam para o plano expirar.
 * Se já expirou, retorna número negativo.
 */
export function getDaysUntilExpiration(planUser: ISubscription): number {
    const expiresAt = planUser.expiresAt;
    if (!expiresAt) return -999;

    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Retorna true se o plano expira em até X dias (por padrão, 7)
 */
export function willExpireSoon(planUser: ISubscription, daysBefore: number = 7): boolean {
    const daysRemaining = getDaysUntilExpiration(planUser);
    return daysRemaining > 0 && daysRemaining <= daysBefore;
}

/**
 * Retorna true se o cliente possui slots disponíveis.
 */
export function hasAvailableSlots(planUser: ISubscription, usedSlots: number): boolean {
    const planLimits: Record<string, number> = {
        none: 0,
        standard: 1,
        business: 2,
        enterprise: 4,
    };

    const planName = planUser.planName || "none";
    const extraSlots = planUser.extraSlots?.slots?.reduce(
        (acc: number, s: { count: number }) =>
            acc + (s.count ?? 0), 0,
    ) ?? 0;
    const maxAllowed = planLimits[planName] + extraSlots;

    return usedSlots < maxAllowed;
};