import { AppError, formatCentsToReal, Gateway } from '../../utils';
import { PaymentsGtModel, PaymentStatus } from "../PaymentsGtModel";

class PaymentsGtManager {
    private log(message: string) {
        console.log(`[PaymentsGtManager] ${message}`);
    }

    /**
     * Cria ou atualiza um pagamento relacionado ao fluxo.
     * Sempre retorna o documento atualizado.
    */
    async create(data: {
        botId: string;
        clientId: string;
        sessionId: string;
        transactionId?: string,
        client: {
            phone: string;
            name: string | null;
        };
        amount: number;
        gateway: Gateway;
    }) {
        try {
            const payload = {
                botId: data.botId,
                clientId: data.clientId,
                sessionId: data.sessionId,
                client: {
                    phone: data.client.phone,
                    name: data.client.name,
                },
                amount: {
                    original: data.amount,
                    formatted: formatCentsToReal(data.amount),
                },
                gateway: data.gateway,
                transactionId: data.transactionId
            };

            const payment = await PaymentsGtModel.findOneAndUpdate(
                {
                    botId: data.botId,
                    clientId: data.clientId,
                    "client.phone": data.client.phone,
                },
                {
                    $set: payload,
                    $setOnInsert: {
                        status: {
                            current: PaymentStatus.PENDING,
                            lastUpdate: new Date()
                        }
                    }
                },
                { upsert: true, new: true }
            );

            this.log(
                `Pagamento salvo para botId=${data.botId}, clientId=${data.clientId}, session=${data.sessionId}.` +
                ` ID: ${payment._id}`
            );

            return payment;
        } catch (error: any) {
            this.log(`Erro ao criar pagamento: ${error.message || error}`);
            if (error instanceof AppError) throw error;

            throw new AppError(
                "Erro interno ao tentar registrar o pagamento.",
                500
            );
        }
    }
}

export const paymentsGtManager = new PaymentsGtManager();