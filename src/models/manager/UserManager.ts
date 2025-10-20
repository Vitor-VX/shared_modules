import { AppError } from "../../utils/AppError";
import User, { IUser } from "../UserModel";
import bcrypt from "bcrypt";

export class UserManager {

    /**
     * Cria um novo usuário no banco de dados.
     * Os campos 'hostingerToken', 'activation', 'plan', 'emailVerification'
     * terão seus valores padrão definidos pelo schema se não forem fornecidos.
     * @param userData Os dados essenciais do usuário para criação (name, email, password).
     * @returns Uma Promise que resolve com o usuário criado.
     * @throws {AppError} Se a criação falhar (ex: email duplicado, campos obrigatórios faltando).
     */
    public static async createUser(userData: {
        name: string;
        email: string;
        phone: String;
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
            return newUser;
        } catch (error: any) {
            console.error("Erro ao criar usuário:", error);

            if (error.code === 11000) {
                throw new AppError(`Email "${userData.email}" já está em uso.`, 409);
            }
            throw new AppError(`Não foi possível criar o usuário: ${error.message || "Erro desconhecido"}`, 500);
        }
    }

    /**
     * Busca um usuário pelo seu ID.
     * @param userId O ID do usuário a ser buscado.
     * @returns Uma Promise que resolve com o usuário encontrado, ou null se não for encontrado.
     * @throws {AppError} Se o ID for inválido ou a busca falhar.
     */
    public static async getUserById(userId: string): Promise<IUser> {
        try {
            if (!userId || typeof userId !== "string" || !User.base.Types.ObjectId.isValid(userId)) {
                throw new AppError("ID do usuário inválido.", 400);
            }

            const user = await User.findById(userId).lean().select("-__v").select("-_id").select("-password");
            if (!user) {
                throw new AppError("Usuário não existe.", 400);
            }

            return user;
        } catch (error: any) {
            console.error(`Erro ao buscar usuário por ID ${userId}:`, error);
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(`Não foi possível buscar o usuário: ${error.message || "Erro desconhecido"}`, 500);
        }
    }

    /**
     * Busca um usuário pelo seu endereço de e-mail.
     * @param email O e-mail do usuário a ser buscado.
     * @returns Uma Promise que resolve com o usuário encontrado, ou null se não for encontrado.
     * @throws {AppError} Se o e-mail for inválido ou a busca falhar.
     */
    public static async getUserByEmail(email: string): Promise<IUser | null> {
        try {
            if (!email || typeof email !== "string" || !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
                throw new AppError("Formato de email inválido.", 400);
            }
            const user = await User.findOne({ email });
            return user;
        } catch (error: any) {
            console.error(`Erro ao buscar usuário por email ${email}:`, error);
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(`Não foi possível buscar o usuário por email: ${error.message || "Erro desconhecido"}`, 500);
        }
    }

    /**
     * Atualiza as informações de um usuário existente.
     * @param userId O ID do usuário a ser atualizado.
     * @param updateData Os dados a serem atualizados (pode incluir subdocumentos completos ou parciais).
     * @returns Uma Promise que resolve com o usuário atualizado, ou null se não for encontrado.
     * @throws {AppError} Se o ID for inválido, o email já estiver em uso, ou a atualização falhar.
     */
    public static async updateUser(userId: string, updateData: Partial<IUser>): Promise<IUser | null> {
        try {
            if (!userId || typeof userId !== "string" || !User.base.Types.ObjectId.isValid(userId)) {
                throw new AppError("ID do usuário inválido para atualização.", 400);
            }
            const updatedUser = await User.findByIdAndUpdate(userId, { "$set": updateData }, { new: true, runValidators: true });
            return updatedUser;
        } catch (error: any) {
            console.error(`Erro ao atualizar usuário ${userId}:`, error);

            if (error.code === 11000) {
                throw new AppError(`O email "${(updateData as any).email}" já está em uso por outro usuário.`, 409);
            }
            throw new AppError(`Não foi possível atualizar o usuário: ${error.message || "Erro desconhecido"}`, 500);
        }
    }

