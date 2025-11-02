import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import ChatBot from "../components/chatbot/ChatBot";
import type { ChatbotSettings } from "../components/chatbot/types";

// Helper function to check if auto_open is enabled
const isAutoOpenEnabled = (settings: ChatbotSettings | null): boolean => {
  if (!settings) return false;

  const autoOpen = settings.auto_open;
  if (typeof autoOpen === "boolean") return autoOpen;
  if (typeof autoOpen === "string") return autoOpen.toLowerCase() === "true";
  if (typeof autoOpen === "number") return autoOpen === 1;

  return false;
};

const ChatbotEmbedPage = () => {
  const [apiKey, setApiKey] = useState<string | undefined>(undefined);
  const [isWidget, setIsWidget] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [settings, setSettings] = useState<ChatbotSettings | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Helper to ensure HTTPS URLs
  const ensureHttps = useCallback((url: string): string => {
    if (!url) return url;
    return url.replace(/^http:\/\//i, "https://");
  }, []);

  // Fetch chatbot settings
  const fetchSettings = useCallback(async (apiKey: string) => {
    try {
      const apiUrl = ensureHttps(
        import.meta.env.VITE_API_CHATBOT_SETTINGS_URL ||
          "https://api.bayshorecommunication.org/api/chatbot/settings"
      );
      console.log("🔐 Fetching settings from:", apiUrl);
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      console.log("Settings response:", data);
      if (data.status === "success") {
        setSettings(data.settings);
        console.log("Settings loaded successfully:", data.settings);
      } else {
        console.error("Failed to load settings:", data);
        setError("Failed to load chatbot settings");
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      setError("Failed to load chatbot settings");
    }
  }, []);

  // Callback function for close button click
  const handleToggleChat = useCallback(() => {
    // If this is embedded in a widget, send a message to the parent window
    if (isWidget && window.parent !== window) {
      window.parent.postMessage("closeChatbot", "*");
    }
  }, [isWidget]);

  useEffect(() => {
    // Extract API key from URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const apiKeyParam = urlParams.get("apiKey");
    const isWidgetParam = urlParams.get("isWidget");

    if (apiKeyParam) {
      setApiKey(apiKeyParam);
      fetchSettings(apiKeyParam);
    }

    if (isWidgetParam === "true") {
      setIsWidget(true);
    }

    // Set loaded state after a small delay to allow for animation
    setTimeout(() => {
      setIsLoaded(true);
    }, 100);
  }, [fetchSettings]);

  return (
    <div className="h-screen overflow-hidden">
      <AnimatePresence>
        {apiKey ? (
          <motion.div
            className="h-full"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{
              opacity: isLoaded ? 1 : 0,
              scale: isLoaded ? 1 : 0.9,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
          >
            <ChatBot
              key={
                settings
                  ? isAutoOpenEnabled(settings)
                    ? "chatbot-open"
                    : "chatbot-closed"
                  : "chatbot-loading"
              }
              apiKey={apiKey}
              embedded={true}
              initiallyOpen={isAutoOpenEnabled(settings)}
              onToggleChat={handleToggleChat}
              settings={settings}
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
              <p>
                {error ||
                  "No API key provided. Please make sure the iframe URL includes the apiKey parameter."}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatbotEmbedPage;
