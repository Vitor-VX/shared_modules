import mongoose, { Schema, type Document } from "mongoose";

export interface IRegistration {
    ip: string;
    userAgent: string;
    fingerprint: string;
    createdAt: Date;
}

export interface ILastAccess {
    ip: string;
    userAgent: string;
    lastLogin: Date;
}

export interface IEmailAuth {
    token: string;
    createdAt: Date | null;
    verified: boolean;
}

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    phone: string;

    authToken: string;

    registration: IRegistration;
    lastAccess: ILastAccess;
    emailAuth: IEmailAuth;
}

const UserSchema = new Schema<IUser>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },

    authToken: { type: String, default: "" },

    registration: {
        ip: { type: String },
        userAgent: { type: String },
        fingerprint: { type: String },
        createdAt: { type: Date, default: Date.now }
    },

    lastAccess: {
        ip: { type: String },
        userAgent: { type: String },
        lastLogin: { type: Date }
    },

    emailAuth: {
        token: { type: String, default: "" },
        createdAt: { type: Date, default: null },
        verified: { type: Boolean, default: false }
    }
}, {
    timestamps: true
});

export default mongoose.connection.useDb("vx-chatbot-pro").model<IUser>("User", UserSchema);