import mongoose, { Schema, type Model, type Document as MongooseDocument } from "mongoose";

export interface IClientInfo {
    name: string;
    phone: string;
    currentNode: string;
    waiting: boolean;
    completedFunnel: boolean;
    variables: Record<string, any>;
};

export interface IClientState extends MongooseDocument {
    clientId: string;
    botId: string;
    client: IClientInfo;
    lastInteraction: Date;
};

const ClientInfoSchema = new Schema<IClientInfo>({
    phone: { type: String, required: true },
    name: { type: String, required: true },
    currentNode: { type: String, default: "1" },
    waiting: { type: Boolean, default: false },
    completedFunnel: { type: Boolean, default: false },
    variables: {
        type: Schema.Types.Mixed,
        default: {}
    }
}, { _id: false });

const ClientStateSchema = new Schema<IClientState>(
    {
        clientId: {
            type: String,
            required: true
        },
        botId: {
            type: String,
            required: true,
        },
        client: {
            type: ClientInfoSchema,
            required: true
        },
        lastInteraction: {
            type: Date,
            default: Date.now()
        },
    },
    {
        timestamps: true
    }
);

export const ClientStateModel: Model<IClientState> = mongoose.connection.useDb("vx-chatbot-pro").model<IClientState>("client", ClientStateSchema);