// Environment configuration for the chatbot widget
export const environment = {
  // Widget embed URL (base URL where the widget is hosted)
  WIDGET_EMBED_URL: import.meta.env.VITE_WIDGET_EMBED_URL || "https://aibotwizard.vercel.app",
  
  // API URLs for the widget to communicate with the backend
  API_CHATBOT_SETTINGS_URL: import.meta.env.VITE_API_CHATBOT_SETTINGS_URL || "https://aibotwizard.vercel.app/api/chatbot/settings",
  API_CHATBOT_URL: import.meta.env.VITE_API_CHATBOT_URL || "https://aibotwizard.vercel.app/api/chatbot/chat",
  API_CHATBOT_HISTORY_URL: import.meta.env.VITE_API_CHATBOT_HISTORY_URL || "https://aibotwizard.vercel.app/api/chatbot/history",
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || "https://aibotwizard.vercel.app",
  
  // Socket.IO URL for real-time messaging
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || "https://aibotwizard.vercel.app",
  
  // Widget specific URLs
  WIDGET_CHATBOT_URL: import.meta.env.VITE_WIDGET_CHATBOT_URL || "https://aibotwizard.vercel.app/chatbot-embed",
  WIDGET_INSTANT_REPLY_URL: import.meta.env.VITE_WIDGET_INSTANT_REPLY_URL || "https://aibotwizard.vercel.app/api/instant-reply",
};
