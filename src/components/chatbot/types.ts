// Define the types for messages
export interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
    options?: string[];
    appointmentSlots?: AppointmentSlot[];
    selectedSlot?: AppointmentSlot;
    awaitingConfirmation?: boolean;
    confirmed?: boolean;
}

// Define the bot modes
export type BotMode =
    | 'initial'
    | 'faq'
    | 'appointment'
    | 'lead_capture'
    | 'sales_assistant'
    | 'escalation';

// Define user information structure
export interface UserInfo {
    name: string;
    email: string;
    phone?: string;
    inquiry?: string;
}

// Define appointment slot structure
export interface AppointmentSlot {
    id: string;
    day: string;
    date: string;
    time: string;
    available: boolean;
} 