    /**
     * Atualiza as informações básicas (nome e telefone) de um usuário existente.
     * O email não pode ser alterado por essa função.
     * 
     * @param userId - O ID do usuário a ser atualizado.
     * @param basicInfo - Objeto contendo as informações básicas a serem atualizadas:
     *                    - name (opcional): novo nome do usuário.
     *                    - phone (opcional): novo telefone do usuário.
     * @returns Uma Promise que resolve com o usuário atualizado, ou null se o usuário não for encontrado.
     * @throws {AppError} Se o ID for inválido ou a atualização falhar.
     */
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
                { "$set": { name: basicInfo.name, phone: basicInfo.phone } },
                { new: true, runValidators: true })
                .lean()
                .select("-__v")
                .select("-password");;
            return updatedUser;
        } catch (error: any) {
            console.error(`Erro ao atualizar usuário ${userId}:`, error);
            throw new AppError(`Não foi possível atualizar o usuário: ${error.message || "Erro desconhecido"}`, 500);
        }
    }


    /**
     * Deleta um usuário do banco de dados.
     * @param userId O ID do usuário a ser deletado.
     * @returns Uma Promise que resolve com o usuário deletado, ou null se não for encontrado.
     * @throws {AppError} Se o ID for inválido ou a deleção falhar.
     */
    public static async deleteUser(userId: string): Promise<IUser | null> {
        try {
            if (!userId || typeof userId !== "string" || !User.base.Types.ObjectId.isValid(userId)) {
                throw new AppError("ID do usuário inválido para deleção.", 400);
            }
            const deletedUser = await User.findByIdAndDelete(userId);
            return deletedUser;
        } catch (error: any) {
            console.error(`Erro ao deletar usuário ${userId}:`, error);
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(`Não foi possível deletar o usuário: ${error.message || "Erro desconhecido"}`, 500);
        }
    }

    /**
     * Ativa a conta de um usuário usando um token de ativação.
     * O token de ativação só é invalidado (removido e usuário ativado) após o uso bem-sucedido.
     * @param activationToken O token de ativação a ser verificado.
     * @returns Uma Promise que resolve com o usuário ativado, ou null se o token for inválido/não encontrado ou já utilizado.
     * @throws {AppError} Erro se a ativação falhar por motivos inesperados.
     */
    public static async activateUser(activationToken: string): Promise<IUser | null> {
        try {
            if (!activationToken || typeof activationToken !== "string") {
                throw new AppError("Token de ativação inválido.", 400);
            }

            const user = await User.findOne({
                "activation.token": activationToken,
                "activation.isActivated": false,
            });

            if (!user) return null;

            user.activation.isActivated = true;
            user.activation.token = "";
            user.activation.createdAt = null;

            await user.save();
            return user;
        } catch (error: any) {
            console.error(`Erro ao ativar usuário com token ${activationToken}:`, error);
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(`Não foi possível ativar o usuário: ${error.message || "Erro desconhecido"}`, 500);
        }
    }

    /**
     * Verifica se o usuário já utilizou o token de ativação.
     * @param userId O ID do usuário.
     * @returns Uma Promise que resolve com `true` se o token já foi utilizado (conta ativada), `false` se ainda não foi.
     * @throws {AppError} Se o ID do usuário for inválido ou a verificação falhar.
     */
    public static async hasUsedActivationToken(userId: string): Promise<boolean> {
        try {
            if (!userId || typeof userId !== "string" || !User.base.Types.ObjectId.isValid(userId)) {
                throw new AppError("ID do usuário inválido para verificação de ativação.", 400);
            }

            const user = await User.findById(userId).select("activation.isActivated");
            if (!user) {
                throw new AppError("Usuário não encontrado.", 404);
            }

            return user.activation.isActivated === true;
        } catch (error: any) {
            if (error instanceof AppError) {
                throw error;
            }

            console.error(`Erro ao verificar ativação do usuário ${userId}:`, error);
            throw new AppError(`Não foi possível verificar se o token de ativação já foi usado: ${error.message || "Erro desconhecido"}`, 500);
        }
    }

    /**
     * Define um novo token de ativação para um usuário.
     * Útil para reenvio de e-mail de ativação.
     * @param userId O ID do usuário.
     * @param newToken O novo token a ser definido.
     * @returns Uma Promise que resolve com o usuário atualizado.
     * @throws {AppError} Se o ID do usuário for inválido ou a atualização falhar.
     */
    public static async setActivationToken(userId: string, newToken: string): Promise<IUser | null> {
        try {
            if (!userId || typeof userId !== "string" || !User.base.Types.ObjectId.isValid(userId)) {
                throw new AppError("ID do usuário inválido.", 400);
            }
            if (!newToken || typeof newToken !== "string") {
                throw new AppError("Novo token de ativação inválido.", 400);
            }

            const updatedUser = await User.findByIdAndUpdate(
                userId,
                {
                    "$set": {
                        "activation.token": newToken,
                        "activation.createdAt": new Date(),
                        "activation.isActivated": false
                    }
                },
                { new: true, runValidators: true }
            );
            return updatedUser;
        } catch (error: any) {
            console.error(`Erro ao definir token de ativação para usuário ${userId}:`, error);
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(`Não foi possível definir o token de ativação: ${error.message || "Erro desconhecido"}`, 500);
        }
    }

    /**
     * Verifica o e-mail de um usuário usando um token de verificação.
     * @param verificationToken O token de verificação de e-mail a ser verificado.
     * @returns Uma Promise que resolve com o usuário com o e-mail verificado, ou null se o token for inválido/não encontrado ou já utilizado.
     * @throws {AppError} Erro se a verificação falhar por motivos inesperados.
     */
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
            return user;
        } catch (error: any) {
            console.error(`Erro ao verificar email com token ${verificationToken}:`, error);
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(`Não foi possível verificar o email: ${error.message || "Erro desconhecido"}`, 500);
        }
    }

    /**
     * Define um novo token de verificação de e-mail para um usuário.
     * Útil para reenvio de e-mail de verificação.
     * @param userId O ID do usuário.
     * @param newToken O novo token a ser definido.
     * @returns Uma Promise que resolve com o usuário atualizado.
     * @throws {AppError} Se o ID do usuário for inválido ou a atualização falhar.
     */
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
                    "$set": {
                        "emailVerification.token": newToken,
                        "emailVerification.createdAt": new Date(),
                        "emailVerification.verified": false
                    }
                },
                { new: true, runValidators: true }
            );
            return updatedUser;
        } catch (error: any) {
            console.error(`Erro ao definir token de verificação de email para usuário ${userId}:`, error);
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(`Não foi possível definir o token de verificação de email: ${error.message || "Erro desconhecido"}`, 500);
        }
    }


    /**
     * Atribui um plano a um usuário.
     * Calcula as datas de compra e expiração com base no nome do plano.
     * @param userId O ID do usuário.
     * @param planName O nome do plano ("month" ou "quarterly").
     * @returns Uma Promise que resolve com o usuário atualizado com o plano.
     * @throws {AppError} Se o ID do usuário ou o nome do plano forem inválidos, ou a atualização falhar.
     */
    public static async assignPlanToUser(userId: string, planName: string, extraSlots: number): Promise<IUser | null> {
        try {
            if (!userId || typeof userId !== "string" || !User.base.Types.ObjectId.isValid(userId)) {
                throw new AppError("ID do usuário inválido para atribuição de plano.", 400);
            }

            const purchasedAt = new Date();
            let expiresAt = new Date(purchasedAt);
            expiresAt.setMonth(expiresAt.getMonth() + 1);

            const updatedUser = await User.findByIdAndUpdate(
                userId,
                {
                    "$set": {
                        "plan.name": planName,
                        "plan.purchasedAt": purchasedAt,
                        "plan.expiresAt": expiresAt,
                        "plan.extraSlots": extraSlots
                    }
                },
                { new: true, runValidators: true }
            );
            return updatedUser;
        } catch (error: any) {
            console.error(`Erro ao atribuir plano "${planName}" ao usuário ${userId}:`, error);
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(`Não foi possível atribuir o plano ao usuário: ${error.message || "Erro desconhecido"}`, 500);
        }
    }

    /**
     * Remove o plano de um usuário, definindo-o como "none" e limpando as datas.
     * @param userId O ID do usuário.
     * @returns Uma Promise que resolve com o usuário atualizado sem o plano.
     * @throws {AppError} Se o ID do usuário for inválido ou a remoção do plano falhar.
     */
    public static async removePlanFromUser(userId: string): Promise<IUser | null> {
        try {
            if (!userId || typeof userId !== "string" || !User.base.Types.ObjectId.isValid(userId)) {
                throw new AppError("ID do usuário inválido para remoção de plano.", 400);
            }

            const updatedUser = await User.findByIdAndUpdate(
                userId,
                {
                    "$set": {
                        "plan.name": "none",
                        "plan.purchasedAt": null,
                        "plan.expiresAt": null,
                    }
                },
                { new: true, runValidators: true }
            );
            return updatedUser;
        } catch (error: any) {
            console.error(`Erro ao remover plano do usuário ${userId}:`, error);
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(`Não foi possível remover o plano do usuário: ${error.message || "Erro desconhecido"}`, 500);
        }
    }

    /**
     * Verifica as credenciais de login de um usuário (email e senha) sem usar hashing.
     * @param email O e-mail do usuário.
     * @param password A senha em texto claro fornecida pelo usuário.
     * @returns Uma Promise que resolve com o usuário (IUser) se as credenciais forem válidas e a conta estiver ativada e o email verificado.
     * @throws {AppError} Se as credenciais forem inválidas, o usuário não for encontrado, a conta não estiver ativada ou o email não estiver verificado.
     */
    public static async checkCredentials(email: string, password: string): Promise<IUser> {
        try {
            const user = await User.findOne({ email });

            if (!user) {
                throw new AppError("Credenciais inválidas: Email ou senha incorretos.", 401);
            }

            const passwordMatch = await bcrypt.compare(password, user.password);
            if (!passwordMatch) {
                throw new AppError("Credenciais inválidas: Email ou senha incorretos.", 401);
            }

            return user;
        } catch (error: any) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(`Não foi possível verificar as credenciais: ${error.message || "Erro desconhecido"}`, 500);
        }
    }

    /**
     * Atualiza o token de sessão de um usuário, utilizado para controle de login único.
     * Ao atualizar este token, qualquer sessão anterior do usuário será invalidada.
     *
     * @param {string} userId - O ID do usuário cuja sessão será atualizada.
     * @param {string} sessionToken - O novo token de sessão gerado no momento do login.
     * @returns {Promise<IUser>} Uma Promise que resolve com o usuário atualizado.
     * @throws {AppError} Se o usuário não for encontrado ou ocorrer erro ao atualizar a sessão.
    */
    static async updateSessionToken(userId: string, newToken: string): Promise<IUser> {
        try {
            const sessionToken = newToken || crypto.randomUUID();

            const user = await User.findByIdAndUpdate(
                userId,
                { sessionToken },
                { new: true }
            );

            if (!user) {
                throw new AppError(`Usuário com ID ${userId} não encontrado para atualizar sessão.`, 404);
            }

            return user;
        } catch (error: any) {
            console.error(`Erro ao atualizar token de sessão do usuário ${userId}:`, error.message);
            throw new AppError(`Erro ao atualizar token de sessão: ${error.message}`, 500);
        }
    }
}