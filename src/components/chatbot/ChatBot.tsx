import { useState, useEffect, useRef } from 'react';
import ChatHeader from './ChatHeader';
import ChatBody from './ChatBody';
import ChatInput from './ChatInput';
import type { Message, BotMode, AppointmentSlot } from './types';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';

interface ChatBotProps {
    apiKey?: string;
    customApiUrl?: string;
    embedded?: boolean;
    initiallyOpen?: boolean;
    onToggleChat?: () => void;
    settings?: ChatbotSettings | null;
}

interface ChatbotSettings {
    name: string;
    selectedColor: 'black' | 'red' | 'orange' | 'blue' | 'pink';
    leadCapture: boolean;
    avatarUrl: string;
}

interface ConversationMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface ChatResponse {
    answer: string;
    mode: string;
    language: string;
    user_data: {
        conversation_history: ConversationMessage[];
        name: string;
        email: string;
    };
}

const ChatBot: React.FC<ChatBotProps> = ({
    apiKey,
    customApiUrl = 'http://localhost:8000/api/chatbot/ask',
    embedded = false,
    initiallyOpen = false,
    onToggleChat,
    settings
}) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isOpen, setIsOpen] = useState(initiallyOpen || false);
    const [isTyping, setIsTyping] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isPositioningScroll, setIsPositioningScroll] = useState(false);
    const [currentMode, setCurrentMode] = useState<BotMode>('initial');
    const [historyFetched, setHistoryFetched] = useState(false);
    const [batchedMessages, setBatchedMessages] = useState<boolean>(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipText, setTooltipText] = useState('Hello! I\'m your AI assistant. Need help?');
    const [tooltipKey, setTooltipKey] = useState(0);
    const tooltipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const tooltipTexts = [
        'Hello! I\'m your AI assistant. Need help?',
        'Have a question? Click here to chat!',
        'I can help schedule your appointments.',
        'Looking for information? Just ask me!',
        'Let me assist you today. Click to open.'
    ];

    const chatBodyRef = useRef<HTMLDivElement>(null);
    const [forceScrollBottom, setForceScrollBottom] = useState(0);

    // Add function to force scroll to bottom
    const forceScrollToBottom = () => {
        setForceScrollBottom(prev => prev + 1);
        const scrollContainer = chatBodyRef.current?.querySelector('.overflow-y-auto');
        if (scrollContainer) {
            setTimeout(() => {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }, 100);
        }
    };

    console.log('apiKey', apiKey);

    // API Functions
    const getConversationHistory = async (sessionId: string): Promise<ChatResponse> => {
        try {
            const response = await fetch(`http://localhost:8000/api/chatbot/history/${sessionId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': apiKey || 'org_sk_f200dbc62a425ba72f6b6bcbb7c4e7ea'
                }
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching conversation history:', error);
            throw error;
        }
    };

    const sendMessageToApi = async (message: string, sessionId: string): Promise<ChatResponse> => {
        try {
            const response = await fetch(customApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': apiKey || 'org_sk_f200dbc62a425ba72f6b6bcbb7c4e7ea'
                },
                body: JSON.stringify({
                    question: message,
                    session_id: sessionId
                }),
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error calling chatbot API:', error);
            throw error;
        }
    };

    const confirmAppointmentSlot = async (request: {
        slotId: string;
        sessionId: string;
        day: string;
        time: string;
    }): Promise<ChatResponse> => {
        try {
            const message = `I want to confirm my appointment for ${request.day} at ${request.time} (ID: ${request.slotId})`;

            const response = await fetch(customApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': apiKey || 'org_sk_f200dbc62a425ba72f6b6bcbb7c4e7ea'
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

            return await response.json();
        } catch (error) {
            console.error('Error confirming appointment slot:', error);
            throw error;
        }
    };

    const convertToMessages = (conversationHistory: ConversationMessage[]): Message[] => {
        return conversationHistory.map((item, index) => ({
            id: index.toString(),
            text: item.content,
            sender: item.role === 'user' ? 'user' : 'bot',
            timestamp: new Date(),
        }));
    };

    const parseAppointmentSlots = (text: string): AppointmentSlot[] | undefined => {
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
    };

    const [sessionId] = useState<string>(() => {
        const savedSession = localStorage.getItem('chatSessionId');
        return savedSession || uuidv4();
    });

    useEffect(() => {
        localStorage.setItem('chatSessionId', sessionId);
    }, [sessionId]);

    // Initialize socket connection
    useEffect(() => {
        if (apiKey) {
            // Connect to socket server
            socketRef.current = io('http://localhost:8000', {
                auth: {
                    apiKey: apiKey || 'org_sk_f200dbc62a425ba72f6b6bcbb7c4e7ea'
                }
            });

            // Join organization room
            socketRef.current.emit('join_room', {
                room: `org_${apiKey}`
            });

            // Listen for new messages
            socketRef.current.on('new_message', (data) => {
                if (data.session_id === sessionId) {
                    const newMessage: Message = {
                        id: Date.now().toString(),
                        text: data.message.content,
                        sender: data.message.role === 'user' ? 'user' : 'bot',
                        timestamp: new Date(data.message.timestamp)
                    };
                    setMessages(prev => [...prev, newMessage]);
                }
            });

            return () => {
                if (socketRef.current) {
                    socketRef.current.disconnect();
                }
            };
        }
    }, [apiKey]);

    // Initialize chat and fetch conversation history
    useEffect(() => {
        if (!isOpen || historyFetched) return;

        const fetchConversationHistory = async () => {
            const savedSession = localStorage.getItem('chatSessionId');
            if (!savedSession) {
                setIsTyping(true);
                // Add initial welcome message
                const welcomeMessage: Message = {
                    id: Date.now().toString(),
                    text: "👋 Welcome! I'm your AI assistant. I can help you with:\n\n" +
                        "• Scheduling appointments\n" +
                        "• Answering questions about our services\n" +
                        "• Providing information and support",
                    sender: 'bot',
                    timestamp: new Date(),
                };
                setMessages([welcomeMessage]);
                setIsTyping(false);
                return;
            }

            setIsLoading(true);
            try {
                const response = await getConversationHistory(savedSession);

                if (response.user_data && response.user_data.conversation_history) {
                    const historyMessages = convertToMessages(response.user_data.conversation_history);
                    if (historyMessages.length > 0) {
                        setIsPositioningScroll(true);
                        setBatchedMessages(true);

                        setTimeout(() => {
                            setMessages(historyMessages);
                            if (response.mode) {
                                setCurrentMode(response.mode as BotMode);
                            }
                            setTimeout(() => {
                                forceScrollToBottom();
                                setTimeout(() => {
                                    setIsLoading(false);
                                    setIsPositioningScroll(false);
                                }, 300);
                            }, 300);
                        }, 300);
                    } else {
                        // Add welcome message for empty history
                        const welcomeMessage: Message = {
                            id: Date.now().toString(),
                            text: "👋 Welcome! I'm your AI assistant. I can help you with:\n\n" +
                                "• Scheduling appointments\n" +
                                "• Answering questions about our services\n" +
                                "• Providing information and support",
                            sender: 'bot',
                            timestamp: new Date(),
                        };
                        setMessages([welcomeMessage]);
                        setIsLoading(false);
                        setIsTyping(false);
                    }
                } else {
                    // Add welcome message when no user data
                    const welcomeMessage: Message = {
                        id: Date.now().toString(),
                        text: "👋 Welcome! I'm your AI assistant. I can help you with:\n\n" +
                            "• Scheduling appointments\n" +
                            "• Answering questions about our services\n" +
                            "• Providing information and support",
                        sender: 'bot',
                        timestamp: new Date(),
                    };
                    setMessages([welcomeMessage]);
                    setIsLoading(false);
                    setIsTyping(false);
                }
            } catch (error) {
                console.error('Error fetching conversation history:', error);
                // Add welcome message on error
                const welcomeMessage: Message = {
                    id: Date.now().toString(),
                    text: "👋 Welcome! I'm your AI assistant. I can help you with:\n\n" +
                        "• Scheduling appointments\n" +
                        "• Answering questions about our services\n" +
                        "• Providing information and support",
                    sender: 'bot',
                    timestamp: new Date(),
                };
                setMessages([welcomeMessage]);
                setIsLoading(false);
                setIsTyping(false);
            } finally {
                setHistoryFetched(true);
            }
        };

        fetchConversationHistory();
    }, [isOpen, historyFetched]);

    // Reset batchedMessages after it's been applied
    useEffect(() => {
        if (batchedMessages && !isLoading) {
            // Reset batch flag after a short delay
            const timer = setTimeout(() => {
                setBatchedMessages(false);
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [batchedMessages, isLoading]);

    // Add tooltip rotation on a timer
    useEffect(() => {
        const startTooltipRotation = () => {
            if (isOpen) {
                setShowTooltip(false);
                if (tooltipTimeoutRef.current) {
                    clearTimeout(tooltipTimeoutRef.current);
                }
                return;
            }

            // Show tooltip and rotate text
            setShowTooltip(true);

            const rotateTooltipText = () => {
                setTooltipText(prevText => {
                    const currentIndex = tooltipTexts.indexOf(prevText);
                    const nextIndex = (currentIndex + 1) % tooltipTexts.length;
                    return tooltipTexts[nextIndex];
                });
                setTooltipKey(prev => prev + 1); // Increment key to reset animation

                // Schedule next rotation
                tooltipTimeoutRef.current = setTimeout(rotateTooltipText, 5000);
            };

            // Start rotation
            tooltipTimeoutRef.current = setTimeout(rotateTooltipText, 5000);
        };

        startTooltipRotation();

        // Cleanup on unmount
        return () => {
            if (tooltipTimeoutRef.current) {
                clearTimeout(tooltipTimeoutRef.current);
            }
        };
    }, [isOpen]);

    // Force scroll to bottom when batch loading completes
    useEffect(() => {
        if (!batchedMessages && messages.length > 0) {
            // Batch loading just completed
            setTimeout(() => {
                forceScrollToBottom();
            }, 300);
        }
    }, [batchedMessages, messages.length]);

    const toggleChat = () => {
        const wasOpen = isOpen;
        setIsOpen(!isOpen);
        setShowTooltip(false);

        // When opening chat, reset fetched flag to trigger history fetch
        if (!wasOpen) {
            setHistoryFetched(false);

            // Force scroll to bottom after opening
            setTimeout(() => {
                forceScrollToBottom();
            }, 800); // Longer delay to ensure everything has loaded
        }

        if (tooltipTimeoutRef.current) {
            clearTimeout(tooltipTimeoutRef.current);
        }

        // Call the onToggleChat callback if provided
        if (onToggleChat) {
            onToggleChat();
        }
    };

    const handleOptionClick = (option: string) => {
        // When an option is clicked, send it as a user message
        sendMessage(option);
    };

    const sendMessage = async (text: string) => {
        const newUserMessage: Message = {
            id: Date.now().toString(),
            text,
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, newUserMessage]);
        setBatchedMessages(false);
        setIsTyping(true);

        try {
            const response = await sendMessageToApi(text, sessionId);

            if (response.mode) {
                setCurrentMode(response.mode as BotMode);
            }

            if (response.user_data) {
                if (messages.length <= 1) {
                    const historyMessages = convertToMessages(response.user_data.conversation_history);
                    setMessages(historyMessages);
                } else {
                    const botMessage: Message = {
                        id: (Date.now() + 1).toString(),
                        text: response.answer,
                        sender: 'bot',
                        timestamp: new Date(),
                    };

                    const appointmentSlots = parseAppointmentSlots(response.answer);
                    if (appointmentSlots) {
                        botMessage.appointmentSlots = appointmentSlots;
                    }

                    setMessages(prev => [...prev, botMessage]);
                }
            }
        } catch (error) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: 'Sorry, I encountered an error. Please try again.',
                sender: 'bot',
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, errorMessage]);
            console.error('Error sending message:', error);
        } finally {
            setIsTyping(false);
        }
    };

    const handleSlotSelect = (slot: AppointmentSlot) => {
        // Update the last bot message to show confirmation UI
        setMessages(prev => {
            const lastBotMessageIndex = [...prev].reverse().findIndex(msg => msg.sender === 'bot');
            if (lastBotMessageIndex === -1) return prev;

            const actualIndex = prev.length - 1 - lastBotMessageIndex;
            const updatedMessages = [...prev];
            updatedMessages[actualIndex] = {
                ...updatedMessages[actualIndex],
                selectedSlot: slot,
                awaitingConfirmation: true
            };

            return updatedMessages;
        });
    };

    const handleSlotConfirm = async (slot: AppointmentSlot) => {
        const slotSelectionMessage: Message = {
            id: Date.now().toString(),
            text: `I'd like to book: ${slot.day} at ${slot.time} (ID: ${slot.id})`,
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, slotSelectionMessage]);
        setIsTyping(true);

        try {
            const response = await confirmAppointmentSlot({
                slotId: slot.id,
                sessionId,
                day: slot.day,
                time: slot.time
            });

            const confirmationMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: response.answer,
                sender: 'bot',
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, confirmationMessage]);
        } catch (error) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: 'Sorry, I encountered an error confirming your appointment. Please try again.',
                sender: 'bot',
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, errorMessage]);
            console.error('Error confirming appointment:', error);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className={`fixed ${embedded ? 'inset-0 w-full h-full m-0' : 'bottom-4 right-4 sm:bottom-6 sm:right-6'} z-50`}>
            {!embedded && (
                <AnimatePresence>
                    {showTooltip && !isOpen && (
                        <motion.div
                            key={tooltipKey}
                            className="absolute bottom-[12%] right-16 sm:right-20 bg-indigo-800 text-white p-2 sm:p-3 rounded-lg shadow-md transform translate-y-1/2 min-w-[100px] sm:min-w-[120px] max-w-[240px] sm:max-w-[320px] w-auto text-xs sm:text-sm mr-1 sm:mr-2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="relative">
                                <motion.div
                                    key={tooltipKey}
                                    className="typing-animation whitespace-normal"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    {tooltipText}
                                </motion.div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            {!embedded && (
                <motion.button
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-indigo-700 text-white flex items-center justify-center shadow-lg hover:bg-indigo-800 transition-colors"
                    onClick={toggleChat}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                </motion.button>
            )}

            <AnimatePresence>
                {(isOpen || embedded) && (
                    <motion.div
                        className={`flex flex-col ${embedded ? 'h-full w-full' : 'h-[calc(100vh-2rem)] sm:h-[500px] sm:w-[350px] md:w-96'} bg-gray-800 rounded-lg shadow-xl overflow-hidden  text-gray-100 ${embedded ? 'fixed inset-0 m-0 p-0 rounded-none' : 'fixed bottom-0 right-0 sm:relative'}`}
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        ref={chatBodyRef}
                    >
                        <ChatHeader
                            toggleChat={toggleChat}
                            currentMode={currentMode}
                            isLoading={isLoading || isPositioningScroll}
                            settings={settings}
                        />
                        {isLoading || isPositioningScroll ? (
                            <motion.div
                                className="flex-1 flex items-center justify-center bg-gray-900"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                <div className="flex flex-col items-center space-y-3">
                                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                                    <p className="text-indigo-300">Loading conversation history...</p>
                                </div>
                            </motion.div>
                        ) : (
                            <ChatBody
                                messages={messages}
                                isTyping={isTyping}
                                onOptionClick={handleOptionClick}
                                onSlotSelect={handleSlotSelect}
                                onSlotConfirm={handleSlotConfirm}
                                isBatchLoading={batchedMessages}
                                forceScrollKey={forceScrollBottom}
                            />
                        )}
                        <motion.div
                            className={embedded ? 'mb-0 pb-0' : ''}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <ChatInput
                                sendMessage={sendMessage}
                                disabled={isTyping || isLoading || isPositioningScroll}
                                embedded={embedded}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChatBot; 