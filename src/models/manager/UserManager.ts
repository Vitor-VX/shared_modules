import { AppError } from "../../utils/AppError";
import User, { IUser } from "../UserModel";
import bcrypt from "bcrypt";
import crypto from "crypto";

export class UserManager {
    static async createUser(userData: {
        name: string;
        email: string;
        phone: string;
        password: string;
    }): Promise<IUser> {
        try {
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            const newUser = new User({
                name: userData.name,
                email: userData.email,
                phone: userData.phone,
                password: hashedPassword
            });
            await newUser.save();
            return newUser.toObject() as IUser;
        } catch (error: any) {
            if (error.code === 11000) throw new AppError(`Email "${userData.email}" já está em uso.`, 409);
            throw new AppError("Erro ao criar usuário.", 500);
        }
    }

    static async getUserByEmail(email: string): Promise<IUser> {
        const user = await User.findOne({ email });
        if (!user) throw new AppError("Usuário não encontrado.", 404);
        return user.toObject() as IUser;
    }

    static async getUserById(userId: string): Promise<IUser> {
        const user = await User.findById(userId);
        if (!user) throw new AppError("Usuário não encontrado.", 404);
        return user.toObject() as IUser;
    }

    static async validatePassword(
        email: string,
        password: string
    ): Promise<IUser> {
        const user = await User.findOne({ email });
        if (!user) throw new AppError("Usuário não encontrado.", 401);

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw new AppError("Credenciais inválidas.", 401);

        return user.toObject() as IUser;
    }

    static async generateToken(): Promise<string> {
        return crypto.randomBytes(32).toString("hex");
    }

    static async setLastLogin(userId: string, data: {
        ip: string;
        userAgent: string;
    }): Promise<void> {
        const updated = await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    "lastAccess.ip": data.ip,
                    "lastAccess.userAgent": data.userAgent,
                    "lastAccess.lastLogin": new Date()
                }
            },
            { new: true }
        );

        if (!updated) throw new AppError("Usuário não encontrado.", 404);
    }


    static async setRegisterInfo(userId: string, data: {
        ip: string;
        userAgent: string;
        fingerprint: string;
    }): Promise<void> {
        const updated = await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    registration: {
                        ip: data.ip,
                        userAgent: data.userAgent,
                        fingerprint: data.fingerprint,
                        createdAt: new Date()
                    }
                }
            }
        );

        if (!updated) throw new AppError("Usuário não encontrado.", 404);
    }

    static async setToken(email: string, token: string): Promise<void> {
        const updated = await User.findOneAndUpdate(
            { email },
            {
                $set: {
                    authToken: token
                }
            }
        );

        if (!updated) throw new AppError("Usuário não encontrado.", 404);
    }


      static async setEmailVerification(userId: string, tk: string): Promise<string> {
        const updated = await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    emailAuth: {
                        token: tk,
                        createdAt: new Date(),
                        verified: false
                    }
                }
            }
        );

        if (!updated) throw new AppError("Usuário não encontrado.", 404);
        return tk;
    }


    static async verifyEmail(token: string): Promise<void> {
        const user = await User.findOne({
            "emailAuth.token": token
        });
        if (!user) throw new AppError("Token inválido.", 400);

        user.emailAuth.verified = true;
        user.emailAuth.token = "";
        user.emailAuth.createdAt = null;

        await user.save();
    }
}