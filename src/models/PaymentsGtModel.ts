import mongoose, { Schema, Document } from "mongoose";
import { Gateway } from "../utils";

export enum PaymentStatus {
    PAID = "paid",
    PENDING = "pending",
    REFUNDED = "refunded",
    EXPIRED = "expired",
    FAILED = "failed"
};

export interface IPaymentsGT extends Document {
    botId: string;
    clientId: string;
    transactionId: string;
    sessionId: string;
    client: {
        phone: string;
        name: string;
    },
    amount: {
        original: number,
        formatted: string;
    };
    gateway: Gateway;
    status: {
        current: PaymentStatus,
        lastUpdate: Date
    };
    lastWebhookAt: Date | null;
    lastPollingAt: Date | null;
}

const ClientSchema = new Schema({
    phone: { type: String, default: null },
    name: { type: String, default: "Desconhecido" }
}, { _id: false });

const AmountSchema = new Schema({
    original: { type: Number, default: 0 },
    formatted: { type: String, default: null }
}, { _id: false });

const StatusSchema = new Schema({
    current: {
        type: String,
        enum: Object.values(PaymentStatus),
        default: PaymentStatus.PENDING
    },
    lastUpdate: { type: Date, default: Date.now }
}, { _id: false });

const PaymentsGtSchema = new Schema<IPaymentsGT>(
    {
        botId: { type: String, required: true },
        clientId: { type: String, required: true },
        transactionId: { type: String, default: null },
        sessionId: { type: String, default: null },
        client: { type: ClientSchema, required: true },
        amount: { type: AmountSchema, required: true },
        gateway: { type: String, enum: [Gateway.MP, Gateway.PAGBANK, Gateway.STRIPE] },
        status: { type: StatusSchema },
        lastWebhookAt: { type: Date, default: null },
        lastPollingAt: { type: Date, default: null },
    },
    { timestamps: true }
);

export const PaymentsGtModel = mongoose
    .connection
    .useDb("vx-chatbot-pro")
    .model<IPaymentsGT>("payments-gt", PaymentsGtSchema);