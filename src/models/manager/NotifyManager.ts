import { AppError } from "../../utils/AppError";
import Notify, { INotify } from "../NotifyModel";
import mongoose from "mongoose";

export class NotifyManager {
    static async create(data: {
        clientId: string,
        name: string;
        email: string;
        device: { token: string } | null;
    }): Promise<INotify> {
        try {
            if (!data.email) {
                throw new AppError("Email inválido.", 400);
            }

            const existing = await Notify.findOne({ email: data.email });

            if (existing) {
                existing.clientId = data.clientId;
                existing.name = data.name;
                existing.device = data.device || null;
                await existing.save();
                return existing.toObject() as INotify;
            }

            const newNotif = new Notify({
                clientId: data.clientId,
                name: data.name,
                email: data.email,
                device: data.device || null
            });

            await newNotif.save();
            return newNotif.toObject() as INotify;

        } catch (error: any) {
            console.error("Erro ao criar/atualizar notify:", error);

            if (error instanceof AppError) throw error;

            throw new AppError(
                `Não foi possível criar/atualizar o notify: ${error.message || "Erro desconhecido"}`,
                500
            );
        }
    }

    static async getById(id: string): Promise<INotify> {
        try {
            if (!id || !mongoose.Types.ObjectId.isValid(id)) {
                throw new AppError("ID inválido.", 400);
            }

            const notif = await Notify.findOne({ clientId: id });
            if (!notif) throw new AppError("Notify não encontrado.", 404);

            return notif;
        } catch (error: any) {
            console.error(`Erro ao buscar notify por ID ${id}:`, error);
            if (error instanceof AppError) throw error;

            throw new AppError(`Não foi possível buscar o notify: ${error.message}`, 500);
        }
    }

    static async getByEmail(email: string): Promise<INotify | null> {
        try {
            if (!email) {
                throw new AppError("Email inválido.", 400);
            }

            const notif = await Notify.findOne({ email }).lean<INotify>();
            return notif || null;

        } catch (error: any) {
            console.error(`Erro ao buscar notify por email ${email}:`, error);

            if (error instanceof AppError) throw error;

            throw new AppError(`Erro ao buscar notify por email: ${error.message}`, 500);
        }
    }

    static async update(id: string, updateData: Partial<INotify>): Promise<INotify | null> {
        try {
            if (!id || !mongoose.Types.ObjectId.isValid(id)) {
                throw new AppError("ID inválido.", 400);
            }

            const updated = await Notify.findByIdAndUpdate(
                id,
                { $set: updateData },
                { new: true, runValidators: true }
            ).lean<INotify>().select("-__v");

            return updated || null;

        } catch (error: any) {
            console.error(`Erro ao atualizar notify ${id}:`, error);

            if (error instanceof AppError) throw error;

            throw new AppError(`Não foi possível atualizar: ${error.message}`, 500);
        }
    }

    static async updateDeviceToken(id: string, token: string, ip?: string): Promise<INotify | null> {
        try {
            if (!id || !mongoose.Types.ObjectId.isValid(id)) {
                throw new AppError("ID inválido.", 400);
            }
            if (!token) throw new AppError("Token inválido.", 400);

            const updated = await Notify.findByIdAndUpdate(
                id,
                {
                    $set: {
                        "device.token": token,
                        "device.ip": ip || ""
                    }
                },
                { new: true, runValidators: true }
            ).lean<INotify>().select("-__v");

            return updated || null;

        } catch (error: any) {
            console.error(`Erro ao atualizar device token do notify ${id}:`, error);

            throw new AppError(`Não foi possível atualizar token do dispositivo: ${error.message}`, 500);
        }
    }

    static async delete(id: string): Promise<INotify | null> {
        try {
            if (!id || !mongoose.Types.ObjectId.isValid(id)) {
                throw new AppError("ID inválido.", 400);
            }

            const deleted = await Notify.findByIdAndDelete(id).lean<INotify>();
            return deleted || null;

        } catch (error: any) {
            console.error(`Erro ao deletar notify ${id}:`, error);

            if (error instanceof AppError) throw error;

            throw new AppError(`Não foi possível deletar: ${error.message}`, 500);
        }
    }
};