import mongoose, { Schema, Document, type Model } from "mongoose";

export interface IBot extends Document {
    clientId: string;
    phone: string;
    sessionId: string;
    name: string;
    replicaNumber: number;
    lastCheck: string;
    url?: string;
    authorization?: string;
    status: "connected" | "disconnected";
};

export type IBotCreate = Omit<IBot, keyof Document>;

const BotSchema = new Schema<IBot>(
    {
        clientId: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        sessionId: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        },
        replicaNumber: {
            type: Number,
            default: 0,
        },
        lastCheck: {
            type: String,
            required: true
        },
        url: {
            type: String,
            default: ""
        },
        authorization: {
            type: String,
            default: ""
        },
        status: {
            type: String,
            required: true
        },
    }
);

export const BotModel: Model<IBot> = mongoose.connection.useDb("vx-chatbot-pro").model<IBot>("bot", BotSchema);