import mongoose, { Schema, type Document } from "mongoose";
import { TypePayment } from "../utils";

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    phone: string;
    sessionToken: string;
    activation: {
        token: string;
        createdAt: Date | null;
        isActivated: boolean;
    };
    plan: {
        id: string;
        name: TypePayment;
        purchasedAt: Date | null;
        expiresAt: Date | null;
        extraSlots: number | 0;
    };
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

        activation: {
            token: { type: String, default: "" },
            createdAt: { type: Date, default: null },
            isActivated: { type: Boolean, default: false }
        },

        plan: {
            id: { type: String, default: "" },
            name: {
                type: String,
                enum: [TypePayment.NONE, TypePayment.STANDARD, TypePayment.BUSINESS, TypePayment.ENTERPRISE],
                default: TypePayment.NONE
            },
            purchasedAt: { type: Date, default: null },
            expiresAt: { type: Date, default: null },
            extraSlots: { type: Number, default: 0 }
        },

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