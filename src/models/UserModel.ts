import mongoose, { Schema, type Document } from "mongoose";
import { TypePayment } from "../utils";

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    phone: string;
    sessionToken: string;
    emailVerification: {
        token: string;
        createdAt: Date | null;
        verified: boolean;
    };
}

const UserSchema = new Schema<IUser>(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        phone: { type: String, required: true },
        sessionToken: { type: String, default: "" },
        emailVerification: {
            token: { type: String, default: "" },
            createdAt: { type: Date, default: null },
            verified: { type: Boolean, default: false }
        },
    },
    {
        timestamps: true
    }
);

export default mongoose.connection.useDb("vx-chatbot-pro").model<IUser>("User", UserSchema);