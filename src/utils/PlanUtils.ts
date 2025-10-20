import { IUser } from "../models/UserModel";

/**
 * Retorna true se o plano do cliente está ativo.
 */
export function isPlanActive(client: IUser): boolean {
    const expiresAt = client.plan?.expiresAt;
    if (!expiresAt) return false;

    return new Date(expiresAt).getTime() > Date.now();
}

/**
 * Retorna true se o plano expirou.
 */
export function isPlanExpired(client: IUser): boolean {
    const expiresAt = client.plan?.expiresAt;
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
export function getPlanLevel(client: IUser): number {
    const planName = client.plan?.name?.toLowerCase();

    switch (planName) {
        case "standard":
            return 1;
        case "business":
            return 2;
        case "enterprise":
            return 3;
        default:
            return 0;
    }
}

/**
 * Retorna quantos dias faltam para o plano expirar.
 * Se já expirou, retorna número negativo.
 */
export function getDaysUntilExpiration(client: IUser): number {
    const expiresAt = client.plan?.expiresAt;
    if (!expiresAt) return -999;

    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Retorna true se o plano expira em até X dias (por padrão, 7)
 */
export function willExpireSoon(client: IUser, daysBefore: number = 7): boolean {
    const daysRemaining = getDaysUntilExpiration(client);
    return daysRemaining > 0 && daysRemaining <= daysBefore;
}

/**
 * Retorna true se o cliente possui slots disponíveis.
 */
export function hasAvailableSlots(client: IUser, usedSlots: number): boolean {
    const planLimits: Record<string, number> = {
        none: 0,
        standard: 1,
        business: 2,
        enterprise: 4,
    };

    const planName = client.plan?.name || "none";
    const extraSlots = client.plan?.extraSlots || 0;
    const maxAllowed = planLimits[planName] + extraSlots;

    return usedSlots < maxAllowed;
};