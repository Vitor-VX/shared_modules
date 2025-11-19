import { AppError } from "../../utils/AppError";
import User, { IUser } from "../UserModel";
import bcrypt from "bcrypt";
import crypto from "crypto";

export class UserManager {
    public static async createUser(userData: {
        name: string;
        email: string;
        phone: string;
        password: string;
    }): Promise<IUser> {
        try {
            const newUser = new User({
                name: userData.name,
                email: userData.email,
                phone: userData.phone,
                password: userData.password
            });
            await newUser.save();
            return newUser.toObject() as IUser;
        } catch (error: any) {
            console.error("Erro ao criar usuário:", error);
            if (error.code === 11000) {
                throw new AppError(`Email "${userData.email}" já está em uso.`, 409);
            }
            throw new AppError(`Não foi possível criar o usuário: ${error.message || "Erro desconhecido"}`, 500);
        }
    }

    public static async getUserById(userId: string): Promise<IUser> {
        try {
            if (!userId || typeof userId !== "string" || !User.base.Types.ObjectId.isValid(userId)) {
                throw new AppError("ID do usuário inválido.", 400);
            }

            const user = await User.findById(userId).lean<IUser>().select("-__v -password");
            if (!user) throw new AppError("Usuário não existe.", 404);

            return user;
        } catch (error: any) {
            console.error(`Erro ao buscar usuário por ID ${userId}:`, error);
            if (error instanceof AppError) throw error;
            throw new AppError(`Não foi possível buscar o usuário: ${error.message || "Erro desconhecido"}`, 500);
        }
    }

    public static async getUserByEmail(email: string): Promise<IUser | null> {
        try {
            if (!email || typeof email !== "string" || !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
                throw new AppError("Formato de email inválido.", 400);
            }

            const user = await User.findOne({ email }).lean<IUser>();
            return user || null;
        } catch (error: any) {
            console.error(`Erro ao buscar usuário por email ${email}:`, error);
            if (error instanceof AppError) throw error;
            throw new AppError(`Não foi possível buscar o usuário por email: ${error.message || "Erro desconhecido"}`, 500);
        }
    }

