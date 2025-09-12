import { AppError } from "../../utils/AppError";
import { FunnelModel, IFunnel, IFunnelNode } from "../FunnelModel";
import { UpdateQuery } from "mongoose";

export interface IFunnelCreate {
    clientId: string;
    phone: string;
    isActive?: boolean;
    nodes: IFunnelNode[];
}

export interface IFunnelState {
    id: string;
    isActive: boolean;
}

class FunnelManager {
    async createOrUpdateFunnel(data: IFunnelCreate): Promise<IFunnel> {
        try {
            const filter = { clientId: data.clientId, phone: data.phone };
            const existingFunnel = await FunnelModel.findOne(filter).lean();

            let update = { ...data };
            if (existingFunnel) {
                update.isActive = existingFunnel.isActive;
            } else {
                update.isActive = false;
            }

            const funnel = await FunnelModel.findOneAndUpdate(
                filter,
                update,
                { new: true, upsert: true }
            );

            return funnel as IFunnel;
        } catch (error: any) {
            throw new AppError("Erro ao criar ou atualizar funil", 400, error);
        }
    }

    async toggleFunnelStatus(clientId: string, phone: string, isActive: boolean): Promise<IFunnel | null> {
        try {
            const funnel = await this.updateFunnel(clientId, phone, { $set: { isActive } });
            if (!funnel) {
                throw new AppError("Funil não encontrado para alterar o status", 404);
            }

            return funnel;
        } catch (error: any) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError("Erro ao alterar o status do funil", 500, error);
        }
    }

    async getFunnelByClientIdAndPhone(clientId: string, phone: string): Promise<IFunnel | null> {
        try {
            const funnel = await FunnelModel.findOne({ clientId, phone }).exec();
            if (!funnel) return null;

            return funnel;
        } catch (error: any) {
            throw new AppError("Erro ao buscar funil por ID", 500, error);
        }
    }

    async getFunnelStatus(clientId: string, phone: string): Promise<IFunnelState | null> {
        try {
            const funnel = await FunnelModel.findOne(
                { clientId, phone },
                { isActive: 1 }
            ).exec();

            if (!funnel) return null;
            const funnelState: IFunnelState = { id: funnel.id, isActive: funnel?.isActive };

            return funnelState;
        } catch (error: any) {
            if (error instanceof AppError) {
                throw error;
            }

            throw new AppError("Erro ao buscar status do funil", 500, error);
        }
    }

    async listFunnelsByBot(clientId: string, phone: string): Promise<IFunnel[]> {
        try {
            return await FunnelModel.find({ clientId, phone }).sort({ createdAt: -1 }).exec();
        } catch (error: any) {
            throw new AppError("Erro ao listar funis do bot", 500, error);
        }
    }

    async findActiveFunnelsForBot(clientId: string, phone: string): Promise<IFunnel[]> {
        try {
            return await FunnelModel.find({
                clientId,
                phone,
                isActive: true
            }).exec();
        } catch (error: any) {
            throw new AppError("Erro ao buscar funis ativos para o bot", 500, error);
        }
    }

    async updateFunnel(
        clientId: string,
        phone: string,
        update: UpdateQuery<IFunnel>
    ): Promise<IFunnel | null> {
        try {
            const funnel = await FunnelModel.findOneAndUpdate(
                { clientId, phone },
                update,
                { new: true }
            ).exec();
            if (!funnel) {
                throw new AppError("Funil não encontrado para atualização", 404);
            }
            return funnel;
        } catch (error: any) {
            throw new AppError("Erro ao atualizar funil", 400, error);
        }
    }

    async deleteFunnel(
        clientId: string,
        phone: string
    ): Promise<{ deletedCount: number }> {
        try {
            const result = await FunnelModel.deleteOne({ clientId, phone }).exec();
            if (result.deletedCount === 0) {
                throw new AppError("Funil não encontrado para exclusão", 404);
            }
            return result;
        } catch (error: any) {
            throw new AppError("Erro ao deletar funil", 500, error);
        }
    }
}

export const funnelManager = new FunnelManager();