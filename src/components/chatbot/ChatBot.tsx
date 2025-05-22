import { useState, useEffect, useRef } from 'react';
import ChatHeader from './ChatHeader';
import ChatBody from './ChatBody';
import ChatInput from './ChatInput';
import type { Message, BotMode, AppointmentSlot } from './types';
import chatApi, { ChatApi } from './api';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatBotProps {
    apiKey?: string;
    customApiUrl?: string;
    embedded?: boolean;
    initiallyOpen?: boolean;
}

const ChatBot: React.FC<ChatBotProps> = ({
    apiKey,
    customApiUrl,
    embedded = false,
    initiallyOpen = false
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
    const tooltipTexts = [
        'Hello! I\'m your AI assistant. Need help?',
        'Have a question? Click here to chat!',
        'I can help schedule your appointments.',
        'Looking for information? Just ask me!',
        'Let me assist you today. Click to open.'
    ];

    // Use provided API key or create custom API instance if needed
    const [api, setApi] = useState(chatApi);

    // Set up custom API instance if apiKey is provided
    useEffect(() => {
        if (apiKey) {
            const config = {
                apiKey,
                ...(customApiUrl ? { apiUrl: customApiUrl } : {})
            };
            setApi(new ChatApi(config));
        }
    }, [apiKey, customApiUrl]);

    const [sessionId] = useState<string>(() => {
        // Try to get existing session from localStorage, or create a new one
        const savedSession = localStorage.getItem('chatSessionId');
        return savedSession || uuidv4();
    });

    // Save sessionId to localStorage when it changes
    useEffect(() => {
        localStorage.setItem('chatSessionId', sessionId);
    }, [sessionId]);

    const [forceScrollBottom, setForceScrollBottom] = useState(0); // Counter to force scroll
    const chatBodyRef = useRef<HTMLDivElement>(null);

    // Initialize chat and fetch conversation history when component mounts or chat is opened
    useEffect(() => {
        // Don't do anything if chat isn't open
        if (!isOpen) {
            return;
        }

        const fetchConversationHistory = async () => {
            const savedSession = localStorage.getItem('chatSessionId');
            // Only proceed if there's a session ID
            if (!savedSession) {
                // Send initial hello only if no session exists
                setIsTyping(true);
                setTimeout(() => sendMessage("hello"), 100);
                return;
            }

            setIsLoading(true);
            try {
                console.log("Fetching history with session ID:", savedSession);
                // Use the api instance which might be using the custom API key
                const response = await api.getConversationHistory(savedSession);

                if (response.user_data && response.user_data.conversation_history) {
                    const historyMessages = api.convertToMessages(response.user_data.conversation_history);
                    if (historyMessages.length > 0) {
                        console.log("Setting messages from history:", historyMessages.length);

                        // Set positioning flag to keep loading state active
                        setIsPositioningScroll(true);

                        // Set a batch loading flag to handle scroll behavior in ChatBody
                        setBatchedMessages(true);

                        // Add a small delay before setting messages to allow the component to finish mounting
                        setTimeout(() => {
                            setMessages(historyMessages);

                            // Update the mode if it's in the response
                            if (response.mode) {
                                setCurrentMode(response.mode as BotMode);
                            }

                            // Force scroll to bottom after messages are set
                            setTimeout(() => {
                                forceScrollToBottom();

                                // After a small delay to make sure scroll position is set
                                setTimeout(() => {
                                    // Finally hide loading state
                                    setIsLoading(false);
                                    setIsPositioningScroll(false);
                                }, 300);
                            }, 300);
                        }, 300);
                    } else {
                        // No messages in history, send initial hello
                        setIsLoading(false);
                        setIsTyping(true);
                        setTimeout(() => sendMessage("hello"), 100);
                    }
                } else {
                    // No user data or conversation history, send initial hello
                    setIsLoading(false);
                    setIsTyping(true);
                    setTimeout(() => sendMessage("hello"), 100);
                }
            } catch (error) {
                console.error('Error fetching conversation history:', error);
                // If error occurs, still send initial hello
                setIsLoading(false);
                setIsTyping(true);
                setTimeout(() => sendMessage("hello"), 100);
            } finally {
                // Don't set isLoading false here, we'll handle it after positioning
                setHistoryFetched(true);
            }
        };

        // Fetch history when chat is opened and not already fetched
        if (!historyFetched) {
            fetchConversationHistory();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
    };

    const handleOptionClick = (option: string) => {
        // When an option is clicked, send it as a user message
        sendMessage(option);
    };

    const sendMessage = async (text: string) => {
        // Create and add user message
        const newUserMessage: Message = {
            id: Date.now().toString(),
            text,
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, newUserMessage]);
        setBatchedMessages(false); // Reset batch flag when sending a new message

        // Show typing indicator
        setIsTyping(true);

        try {
            // Call the API
            const response = await api.sendMessage({
                message: text,
                sessionId
            });

            // Update conversation mode if provided
            if (response.mode) {
                setCurrentMode(response.mode as BotMode);
            }

            // Update user data
            if (response.user_data) {
                // If this is the first response and we have history, update the messages
                if (messages.length <= 1) {
                    const historyMessages = api.convertToMessages(response.user_data.conversation_history);
                    setMessages(historyMessages);
                } else {
                    // Create bot response message
                    const botMessage: Message = {
                        id: (Date.now() + 1).toString(),
                        text: response.answer,
                        sender: 'bot',
                        timestamp: new Date(),
                    };

                    // Check if the message contains appointment slots
                    const appointmentSlots = api.parseAppointmentSlots(response.answer);
                    if (appointmentSlots) {
                        botMessage.appointmentSlots = appointmentSlots;
                    }

                    // Add bot message to the chat
                    setMessages(prev => [...prev, botMessage]);
                }
            }
        } catch (error) {
            // Handle error
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: 'Sorry, I encountered an error. Please try again.',
                sender: 'bot',
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, errorMessage]);
            console.error('Error sending message:', error);
        } finally {
            // Hide typing indicator
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
        // Create a user message for the slot selection
        const slotSelectionMessage: Message = {
            id: Date.now().toString(),
            text: `I'd like to book: ${slot.day} at ${slot.time} (ID: ${slot.id})`,
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, slotSelectionMessage]);
        setIsTyping(true);

        try {
            // Call the API with slot confirmation
            const response = await api.confirmAppointmentSlot({
                slotId: slot.id,
                sessionId,
                day: slot.day,
                time: slot.time
            });

            // Create bot confirmation message
            const confirmationMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: response.answer,
                sender: 'bot',
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, confirmationMessage]);
        } catch (error) {
            // Handle error
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

    // Add function to force scroll to bottom
    const forceScrollToBottom = () => {
        setForceScrollBottom(prev => prev + 1); // Increment to trigger effect in child

        // Directly access the scroll container as a fallback
        if (chatBodyRef.current) {
            const scrollContainer = chatBodyRef.current.querySelector('.overflow-y-auto');
            if (scrollContainer) {
                setTimeout(() => {
                    scrollContainer.scrollTop = scrollContainer.scrollHeight;
                }, 100);
            }
        }
    };

    return (
        <div className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 ${embedded ? 'w-full h-full bottom-0 right-0 left-0 top-0' : ''}`}>
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
                        className={`w-full ${embedded ? 'h-screen' : 'h-[calc(100vh-2rem)] sm:h-[500px]'} sm:w-[350px] md:w-96 bg-gray-800 rounded-lg shadow-xl flex flex-col overflow-hidden border border-gray-700 text-gray-100 ${embedded ? 'fixed inset-0' : 'fixed bottom-0 right-0 sm:relative'}`}
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
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <ChatInput
                                sendMessage={sendMessage}
                                disabled={isTyping || isLoading || isPositioningScroll}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChatBot; 