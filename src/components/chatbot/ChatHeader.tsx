import type { FC } from 'react';
import type { BotMode, ChatbotSettings } from './types';

interface ChatHeaderProps {
    toggleChat: () => void;
    currentMode: BotMode;
    isLoading: boolean;
    settings?: ChatbotSettings | null;
}

// Color mapping for the theme
const colorMap = {
    black: {
        bg: 'bg-black hover:bg-gray-900',
    },
    red: {
        bg: 'bg-red-500 hover:bg-red-600',
    },
    orange: {
        bg: 'bg-orange-500 hover:bg-orange-600',
    },
    blue: {
        bg: 'bg-blue-500 hover:bg-blue-600',
    },
    pink: {
        bg: 'bg-pink-500 hover:bg-pink-600',
    }
} as const;

const ChatHeader: FC<ChatHeaderProps> = ({ toggleChat, settings }) => {
    const colorClass = settings?.selectedColor ? colorMap[settings.selectedColor].bg : 'bg-indigo-700 hover:bg-indigo-800';

    return (
        <div className={`${colorClass} transition-colors`}>
            <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-3">
                    {settings?.avatarUrl ? (
                        <img
                            src={settings.avatarUrl}
                            alt={settings.name || 'Chat'}
                            className="w-8 h-8 rounded-full object-cover"
                        />
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                    )}
                    <div>
                        <h2 className="font-medium text-lg text-white">
                            {settings?.name || 'Chatbot'}
                        </h2>
                    </div>
                </div>
                <button
                    onClick={toggleChat}
                    className="text-white/80 hover:text-white transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default ChatHeader; 