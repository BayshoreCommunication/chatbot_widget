import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface InstantReplyMessage {
    message: string;
    order: number;
}

interface InstantReplyPopupProps {
    messages: InstantReplyMessage[];
    isOpen: boolean;
    onMessageClick: (message: string) => void;
    embedded?: boolean;
}

const InstantReplyPopup: React.FC<InstantReplyPopupProps> = ({
    messages,
    isOpen,
    onMessageClick,
    embedded = false
}) => {
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

    // Rotate through messages every 10 seconds
    useEffect(() => {
        if (!isOpen || messages.length === 0) return;

        const interval = setInterval(() => {
            setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
        }, 10000); // Changed to 10 seconds

        return () => clearInterval(interval);
    }, [isOpen, messages.length]);

    if (!isOpen || messages.length === 0) return null;

    const currentMessage = messages[currentMessageIndex];

    return (
        <AnimatePresence>
            <motion.div
                className={`${embedded ? 'absolute' : 'fixed'} ${embedded ? 'bottom-20 right-4' : 'bottom-24 right-24'
                    } z-50`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
            >
                <div
                    className="bg-indigo-600 text-white rounded-lg p-4 shadow-lg cursor-pointer hover:bg-indigo-700 transition-colors"
                    onClick={() => onMessageClick(currentMessage.message)}
                    style={{
                        minWidth: embedded ? '180px' : '200px',
                        maxWidth: embedded ? '280px' : '320px'
                    }}
                >
                    <p className="text-sm font-medium">{currentMessage.message}</p>
                    <div className="absolute -right-2 -bottom-2 w-4 h-4 bg-indigo-600 transform rotate-45"></div>
                    {/* Message counter */}
                    <div className="absolute -top-2 -right-2 bg-white text-indigo-600 rounded-full px-2 py-1 text-xs font-bold">
                        {currentMessageIndex + 1}/{messages.length}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default InstantReplyPopup; 