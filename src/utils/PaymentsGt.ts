export enum Gateway {
    MP = "mercado-pago",
    STRIPE = "stripe",
    PAGBANK = "pagbank"
};

export function formatCentsToReal(cents: number): number {
    return Number((cents / 100).toFixed(2));
}