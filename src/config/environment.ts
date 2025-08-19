// Environment configuration for the chatbot widget
export const environment = {
  // Widget embed URL (base URL where the widget is hosted)
  WIDGET_EMBED_URL: import.meta.env.VITE_WIDGET_EMBED_URL || "https://aibotwizard.vercel.app",
  
  // API URLs for the widget to communicate with the backend
  API_CHATBOT_SETTINGS_URL: import.meta.env.VITE_API_CHATBOT_SETTINGS_URL || "https://aibotwizard.vercel.app/api/chatbot/settings",
  API_CHATBOT_URL: import.meta.env.VITE_API_CHATBOT_URL || "https://aibotwizard.vercel.app/api/chatbot/chat",
  API_CHATBOT_HISTORY_URL: import.meta.env.VITE_API_CHATBOT_HISTORY_URL || "https://aibotwizard.vercel.app/api/chatbot/history",
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || "https://aibotwizard.vercel.app",
};
