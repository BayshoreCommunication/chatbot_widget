import { useEffect, useState } from 'react';
import ChatBot from '../components/chatbot/ChatBot';

const ChatbotEmbedPage = () => {
    const [apiKey, setApiKey] = useState<string | undefined>(undefined);

    useEffect(() => {
        // Extract API key from URL query parameter
        const urlParams = new URLSearchParams(window.location.search);
        const apiKeyParam = urlParams.get('apiKey');

        if (apiKeyParam) {
            setApiKey(apiKeyParam);
        }
    }, []);

    return (
        <div className="h-screen overflow-hidden">
            {apiKey ? (
                <ChatBot
                    apiKey={apiKey}
                    embedded={true}
                    initiallyOpen={true}
                />
            ) : (
                <div className="h-full flex items-center justify-center p-5 font-sans">
                    <div className="bg-red-100 p-5 rounded-lg text-red-800 max-w-[80%] text-center">
                        <h3 className="font-medium text-lg mb-2">Error</h3>
                        <p>No API key provided. Please make sure the iframe URL includes the apiKey parameter.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatbotEmbedPage; 