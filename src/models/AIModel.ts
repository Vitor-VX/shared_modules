import mongoose, { Schema, type Model, type Document as MongooseDocument } from "mongoose";

export interface CallingUser {
    message: string;
}

export interface SendMessageAction {
    enabled: boolean;
    message: string;
}

export interface AddTagAction {
    enabled: boolean;
    tag: string;
}

export interface TransferToHumanAction {
    enabled: boolean;
}

export interface ScheduleFollowupAction {
    enabled: boolean;
    delayMinutes: number;
    message: string;
}

export interface ScheduleReminderAction {
    enabled: boolean;
    delayMinutes: number;
    message: string;
}

export interface AutomationActions {
    sendMessage?: SendMessageAction | null;
    addTag?: AddTagAction | null;
    transferToHuman?: TransferToHumanAction | null;
    scheduleFollowup?: ScheduleFollowupAction | null;
    scheduleReminder?: ScheduleReminderAction | null;
    calling: CallingUser;
}

export interface Calling {
    key: string;
    enabled: boolean;
    actions?: AutomationActions;
    paymentConfig?: PaymentConfig;
}

export interface IAIModel extends MongooseDocument {
    clientId: string;
    botId: string;
    apiKey: string;
    systemPrompt: string;
    isActive: boolean;
    isActiveTranscribe: boolean;
    callings: Calling[];
}

const SendMessageActionSchema = new Schema<SendMessageAction>({
    enabled: { type: Boolean, default: false },
    message: { type: String, default: null }
}, { _id: false });

const AddTagActionSchema = new Schema<AddTagAction>({
    enabled: { type: Boolean, default: false },
    tag: { type: String, default: null }
}, { _id: false });

const TransferToHumanActionSchema = new Schema<TransferToHumanAction>({
    enabled: { type: Boolean, default: false }
}, { _id: false });

const AutomationActionsSchema = new Schema<AutomationActions>({
    sendMessage: { type: SendMessageActionSchema, default: null },
    addTag: { type: AddTagActionSchema, default: null },
    transferToHuman: { type: TransferToHumanActionSchema, default: null }
}, { _id: false });

export interface PaymentValidation {
    expectedRecipient: string;
    expectedAmount: number;
    minimumAmount: number;
}
const PaymentValidationSchema = new Schema<PaymentValidation>({
    expectedRecipient: { type: String, default: "" },
    expectedAmount: { type: Number, default: 0 },
    minimumAmount: { type: Number, default: 0 }
}, { _id: false });

export interface PaymentConfig {
    validation: PaymentValidation;
    actionsOnSuccess: AutomationActions;
    actionsOnValueBelow: AutomationActions;
    actionsOnValueAbove: AutomationActions;
    actionsOnValidationFailure: AutomationActions;
}
const PaymentConfigSchema = new Schema<PaymentConfig>({
    validation: { type: PaymentValidationSchema, required: true },
    actionsOnSuccess: { type: AutomationActionsSchema, required: true },
    actionsOnValueBelow: { type: AutomationActionsSchema, required: true },
    actionsOnValueAbove: { type: AutomationActionsSchema, required: true },
    actionsOnValidationFailure: { type: AutomationActionsSchema, required: true }
}, { _id: false });

const CallingSchema = new Schema<Calling>({
    key: { type: String, required: true },
    enabled: { type: Boolean, default: false },
    actions: { type: AutomationActionsSchema, required: false },
    paymentConfig: { type: PaymentConfigSchema, required: false }
}, { _id: false });

const AISchema = new Schema<IAIModel>(
    {
        clientId: { type: String, required: true },
        botId: { type: String, required: true },
        apiKey: { type: String, required: true },
        systemPrompt: { type: String, maxlength: 20000, default: "" },
        isActive: { type: Boolean, default: true },
        isActiveTranscribe: { type: Boolean, default: false },
        callings: { type: [CallingSchema], default: [] },
    },
    {
        timestamps: true
    }
);

export const AIModel: Model<IAIModel> = mongoose
    .connection
    .useDb("vx-chatbot-pro")
    .model<IAIModel>("ai", AISchema);