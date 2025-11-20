import mongoose, { Schema, type Document } from "mongoose";

export interface INotify extends Document {
    clientId: string;
    name: string;
    email: string;
    device: {
        jwt: string | null;
        token: string | null;
    } | null;
};

const DeviceSchema = new Schema({
    jwt: { type: String, default: "" },
    token: { type: String, default: "", required: true }
});

const NotifySchema = new Schema<INotify>(
    {
        clientId: { type: String, required: true },
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        device: { type: DeviceSchema, default: null }
    },
    {
        timestamps: true
    }
);

export default mongoose.connection.useDb("vx-chatbot-pro").model<INotify>("notify", NotifySchema);