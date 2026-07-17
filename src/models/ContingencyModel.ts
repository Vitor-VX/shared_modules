import mongoose, { Schema, Document, type Model } from "mongoose";

export interface IContingency extends Document {
    clientId: string;
    sessionId: string;
    botId: string;
    token: string;
    adAccountId: string;
    adAccountName?: string;
    campaignIds: string[];
}

export type IContingencyCreate = Omit<IContingency, keyof Document>;

const ContingencySchema = new Schema<IContingency>(
    {
        clientId: {
            type: String,
            required: true
        },
        sessionId: {
            type: String,
            required: true
        },
        botId: {
            type: String,
            required: true,
            index: true
        },
        token: {
            type: String,
            required: true
        },
        adAccountId: {
            type: String,
            required: true
        },
        adAccountName: {
            type: String,
            default: ""
        },
        campaignIds: {
            type: [String],
            default: []
        }
    },
    {
        timestamps: true
    }
);

export const ContingencyModel: Model<IContingency> = mongoose.connection
    .useDb("vx-chatbot-pro")
    .model<IContingency>("contingency", ContingencySchema);