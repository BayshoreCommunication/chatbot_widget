import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  define: {
    "import.meta.env.VITE_API_CHATBOT_SETTINGS_URL": JSON.stringify(
      "http://localhost:8000/api/chatbot/settings"
    ),
    "import.meta.env.VITE_API_CHATBOT_URL": JSON.stringify(
      "http://localhost:8000/api/chatbot/ask"
    ),
    "import.meta.env.VITE_API_CHATBOT_HISTORY_URL": JSON.stringify(
      "http://localhost:8000/api/chatbot/history"
    ),
    "import.meta.env.VITE_SOCKET_URL": JSON.stringify("http://localhost:8000"),
    "import.meta.env.VITE_WIDGET_EMBED_URL": JSON.stringify(
      "http://localhost:5175"
    ),
  },
});