    public static async updateUser(userId: string, updateData: Partial<IUser>): Promise<IUser | null> {
        try {
            if (!userId || typeof userId !== "string" || !User.base.Types.ObjectId.isValid(userId)) {
                throw new AppError("ID do usuário inválido para atualização.", 400);
            }

            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { $set: updateData },
                { new: true, runValidators: true }
            ).lean<IUser>();

            return updatedUser || null;
        } catch (error: any) {
            console.error(`Erro ao atualizar usuário ${userId}:`, error);
            if (error.code === 11000) {
                throw new AppError(`O email "${(updateData as any).email}" já está em uso por outro usuário.`, 409);
            }
            throw new AppError(`Não foi possível atualizar o usuário: ${error.message || "Erro desconhecido"}`, 500);
        }
    }

    public static async updateBasicUserInfo(
        userId: string,
        basicInfo: { name: string; phone: string }
    ): Promise<IUser | null> {
        try {
            if (!userId || typeof userId !== "string" || !User.base.Types.ObjectId.isValid(userId)) {
                throw new AppError("ID do usuário inválido para atualização.", 400);
            }

            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { $set: { name: basicInfo.name, phone: basicInfo.phone } },
                { new: true, runValidators: true }
            ).lean<IUser>().select("-__v -password");

            return updatedUser || null;
        } catch (error: any) {
            console.error(`Erro ao atualizar usuário ${userId}:`, error);
            throw new AppError(`Não foi possível atualizar o usuário: ${error.message || "Erro desconhecido"}`, 500);
        }
    }

    public static async deleteUser(userId: string): Promise<IUser | null> {
        try {
            if (!userId || typeof userId !== "string" || !User.base.Types.ObjectId.isValid(userId)) {
                throw new AppError("ID do usuário inválido para deleção.", 400);
            }

            const deletedUser = await User.findByIdAndDelete(userId).lean<IUser>();
            return deletedUser || null;
        } catch (error: any) {
            console.error(`Erro ao deletar usuário ${userId}:`, error);
            if (error instanceof AppError) throw error;
            throw new AppError(`Não foi possível deletar o usuário: ${error.message || "Erro desconhecido"}`, 500);
        }
    }

    public static async setActivationToken(userId: string, newToken: string): Promise<IUser | null> {
        try {
            if (!userId || !User.base.Types.ObjectId.isValid(userId)) {
                throw new AppError("ID inválido.", 400);
            }
            if (!newToken || typeof newToken !== "string") {
                throw new AppError("Token inválido.", 400);
            }

            const updatedUser = await User.findByIdAndUpdate(
                userId,
                {
                    $set: {
                        "activation.token": newToken,
                        "activation.createdAt": new Date(),
                        "activation.isActivated": false
                    }
                },
                { new: true, runValidators: true }
            ).lean<IUser>();

            return updatedUser || null;
        } catch (error: any) {
            console.error(`Erro ao definir token de ativação:`, error);
            throw new AppError(`Não foi possível definir o token: ${error.message || "Erro desconhecido"}`, 500);
        }
    }

    public static async verifyEmail(verificationToken: string): Promise<IUser | null> {
        try {
            if (!verificationToken || typeof verificationToken !== "string") {
                throw new AppError("Token de verificação de email inválido.", 400);
            }

            const user = await User.findOne({
                "emailVerification.token": verificationToken,
                "emailVerification.verified": false,
            });

            if (!user) return null;

            user.emailVerification.verified = true;
            user.emailVerification.token = "";
            user.emailVerification.createdAt = null;

            await user.save();
            return user.toObject() as IUser;
        } catch (error: any) {
            console.error(`Erro ao verificar email com token ${verificationToken}:`, error);
            if (error instanceof AppError) throw error;
            throw new AppError(`Não foi possível verificar o email: ${error.message || "Erro desconhecido"}`, 500);
        }
    }

    public static async setEmailVerificationToken(userId: string, newToken: string): Promise<IUser | null> {
        try {
            if (!userId || typeof userId !== "string" || !User.base.Types.ObjectId.isValid(userId)) {
                throw new AppError("ID do usuário inválido.", 400);
            }
            if (!newToken || typeof newToken !== "string") {
                throw new AppError("Novo token de verificação de email inválido.", 400);
            }

            const updatedUser = await User.findByIdAndUpdate(
                userId,
                {
                    $set: {
                        "emailVerification.token": newToken,
                        "emailVerification.createdAt": new Date(),
                        "emailVerification.verified": false
                    }
                },
                { new: true, runValidators: true }
            ).lean<IUser>();

            return updatedUser || null;
        } catch (error: any) {
            console.error(`Erro ao definir token de verificação de email para usuário ${userId}:`, error);
            if (error instanceof AppError) throw error;
            throw new AppError(`Não foi possível definir o token de verificação de email: ${error.message || "Erro desconhecido"}`, 500);
        }
    }

    public static async updateUserPlanSlots(userId: string, newSlotCount: number): Promise<IUser | null> {
        try {
            if (!userId || !User.base.Types.ObjectId.isValid(userId)) {
                throw new AppError("ID inválido para atualizar slots.", 400);
            }

            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { $set: { "plan.extraSlots": newSlotCount } },
                { new: true, runValidators: true }
            ).lean<IUser>();

            return updatedUser || null;
        } catch (error: any) {
            console.error(`Erro ao atualizar slots do usuário ${userId}:`, error);
            throw new AppError("Não foi possível atualizar os slots do usuário.", 500);
        }
    }

    public static async assignPlanToUser(userId: string, sessionId: string, planName: string, extraSlots: number): Promise<IUser | null> {
        try {
            if (!userId || !User.base.Types.ObjectId.isValid(userId)) {
                throw new AppError("ID inválido para atribuição de plano.", 400);
            }

            const purchasedAt = new Date();
            const expiresAt = new Date(purchasedAt);
            expiresAt.setMonth(expiresAt.getMonth() + 1);

            const updatedUser = await User.findByIdAndUpdate(
                userId,
                {
                    $set: {
                        "plan.id": sessionId,
                        "plan.name": planName,
                        "plan.purchasedAt": purchasedAt,
                        "plan.expiresAt": expiresAt,
                        "plan.extraSlots": extraSlots
                    }
                },
                { new: true, runValidators: true }
            ).lean<IUser>();

            return updatedUser || null;
        } catch (error: any) {
            console.error(`Erro ao atribuir plano "${planName}" ao usuário ${userId}:`, error);
            throw new AppError(`Não foi possível atribuir o plano: ${error.message || "Erro desconhecido"}`, 500);
        }
    }

    public static async checkCredentials(email: string, password: string): Promise<IUser> {
        try {
            const user = await User.findOne({ email });
            if (!user) throw new AppError("Credenciais inválidas.", 401);

            const passwordMatch = await bcrypt.compare(password, user.password);
            if (!passwordMatch) throw new AppError("Credenciais inválidas.", 401);

            return user.toObject() as IUser;
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            
            throw new AppError(`Erro ao verificar credenciais: ${error.message}`, 500);
        }
    }

    public static async updateSessionToken(userId: string, newToken: string): Promise<IUser> {
        try {
            const sessionToken = newToken || crypto.randomUUID();

            const user = await User.findByIdAndUpdate(
                userId,
                { sessionToken },
                { new: true }
            );

            if (!user) throw new AppError(`Usuário com ID ${userId} não encontrado.`, 404);
            return user.toObject() as IUser;
        } catch (error: any) {
            console.error(`Erro ao atualizar token de sessão:`, error.message);
            throw new AppError(`Erro ao atualizar token de sessão: ${error.message}`, 500);
        }
    }
}