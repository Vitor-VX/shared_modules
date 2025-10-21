import mongoose, { type Document } from "mongoose";

export interface MetricAI extends Document {
    clientId: string;
    name: string;
    number: string;
    lastMessage: string;
    botName: string;
    botNumber: string;
    category: string;
    reason: string;
    timestamp: string;
}

const MetricAISchema = new mongoose.Schema<MetricAI>({
    clientId: { type: String, required: true },
    name: { type: String, required: true },
    number: { type: String, required: true },
    lastMessage: { type: String, required: true },
    botNumber: { type: String, required: true },
    botName: { type: String, required: true },
    category: { type: String, required: true },
    reason: { type: String, required: true },
    timestamp: { type: String, required: true },
});

export const MetricAIModel = mongoose.connection.useDb("vx-chatbot-pro").model<MetricAI>("metricAI", MetricAISchema);