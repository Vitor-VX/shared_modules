import mongoose, { Schema, type Model, type Document as MongooseDocument } from "mongoose";

export interface IMetricBucket extends MongooseDocument {
    clientId: string;
    botId: string;
    timestamp: Date,
    totalMessages: number;
    totalPaymentsValue: number;
    totalPaymentsCount: number;
    conversationsStarted: number;
    totalResponseTimeSeconds: number;
    responseCount: number;
};

const MetricBucketSchema = new Schema<IMetricBucket>({
    clientId: { type: String, required: true },
    botId: { type: String, required: true },
    timestamp: { type: Date, required: true },
    totalMessages: { type: Number, default: 0 },
    totalPaymentsValue: { type: Number, default: 0 },
    totalPaymentsCount: { type: Number, default: 0 },
    conversationsStarted: { type: Number, default: 0 },
    totalResponseTimeSeconds: { type: Number, default: 0 },
    responseCount: { type: Number, default: 0 },
});

export const MetricBucketModel:
    Model<IMetricBucket> = mongoose
        .connection
        .useDb("vx-chatbot-pro")
        .model<IMetricBucket>("MetricBucket", MetricBucketSchema);