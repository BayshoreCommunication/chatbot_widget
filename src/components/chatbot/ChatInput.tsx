import { useState, type FormEvent, type KeyboardEvent } from 'react';

interface ChatInputProps {
    sendMessage: (text: string) => void;
    disabled: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ sendMessage, disabled }) => {
    const [inputValue, setInputValue] = useState('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (inputValue.trim() && !disabled) {
            sendMessage(inputValue);
            setInputValue('');
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="border-t border-gray-700 p-4 bg-gray-800">
            <div className="flex items-end">
                <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    disabled={disabled}
                    className="flex-1 resize-none border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[40px] max-h-[120px] disabled:bg-gray-700 disabled:cursor-not-allowed bg-gray-700 text-gray-100 placeholder-gray-400"
                    rows={1}
                />
                <button
                    type="submit"
                    disabled={disabled || !inputValue.trim()}
                    className="ml-3 px-4 py-2 bg-indigo-700 text-white rounded-lg hover:bg-indigo-800 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                </button>
            </div>
            <div className="mt-2 text-xs text-gray-400 text-center">
                Press Enter to send, Shift+Enter for a new line
            </div>
        </form>
    );
};

export default ChatInput; 