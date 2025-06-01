import type { Message, AppointmentSlot } from './types.js';

// API service for communicating with the chatbot backend
export interface ChatRequest {
    question: string;
    session_id: string;
}

export interface ConversationMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface ChatResponse {
    answer: string;
    mode: string;
    language: string;
    user_data: {
        conversation_history: ConversationMessage[];
        name: string;
        email: string;
    };
}

// API configuration
export interface ChatApiConfig {
    apiUrl: string;
    apiKey: string;
}

// Default API configuration
const DEFAULT_CONFIG: ChatApiConfig = {
    apiUrl: 'http://localhost:8000/api/chatbot/ask',
    apiKey: 'org_sk_5e0fbaa347d2b4658002212f97e5f818'
};

export class ChatApi {
    private config: ChatApiConfig;

    constructor(config?: Partial<ChatApiConfig>) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    // Get conversation history for a session
    async getConversationHistory(sessionId: string): Promise<ChatResponse> {
        try {
            // Use the direct history endpoint
            const response = await fetch(`http://localhost:8000/api/chatbot/history/${sessionId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.config.apiKey
                }
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching conversation history:', error);
            throw error;
        }
    }

    // Send a message to the bot and get a response
    async sendMessage(request: { message: string; sessionId: string }): Promise<ChatResponse> {
        try {
            const response = await fetch(this.config.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.config.apiKey
                },
                body: JSON.stringify({
                    question: request.message,
                    session_id: request.sessionId
                }),
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error calling chatbot API:', error);
            throw error;
        }
    }

    // Send slot confirmation to the chat API
    async confirmAppointmentSlot(request: {
        slotId: string;
        sessionId: string;
        day: string;
        time: string;
    }): Promise<ChatResponse> {
        try {
            const message = `I want to confirm my appointment for ${request.day} at ${request.time} (ID: ${request.slotId})`;

            const response = await fetch(this.config.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.config.apiKey
                },
                body: JSON.stringify({
                    question: message,
                    session_id: request.sessionId,
                    slot_confirmation: {
                        slot_id: request.slotId,
                        day: request.day,
                        time: request.time
                    }
                }),
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error confirming appointment slot:', error);
            throw error;
        }
    }

    // Convert API conversation history to our Message format
    convertToMessages(conversationHistory: ConversationMessage[]): Message[] {
        return conversationHistory.map((item, index) => ({
            id: index.toString(),
            text: item.content,
            sender: item.role === 'user' ? 'user' : 'bot',
            timestamp: new Date(),
        }));
    }

    // Parse appointment slots from a message
    parseAppointmentSlots(text: string): AppointmentSlot[] | undefined {
        if (!text.includes('Available appointment slots')) {
            return undefined;
        }

        const slots: AppointmentSlot[] = [];
        const lines = text.split('\n');

        let currentDate = '';
        let currentDay = '';

        for (const line of lines) {
            if (line.includes('📅')) {
                const dateMatch = line.match(/📅\s+(.*?)(?:,\s+(\d{4}))?$/);
                if (dateMatch) {
                    currentDay = dateMatch[1];
                    currentDate = currentDay;
                }
            } else if (line.trim().startsWith('•') || line.trim().startsWith('*')) {
                const timeMatch = line.match(/([0-9]+:[0-9]+\s+[AP]M)/i);
                const idMatch = line.match(/ID:\s+(slot_[\w-]+)/);

                if (timeMatch && idMatch) {
                    slots.push({
                        id: idMatch[1],
                        day: currentDay,
                        date: currentDate,
                        time: timeMatch[1],
                        available: true
                    });
                }
            }
        }

        return slots.length > 0 ? slots : undefined;
    }
}

// Create a default instance for backward compatibility
export const chatApi = new ChatApi();

export default chatApi; 