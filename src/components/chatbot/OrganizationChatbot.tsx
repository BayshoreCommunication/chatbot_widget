import React, { useState, useEffect } from 'react';
import { ChatApi } from './api';
import { getApiKey, getLastUsedOrganizationId } from './apiKeyStorage';
import type { Message, AppointmentSlot } from './types';

interface OrganizationChatbotProps {
    organizationId?: string;
    initialMessage?: string;
    onAppointmentBooked?: (slot: AppointmentSlot) => void;
}

const OrganizationChatbot: React.FC<OrganizationChatbotProps> = ({
    organizationId,
    initialMessage = 'How can I help you today?',
    onAppointmentBooked
}) => {
    const [sessionId, setSessionId] = useState<string>('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [api, setApi] = useState<ChatApi | null>(null);
    const [availableSlots, setAvailableSlots] = useState<AppointmentSlot[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Initialize the chat API with the organization's API key
    useEffect(() => {
        const initializeChat = async () => {
            try {
                // Use the provided org ID or get the last used one
                const orgId = organizationId || getLastUsedOrganizationId();

                if (!orgId) {
                    setError('No organization ID provided or found in storage');
                    return;
                }

                // Get the API key for this organization
                const apiKey = getApiKey(orgId);

                if (!apiKey) {
                    setError(`No API key found for organization: ${orgId}`);
                    return;
                }

                // Create API instance with this organization's key
                const chatApi = new ChatApi({ apiKey });
                setApi(chatApi);

                // Generate a session ID for this chat
                const newSessionId = `session_${Math.random().toString(36).substring(2, 15)}`;
                setSessionId(newSessionId);

                // Add initial bot message
                setMessages([
                    {
                        id: '0',
                        text: initialMessage,
                        sender: 'bot',
                        timestamp: new Date(),
                    },
                ]);
            } catch (error) {
                console.error('Error initializing chat:', error);
                setError('Failed to initialize chat');
            }
        };

        initializeChat();
    }, [organizationId, initialMessage]);

    // Send a message to the chatbot
    const sendMessage = async (text: string) => {
        if (!text.trim() || !api || !sessionId) return;

        setIsLoading(true);

        // Add user message to chat
        const userMessage: Message = {
            id: Date.now().toString(),
            text,
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');

        try {
            // Send message to API
            const response = await api.sendMessage({
                message: text,
                sessionId,
            });

            // Add bot response to chat
            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: response.answer,
                sender: 'bot',
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, botMessage]);

            // Check for appointment slots in the response
            const slots = api.parseAppointmentSlots(response.answer);
            if (slots && slots.length > 0) {
                setAvailableSlots(slots);
            }
        } catch (error) {
            console.error('Error sending message:', error);

            // Add error message
            setMessages(prev => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    text: 'Sorry, I encountered an error. Please try again later.',
                    sender: 'bot',
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    // Confirm an appointment slot
    const confirmAppointmentSlot = async (slot: AppointmentSlot) => {
        if (!api || !sessionId) return;

        setIsLoading(true);

        try {
            // Send confirmation to API
            const response = await api.confirmAppointmentSlot({
                slotId: slot.id,
                sessionId,
                day: slot.day,
                time: slot.time,
            });

            // Add confirmation message
            const confirmationMessage: Message = {
                id: Date.now().toString(),
                text: `I've selected the appointment for ${slot.day} at ${slot.time}.`,
                sender: 'user',
                timestamp: new Date(),
            };

            const botResponseMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: response.answer,
                sender: 'bot',
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, confirmationMessage, botResponseMessage]);

            // Clear available slots
            setAvailableSlots(null);

            // Notify parent component about the booking
            if (onAppointmentBooked) {
                onAppointmentBooked(slot);
            }
        } catch (error) {
            console.error('Error confirming appointment:', error);

            // Add error message
            setMessages(prev => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    text: 'Sorry, I encountered an error confirming your appointment. Please try again.',
                    sender: 'bot',
                    timestamp: new Date(),
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim()) {
            sendMessage(inputValue);
        }
    };

    if (error) {
        return <div className="chat-error">Error: {error}</div>;
    }

    return (
        <div className="organization-chatbot">
            <div className="chat-messages">
                {messages.map(message => (
                    <div key={message.id} className={`message ${message.sender}`}>
                        <div className="message-content">{message.text}</div>
                        <div className="message-timestamp">
                            {message.timestamp.toLocaleTimeString()}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="message bot">
                        <div className="message-content loading">Typing...</div>
                    </div>
                )}
            </div>

            {availableSlots && availableSlots.length > 0 && (
                <div className="appointment-slots">
                    <h3>Available Appointments</h3>
                    <div className="slots-list">
                        {availableSlots.map(slot => (
                            <button
                                key={slot.id}
                                className="slot-button"
                                onClick={() => confirmAppointmentSlot(slot)}
                            >
                                {slot.day} at {slot.time}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <form className="chat-input-form" onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder="Type your message..."
                    disabled={isLoading}
                />
                <button type="submit" disabled={isLoading || !inputValue.trim()}>
                    Send
                </button>
            </form>
        </div>
    );
};

export default OrganizationChatbot; 