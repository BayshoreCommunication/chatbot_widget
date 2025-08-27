import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL || "https://api.bayshorecommunication.org",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  define: {
    "import.meta.env.VITE_API_BASE_URL": JSON.stringify(
      process.env.VITE_API_URL || "https://api.bayshorecommunication.org"
    ),
    "import.meta.env.VITE_API_CHATBOT_SETTINGS_URL": JSON.stringify(
      `${
        process.env.VITE_API_URL || "https://api.bayshorecommunication.org"
      }/api/chatbot/settings`
    ),
    "import.meta.env.VITE_API_CHATBOT_URL": JSON.stringify(
      `${process.env.VITE_API_URL || "https://api.bayshorecommunication.org"}/api/chatbot/ask`
    ),
    "import.meta.env.VITE_API_CHATBOT_HISTORY_URL": JSON.stringify(
      `${
        process.env.VITE_API_URL || "https://api.bayshorecommunication.org"
      }/api/chatbot/history`
    ),
    "import.meta.env.VITE_SOCKET_URL": JSON.stringify(
      process.env.VITE_API_URL || "https://api.bayshorecommunication.org"
    ),
    "import.meta.env.VITE_WIDGET_EMBED_URL": JSON.stringify(
      process.env.VITE_WIDGET_URL ||
        "https://aibotwidget.bayshorecommunication.org"
    ),
  },
});
