import { useEffect, useState, useCallback } from 'react';
import ChatBot from '../components/chatbot/ChatBot';
import { motion, AnimatePresence } from 'framer-motion';

const ChatbotEmbedPage = () => {
    const [apiKey, setApiKey] = useState<string | undefined>(undefined);
    const [isWidget, setIsWidget] = useState<boolean>(false);
    const [isLoaded, setIsLoaded] = useState<boolean>(false);

    // Callback function for close button click
    const handleToggleChat = useCallback(() => {
        // If this is embedded in a widget, send a message to the parent window
        if (isWidget && window.parent !== window) {
            window.parent.postMessage('closeChatbot', '*');
        }
    }, [isWidget]);

    useEffect(() => {
        // Extract API key from URL query parameter
        const urlParams = new URLSearchParams(window.location.search);
        const apiKeyParam = urlParams.get('apiKey');
        const isWidgetParam = urlParams.get('isWidget');

        if (apiKeyParam) {
            setApiKey(apiKeyParam);
        }

        if (isWidgetParam === 'true') {
            setIsWidget(true);
        }

        // Set loaded state after a small delay to allow for animation
        setTimeout(() => {
            setIsLoaded(true);
        }, 100);
    }, []);

    return (
        <div className="h-screen overflow-hidden">
            <AnimatePresence>
                {apiKey ? (
                    <motion.div
                        className="h-full"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{
                            opacity: isLoaded ? 1 : 0,
                            scale: isLoaded ? 1 : 0.9
                        }}
                        transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 30
                        }}
                    >
                        <ChatBot
                            apiKey={apiKey}
                            embedded={true}
                            initiallyOpen={true}
                            onToggleChat={handleToggleChat}
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        className="h-full flex items-center justify-center p-5 font-sans"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="bg-red-100 p-5 rounded-lg text-red-800 max-w-[80%] text-center">
                            <h3 className="font-medium text-lg mb-2">Error</h3>
                            <p>No API key provided. Please make sure the iframe URL includes the apiKey parameter.</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChatbotEmbedPage; 