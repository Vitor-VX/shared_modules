import mongoose, { Schema, model, type Model, type Document } from '../database';

export interface INodeConnection {
    target: string;
    handle: string;
}

export interface IFunnelNode {
    id: string;
    type: string;
    position: { x: string; y: string };
    data: {
        label: string;
        content: string;
        nextNodes: INodeConnection[];
    };
}

export interface IFunnel extends Document {
    clientId: string;
    botId: string;
    isActive: boolean;
    nodes: IFunnelNode[]; 
    lastModified: Date;
}

const NodeConnectionSchema = new Schema<INodeConnection>({
    target: { type: String, required: true },
    handle: { type: String, required: true }
}, { _id: false });

const FunnelNodeDataSchema = new Schema({
    label: { type: String, required: true },
    content: { type: String, default: "" },
    nextNodes: { type: [NodeConnectionSchema], default: [] }
}, { _id: false });

const FunnelNodeSchema = new Schema<IFunnelNode>({
    id: { type: String, required: true },
    type: { type: String, required: true },
    position: {
        x: { type: String, required: true },
        y: { type: String, required: true }
    },
    data: { type: FunnelNodeDataSchema, required: true }
}, { _id: false });

const FunnelSchema = new Schema<IFunnel>(
    {
        clientId: {
            type: String,
            required: true
        },
        botId: {
            type: String,
            required: true,
        },
        isActive: {
            type: Boolean,
            default: false,
        },
        nodes: {
            type: [FunnelNodeSchema],
            required: true
        },
        lastModified: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true
    }
);

export const FunnelModel: Model<IFunnel> = mongoose.connection.useDb("vx-chatbot-pro").model<IFunnel>("funnel", FunnelSchema); 