import mongoose, { Document, Schema } from "mongoose";

export interface IRefund extends Document {
    clientId: string;
    paymentId: string;
    sessionId: string;
    transactionId: string | null;
    amount: number;
    reason: string;
    gateway: "mercadopago" | "manual";
    status: "pending" | "approved" | "failed";
    refundDate: Date;
    metadata?: Record<string, any>;
}

const RefundSchema = new Schema<IRefund>(
    {
        clientId: { type: String, required: true },
        paymentId: { type: String, required: true },
        sessionId: { type: String, required: true },
        transactionId: { type: String, default: null },
        amount: { type: Number, required: true },
        reason: { type: String, required: true },
        gateway: {
            type: String,
            enum: ["mercadopago", "manual", "pix", "stripe"],
            default: "mercadopago",
        },
        status: {
            type: String,
            enum: ["pending", "approved", "failed"],
            default: "pending",
        },
        refundDate: { type: Date, default: Date.now },
        metadata: { type: Object, default: {} },
    },
    { timestamps: true }
);

export const RefundModel = mongoose
    .connection
    .useDb("vx-chatbot-pro")
    .model<IRefund>("refund", RefundSchema);