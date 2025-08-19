// Environment configuration for the chatbot widget
export const environment = {
  // Widget embed URL (base URL where the widget is hosted)
  WIDGET_EMBED_URL:
    import.meta.env.VITE_WIDGET_EMBED_URL || "https://aibotwizard.vercel.app",

  // API URLs for the widget to communicate with the backend
  API_CHATBOT_SETTINGS_URL:
    import.meta.env.VITE_API_CHATBOT_SETTINGS_URL ||
    "https://aibotwizard.vercel.app/api/chatbot/settings",
  API_CHATBOT_URL:
    import.meta.env.VITE_API_CHATBOT_URL ||
    "https://aibotwizard.vercel.app/api/chatbot/chat",
  API_CHATBOT_HISTORY_URL:
    import.meta.env.VITE_API_CHATBOT_HISTORY_URL ||
    "https://aibotwizard.vercel.app/api/chatbot/history",
  API_BASE_URL:
    import.meta.env.VITE_API_BASE_URL || "https://aibotwizard.vercel.app",

  // Socket.IO URL for real-time messaging
  SOCKET_URL:
    import.meta.env.VITE_SOCKET_URL || "https://aibotwizard.vercel.app",

  // Widget specific URLs
  WIDGET_CHATBOT_URL:
    import.meta.env.VITE_WIDGET_CHATBOT_URL ||
    "https://aibotwizard.vercel.app/chatbot-embed",
  WIDGET_INSTANT_REPLY_URL:
    import.meta.env.VITE_WIDGET_INSTANT_REPLY_URL ||
    "https://aibotwizard.vercel.app/api/instant-reply",

  // Development vs Production detection
  IS_DEVELOPMENT: import.meta.env.DEV || false,
  IS_PRODUCTION: import.meta.env.PROD || true,

  // Default API key (for development/testing)
  DEFAULT_API_KEY: import.meta.env.VITE_DEFAULT_API_KEY || "",

  // Build information
  BUILD_VERSION: import.meta.env.VITE_BUILD_VERSION || "1.0.0",
  BUILD_DATE: import.meta.env.VITE_BUILD_DATE || new Date().toISOString(),

  // Feature flags
  ENABLE_DEBUG_MODE: import.meta.env.VITE_ENABLE_DEBUG_MODE === "true" || false,
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === "true" || true,

  // Performance settings
  WIDGET_LOAD_TIMEOUT: parseInt(
    import.meta.env.VITE_WIDGET_LOAD_TIMEOUT || "10000"
  ),
  API_REQUEST_TIMEOUT: parseInt(
    import.meta.env.VITE_API_REQUEST_TIMEOUT || "30000"
  ),
  SOCKET_RECONNECT_DELAY: parseInt(
    import.meta.env.VITE_SOCKET_RECONNECT_DELAY || "1000"
  ),

  // Security settings
  ENABLE_ORIGIN_VERIFICATION:
    import.meta.env.VITE_ENABLE_ORIGIN_VERIFICATION !== "false",
  ALLOWED_ORIGINS: import.meta.env.VITE_ALLOWED_ORIGINS?.split(",") || [
    "https://aibotwizard.vercel.app",
  ],
};
