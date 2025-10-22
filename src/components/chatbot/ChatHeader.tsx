import type { FC } from "react";
import type { BotMode, ChatbotSettings } from "./types";

interface ChatHeaderProps {
  toggleChat: () => void;
  currentMode: BotMode;
  isLoading: boolean;
  settings?: ChatbotSettings | null;
  isAgentMode?: boolean;
  agentId?: string | null;
}

// Color utility functions
const isColorString = (str: string): boolean => {
  if (!str || typeof str !== "string") return false;
  // Check for hex colors
  if (str.startsWith("#") && (str.length === 4 || str.length === 7)) {
    return /^#[0-9A-Fa-f]{3}$|^#[0-9A-Fa-f]{6}$/.test(str);
  }
  // Check for rgb/rgba colors
  if (str.startsWith("rgb")) {
    return true;
  }
  // Check for hsl/hsla colors
  if (str.startsWith("hsl")) {
    return true;
  }
  return false;
};

const darkenHex = (hex: string, amount: number = 12): string => {
  try {
    const h = hex.replace("#", "");
    const bigint = parseInt(
      h.length === 3
        ? h
            .split("")
            .map((c) => c + c)
            .join("")
        : h,
      16
    );
    const r = Math.max(0, ((bigint >> 16) & 255) - amount);
    const g = Math.max(0, ((bigint >> 8) & 255) - amount);
    const b = Math.max(0, (bigint & 255) - amount);
    const toHex = (n: number) => n.toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  } catch (e) {
    return hex;
  }
};

const resolveColors = (selected: string) => {
  if (!selected) return { primary: "#3b82f6", hover: "#2563eb" };

  // PRIORITY: If it's a hex color (like #1a0c0c), use it directly
  if (
    selected.startsWith("#") &&
    (selected.length === 4 || selected.length === 7)
  ) {
    const primary = darkenHex(selected, 10); // Make it 10% darker for primary
    const hover = darkenHex(selected, 20); // Make it 20% darker for hover
    return { primary, hover };
  }

  // If it's a predefined color name, use the old mapping
  const predefinedColors: Record<string, { primary: string; hover: string }> = {
    black: { primary: "#000000", hover: "#1a1a1a" },
    red: { primary: "#ef4444", hover: "#dc2626" },
    orange: { primary: "#f97316", hover: "#ea580c" },
    blue: { primary: "#3b82f6", hover: "#2563eb" },
    pink: { primary: "#ec4899", hover: "#db2777" },
  };

  if (predefinedColors[selected]) {
    return predefinedColors[selected];
  }

  // If it's other color formats (rgb, hsl), use as-is
  if (isColorString(selected)) {
    return { primary: selected, hover: selected };
  }

  // Default fallback
  return { primary: "#3b82f6", hover: "#2563eb" };
};

const ChatHeader: FC<ChatHeaderProps> = ({
  toggleChat,
  settings,
  isAgentMode,
  agentId,
}) => {
  const colors = resolveColors(settings?.selectedColor || "blue");

  return (
    <div
      className="transition-colors"
      style={
        {
          backgroundColor: colors.primary,
          "--hover-color": colors.hover,
        } as React.CSSProperties
      }
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = colors.hover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = colors.primary;
      }}
    >
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          {settings?.avatarUrl ? (
            <img
              src={settings.avatarUrl}
              alt={settings.name || "Chat"}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          )}
          <div>
            <h2 className="font-medium text-lg text-white">
              {settings?.name || "Chatbot"}
            </h2>
            {isAgentMode && (
              <div className="flex items-center space-x-1 mt-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-white/80">Agent online</span>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={toggleChat}
          className="text-white/80 hover:text-white transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
