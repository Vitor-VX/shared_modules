import mongoose, { Schema, Document } from "mongoose";
import { TypePayment } from "../utils";

export interface IExtraSlot {
    count: number;
    paymentID: string;
}

export interface ISubscription extends Document {
    clientId: string;
    planName: TypePayment;
    status: "active" | "expired" | "cancelled" | "refunded";
    startDate: Date;
    expiresAt: Date;
    paymentID: string;
    extraSlots: {
        expireAt: Date;
        slots: IExtraSlot[];
    };
}

const ExtraSlotSchema = new Schema<IExtraSlot>(
    {
        count: { type: Number, required: true },
        paymentID: { type: String, required: true },
    },
    { _id: false }
);

const ExtraSlotsWrapperSchema = new Schema(
    {
        expireAt: { type: Date, required: true },
        slots: { type: [ExtraSlotSchema], default: [] },
    },
    { _id: false }
);

const SubscriptionSchema = new Schema<ISubscription>(
    {
        clientId: { type: String, required: true },
        planName: {
            type: String,
            enum: [
                TypePayment.NONE,
                TypePayment.STANDARD,
                TypePayment.BUSINESS,
                TypePayment.ENTERPRISE,
            ],
            required: true,
        },
        status: {
            type: String,
            enum: ["active", "expired", "cancelled", "refunded"],
            default: "active",
        },
        startDate: { type: Date, default: Date.now },
        expiresAt: { type: Date, required: true },
        paymentID: { type: String, required: true },
        extraSlots: { type: ExtraSlotsWrapperSchema, default: { slots: [] } },
    },
    { timestamps: true }
);

export const SubscriptionModel = mongoose
    .connection
    .useDb("vx-chatbot-pro")
    .model<ISubscription>("subscription", SubscriptionSchema);