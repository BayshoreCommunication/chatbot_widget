// Define the types for messages
export interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  options?: string[];
  appointmentSlots?: AppointmentSlot[];
  selectedSlot?: AppointmentSlot;
  awaitingConfirmation?: boolean;
  confirmed?: boolean;
}

// Define the bot modes
export type BotMode =
  | "initial"
  | "faq"
  | "appointment"
  | "lead_capture"
  | "sales_assistant"
  | "escalation";

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

export interface ChatbotSettings {
  name: string;
  selectedColor: string; // Now accepts any color (hex, rgb, or predefined names)
  leadCapture: boolean;
  avatarUrl: string;
  botBehavior?: string;
  ai_behavior?: string;
  is_bot_connected?: boolean;
  font_name?: string;
  ai_persona_tags?: string[];

  // Auto open widget (new field name)
  auto_open_widget?: boolean;
  // Legacy support
  auto_open?: boolean;

  // Intro video configuration
  intro_video?: {
    enabled: boolean;
    video_url: string | null;
    video_filename: string | null;
    autoplay: boolean;
    duration: number;
    show_on_first_visit: boolean;
  };

  // Sound notifications
  sound_notifications?: {
    enabled: boolean;
    welcome_sound?: {
      enabled: boolean;
      play_on_first_load: boolean;
    };
    message_sound?: {
      enabled: boolean;
      play_on_send: boolean;
    };
  };

  // Legacy video support
  video_url?: string;
  video_autoplay?: boolean;
  video_duration?: number;
}
