import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";
import { playMessageSound, playWelcomeSound } from "../../utils/soundUtils";
import ChatBody from "./ChatBody";
import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import type {
  AppointmentSlot,
  BotMode,
  ChatbotSettings,
  Message,
} from "./types";

interface ChatBotProps {
  apiKey?: string;
  customApiUrl?: string;
  embedded?: boolean;
  initiallyOpen?: boolean | string | number;
  onToggleChat?: () => void;
  settings?: ChatbotSettings | null;
  welcomeApiBaseUrl?: string; // base for /api/chatbot/welcome-message
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  metadata?: {
    type?: string;
    agent_id?: string;
  };
}

interface ChatResponse {
  answer: string;
  mode: string;
  language: string;
  agent_mode?: boolean;
  user_data: {
    conversation_history: ConversationMessage[];
    name: string;
    email: string;
    agent_mode?: boolean;
  };
}

interface InstantReplyMessage {
  message: string;
  order: number;
}

const ChatBot: React.FC<ChatBotProps> = ({
  apiKey,
  customApiUrl = import.meta.env.VITE_API_CHATBOT_URL,
  embedded = false,
  initiallyOpen = false,
  onToggleChat,
  settings,
  welcomeApiBaseUrl,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);

  const [isOpen, setIsOpen] = useState<boolean>(() => {
    return Boolean(initiallyOpen);
  });
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPositioningScroll, setIsPositioningScroll] = useState(false);
  const [currentMode, setCurrentMode] = useState<BotMode>("initial");
  const [historyFetched, setHistoryFetched] = useState(false);
  const [batchedMessages, setBatchedMessages] = useState<boolean>(false);

  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipText, setTooltipText] = useState(
    "Hello! I'm your AI assistant. Need help?"
  );
  const [tooltipKey, setTooltipKey] = useState(0);
  const tooltipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipTexts = useMemo(
    () => [
      "Hello! I'm your AI assistant. Need help?",
      "Have a question? Click here to chat!",
      "I can help schedule your appointments.",
      "Looking for information? Just ask me!",
      "Let me assist you today. Click to open.",
    ],
    []
  );

  const chatBodyRef = useRef<HTMLDivElement>(null);
  const [forceScrollBottom, setForceScrollBottom] = useState(0);

  const [instantReplies, setInstantReplies] = useState<InstantReplyMessage[]>(
    []
  );
  const [showInstantReplies, setShowInstantReplies] = useState(false);

  const [isAgentMode, setIsAgentMode] = useState(false);
  const [agentId, setAgentId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const welcomeSoundPlayedRef = useRef(false); // Track if welcome sound has played this session

  // welcome text
  const [welcomeMessage, setWelcomeMessage] = useState<string>("");
  const [serverSettings, setServerSettings] = useState<ChatbotSettings | null>(
    null
  );

  // no overlay anymore; we autoplay inline in the chat flow
  // const [showVideo, setShowVideo] = useState(false);

  // new user detection (still useful for analytics)
  const [isNewUser, setIsNewUser] = useState<boolean>(() => {
    const hasVisited = localStorage.getItem("chatbot_has_visited");
    return !hasVisited;
  });

  const [sessionId] = useState<string>(() => {
    const savedSession = localStorage.getItem("chatSessionId");
    return savedSession || uuidv4();
  });

  useEffect(() => {
    localStorage.setItem("chatSessionId", sessionId);
  }, [sessionId]);

  // Ensure we always use HTTPS to avoid mixed-content errors
  const ensureHttps = useCallback((url: string): string => {
    if (!url) return url;
    // Handle protocol-relative URLs
    if (url.startsWith("//")) {
      return "https:" + url;
    }
    // Handle HTTP URLs
    return url.replace(/^http:\/\//i, "https://");
  }, []);

  // utils
  const forceScrollToBottom = () => {
    setForceScrollBottom((prev) => prev + 1);
    const scrollContainer =
      chatBodyRef.current?.querySelector(".overflow-y-auto");
    if (scrollContainer) {
      setTimeout(() => {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }, 100);
    }
  };

  const getNormalizedApiBase = useCallback(() => {
    const raw = (
      import.meta.env.VITE_API_BASE_URL ||
      "https://api.bayshorecommunication.org"
    ).trim();
    const cleaned = raw.replace(/%0A|\n|\r/g, "").replace(/\s+/g, "");
    const noTrailingSlash = cleaned.replace(/\/+$/, "");
    const noTrailingApi = noTrailingSlash.replace(/\/api$/, "");
    // Force HTTPS - critical for production to avoid mixed content errors
    return ensureHttps(noTrailingApi);
  }, [ensureHttps]);

  const getDefaultWelcome = useCallback(() => {
    return "Hello. Welcome to Ai Assistant. How can I assist you today?";
  }, []);

  const fetchWelcomeMessage = useCallback(async () => {
    try {
      const url = "https://api.bayshorecommunication.org/api/instant-reply/";

      const response = await fetch(url, {
        headers: {
          "X-API-Key": apiKey || "org_sk_3ca4feb8c1afe80f73e1a40256d48e7c",
        },
      });

      if (!response.ok) {
        setWelcomeMessage(getDefaultWelcome());
        return;
      }

      const data = await response.json();
      const { isActive, messages } = data?.data || {};

      // Check if active and has messages
      if (
        data?.status === "success" &&
        isActive &&
        Array.isArray(messages) &&
        messages.length > 0
      ) {
        // Sort by order and get first message
        const sorted = [...messages].sort(
          (a, b) => (a.order ?? 0) - (b.order ?? 0)
        );
        const firstMessage = sorted[0]?.message;

        if (firstMessage?.trim()) {
          setWelcomeMessage(firstMessage);
          return;
        }
      }

      setWelcomeMessage(getDefaultWelcome());
    } catch (error) {
      console.error("Error fetching welcome message:", error);
      setWelcomeMessage(getDefaultWelcome());
    }
  }, [apiKey, getDefaultWelcome]);

  const fetchSettings = useCallback(async () => {
    try {
      const base = ensureHttps(getNormalizedApiBase());
      const url = `${base}/api/chatbot/settings`;
      const response = await fetch(url, {
        headers: {
          "X-API-Key": apiKey || "org_sk_3ca4feb8c1afe80f73e1a40256d48e7c",
        },
      });
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      if (data?.status === "success" && data?.settings) {
        setServerSettings(data.settings as ChatbotSettings);
      }
    } catch (e) {
      console.error("Error fetching settings:", e);
    }
  }, [apiKey, getNormalizedApiBase, ensureHttps]);

  const parseAppointmentSlots = (
    text: string
  ): AppointmentSlot[] | undefined => {
    if (!text.includes("Available appointment slots")) return undefined;
    const slots: AppointmentSlot[] = [];
    const lines = text.split("\n");
    let currentDate = "";
    let currentDay = "";

    for (const line of lines) {
      if (line.includes("📅")) {
        const dateMatch = line.match(/📅\s+(.*?)(?:,\s+(\d{4}))?$/);
        if (dateMatch) {
          currentDay = dateMatch[1];
          currentDate = currentDay;
        }
      } else if (line.trim().startsWith("•") || line.trim().startsWith("*")) {
        const timeMatch = line.match(/([0-9]+:[0-9]+\s+[AP]M)/i);
        const idMatch = line.match(/ID:\s+(slot_[\w-]+)/);
        if (timeMatch && idMatch) {
          slots.push({
            id: idMatch[1],
            day: currentDay,
            date: currentDate,
            time: timeMatch[1],
            available: true,
          });
        }
      }
    }
    return slots.length > 0 ? slots : undefined;
  };

  // APIs
  const sendMessageToApi = async (
    message: string,
    sessionId: string
  ): Promise<ChatResponse> => {
    const apiUrl = ensureHttps(
      customApiUrl || "https://api.bayshorecommunication.org/api/chatbot/ask"
    );
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey || "org_sk_3ca4feb8c1afe80f73e1a40256d48e7c",
      },
      body: JSON.stringify({
        question: message,
        session_id: sessionId,
      }),
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return await response.json();
  };

  const confirmAppointmentSlot = async (request: {
    slotId: string;
    sessionId: string;
    day: string;
    time: string;
  }): Promise<ChatResponse> => {
    const message = `I want to confirm my appointment for ${request.day} at ${request.time} (ID: ${request.slotId})`;
    const apiUrl = ensureHttps(
      customApiUrl || "https://api.bayshorecommunication.org/api/chatbot/ask"
    );
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey || "org_sk_3ca4feb8c1afe80f73e1a40256d48e7c",
      },
      body: JSON.stringify({
        question: message,
        session_id: request.sessionId,
        slot_confirmation: {
          slot_id: request.slotId,
          day: request.day,
          time: request.time,
        },
      }),
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return await response.json();
  };

  // effects
  // Removed conflicting prefetch useEffect - history will load when chat opens

  useEffect(() => {
    if (settings) {
      const hasVisited = localStorage.getItem("chatbot_has_visited");
      if (!hasVisited) localStorage.setItem("chatbot_has_visited", "true");
    }
  }, [settings, sessionId]);

  useEffect(() => {
    const shouldOpen =
      initiallyOpen === true ||
      (typeof initiallyOpen === "string" &&
        initiallyOpen.toLowerCase() === "true") ||
      initiallyOpen === 1 ||
      initiallyOpen === "1";
    if (shouldOpen && !isOpen) setIsOpen(true);
  }, [initiallyOpen, isOpen]);

  useEffect(() => {
    const autoOpenEnabled = settings?.auto_open_widget ?? settings?.auto_open;

    if (autoOpenEnabled && !isOpen) {
      setIsOpen(true);
    }
  }, [settings?.auto_open_widget, settings?.auto_open, isOpen]);

  // Listen for messages from parent window (widget wrapper)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Handle openChat command from widget wrapper
      if (event.data === "openChat") {
        setIsOpen(true);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Helper function to convert conversation history to messages
  const convertToMessages = useCallback(
    (history: ConversationMessage[]): Message[] =>
      history.map((item, index) => ({
        id: index.toString(),
        text: item.content,
        sender: item.role === "user" ? "user" : "bot",
        timestamp: new Date(),
      })),
    []
  );

  useEffect(() => {
    // Load history when chat opens and history hasn't been fetched yet
    if (!isOpen) {
      // Reset history flag when chat closes so it reloads on next open
      if (historyFetched) {
        setHistoryFetched(false);
      }
      return;
    }

    // Check if we should skip loading (already fetched for this session)
    if (historyFetched) {
      return;
    }

    // Add delay to allow chat animation and instant replies to render first
    const delayTimer = setTimeout(() => {
      const run = async () => {
        setIsLoading(true);

        try {
          // Inline API call to avoid component dependencies
          const historyBase = ensureHttps(
            import.meta.env.VITE_API_CHATBOT_HISTORY_URL ||
              "https://api.bayshorecommunication.org/api/chatbot/history"
          );
          const historyUrl = `${historyBase}/${sessionId}`;

          const response = await fetch(historyUrl, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "X-API-Key": apiKey || "org_sk_3ca4feb8c1afe80f73e1a40256d48e7c",
            },
          });

          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }

          const data = await response.json();

          // Use the fetched data as response
          if (data.user_data && data.user_data.conversation_history) {
            if (data.user_data.agent_mode || data.agent_mode)
              setIsAgentMode(true);

            const hasAgentMessages = data.user_data.conversation_history.some(
              (msg) =>
                msg.metadata?.type === "agent_message" || msg.metadata?.agent_id
            );
            if (hasAgentMessages) setIsAgentMode(true);

            const historyMessages = convertToMessages(
              data.user_data.conversation_history
            );

            // Hide instant replies before showing history
            setShowInstantReplies(false);

            // Set messages immediately for faster loading
            setMessages(historyMessages);

            if (data.mode) setCurrentMode(data.mode as BotMode);

            // Set batch loading flag for optimized rendering
            setBatchedMessages(true);
            setIsPositioningScroll(true);

            // Mark history as fetched immediately after setting messages
            setHistoryFetched(true);

            // Quick scroll and cleanup after minimal delay
            setTimeout(() => {
              forceScrollToBottom();
              setIsLoading(false);
              setIsPositioningScroll(false);
            }, 100);
          } else {
            setIsLoading(false);
            setIsTyping(false);
            setHistoryFetched(true);
          }
        } catch (error) {
          console.error("Error loading conversation history:", error);
          setIsLoading(false);
          setIsTyping(false);
          setHistoryFetched(true);
        }
      };

      run();
    }, 300);

    return () => clearTimeout(delayTimer);
  }, [
    isOpen,
    historyFetched,
    sessionId,
    apiKey,
    ensureHttps,
    convertToMessages,
  ]);

  useEffect(() => {
    if (batchedMessages && !isLoading) {
      const timer = setTimeout(() => setBatchedMessages(false), 200); // Reduced from 500ms
      return () => clearTimeout(timer);
    }
  }, [batchedMessages, isLoading]);

  useEffect(() => {
    const startTooltipRotation = () => {
      if (isOpen) {
        setShowTooltip(false);
        if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
        return;
      }
      setShowTooltip(true);
      const rotate = () => {
        setTooltipText((prev) => {
          const i = tooltipTexts.indexOf(prev);
          const next = (i + 1) % tooltipTexts.length;
          return tooltipTexts[next];
        });
        setTooltipKey((prev) => prev + 1);
        tooltipTimeoutRef.current = setTimeout(rotate, 5000);
      };
      tooltipTimeoutRef.current = setTimeout(rotate, 5000);
    };
    startTooltipRotation();
    return () => {
      if (tooltipTimeoutRef.current) clearTimeout(tooltipTimeoutRef.current);
    };
  }, [isOpen, tooltipTexts]);

  useEffect(() => {
    if (!batchedMessages && messages.length > 0) {
      setTimeout(() => forceScrollToBottom(), 300);
    }
  }, [batchedMessages, messages.length]);

  // socket.io
  useEffect(() => {
    if (!apiKey) return;

    const socketUrl = ensureHttps(
      import.meta.env.VITE_SOCKET_URL || "https://api.bayshorecommunication.org"
    );

    const socketInstance = io(socketUrl, {
      transports: ["polling", "websocket"],
      timeout: 15000,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 5000,
      auth: { apiKey },
      query: { apiKey },
      forceNew: true,
      upgrade: true,
      rememberUpgrade: true,
    });

    socketRef.current = socketInstance;

    socketInstance.on("connect", () => {
      socketInstance.emit("join_room", { room: apiKey });
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket.IO connection error:", error);
    });

    socketInstance.on("agent_takeover", (data) => {
      if (data.session_id === sessionId) {
        setIsAgentMode(true);
        setAgentId(data.agent_id || null);
        const takeoverMessage: Message = {
          id: `takeover_${Date.now()}`,
          text: "👋 Hello! A live agent has joined the conversation to provide you with personalized assistance. How can we help you today?",
          sender: "bot",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, takeoverMessage]);
      }
    });

    socketInstance.on("agent_release", (data) => {
      if (data.session_id === sessionId) {
        setIsAgentMode(false);
        setAgentId(null);
        const releaseMessage: Message = {
          id: `release_${Date.now()}`,
          text: "🤖 Thank you for chatting with our agent! The conversation has been transferred back to your AI assistant. I'm here to help with any additional questions.",
          sender: "bot",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, releaseMessage]);
      }
    });

    socketInstance.on("new_message", (data) => {
      if (
        data.session_id === sessionId &&
        data.message.role === "assistant" &&
        data.message.agent_id
      ) {
        const adminMessage: Message = {
          id: `admin_${Date.now()}`,
          text: data.message.content,
          sender: "bot",
          timestamp: new Date(data.message.timestamp),
        };
        setMessages((prev) => [...prev, adminMessage]);
        setIsTyping(false);
      }
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [apiKey, sessionId, ensureHttps]);

  const handleUserInteraction = () => {
    if (isNewUser) {
      localStorage.setItem("chatbot_has_visited", "true");
      setIsNewUser(false);
    }
  };

  useEffect(() => {
    if (apiKey) {
      fetchWelcomeMessage();
      fetchSettings();
    } else {
      fetchWelcomeMessage();
    }
  }, [apiKey, welcomeApiBaseUrl, fetchWelcomeMessage, fetchSettings]);

  // Play welcome sound automatically 2-3 seconds after widget loads
  useEffect(() => {
    // Only play if welcome sound hasn't played yet
    if (welcomeSoundPlayedRef.current) {
      return;
    }

    // Wait for settings to be loaded
    const soundSettings =
      serverSettings?.sound_notifications || settings?.sound_notifications;

    if (!soundSettings) {
      return;
    }

    // Play welcome sound if enabled (regardless of chat open/closed)
    if (soundSettings?.enabled && soundSettings?.welcome_sound?.enabled) {
      welcomeSoundPlayedRef.current = true;

      // Delay 2-3 seconds after widget loads
      const timer = setTimeout(() => {
        try {
          playWelcomeSound();
        } catch (error) {
          // Don't mark as failed, browser might block autoplay
          welcomeSoundPlayedRef.current = false;
        }
      }, 2500);

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverSettings?.sound_notifications, settings?.sound_notifications]);

  // Fallback: Play welcome sound when chat opens if it failed on page load
  useEffect(() => {
    // Only play if chat is open and welcome sound hasn't played yet
    if (!isOpen || welcomeSoundPlayedRef.current) {
      return;
    }

    // Wait for settings to be loaded
    const soundSettings =
      serverSettings?.sound_notifications || settings?.sound_notifications;

    if (!soundSettings) {
      return;
    }

    // Play welcome sound if enabled (fallback for autoplay block)
    if (soundSettings?.enabled && soundSettings?.welcome_sound?.enabled) {
      welcomeSoundPlayedRef.current = true;

      // Small delay to ensure the chat animation starts
      const timer = setTimeout(() => {
        try {
          playWelcomeSound();
        } catch (error) {
          console.error("Error playing welcome sound:", error);
        }
      }, 300);

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isOpen,
    serverSettings?.sound_notifications,
    settings?.sound_notifications,
  ]);

  const fetchInstantReplies = useCallback(async () => {
    try {
      const apiUrl = ensureHttps(getNormalizedApiBase());
      const response = await fetch(`${apiUrl}/api/instant-reply/`, {
        headers: {
          "X-API-Key": apiKey || "org_sk_3ca4feb8c1afe80f73e1a40256d48e7c",
        },
      });
      if (!response.ok) return false;

      const data = await response.json();
      if (data?.status === "success" && data?.data?.isActive) {
        const msgs: InstantReplyMessage[] = (data.data.messages || []).sort(
          (a: InstantReplyMessage, b: InstantReplyMessage) => a.order - b.order
        );
        // Filter out any instant replies that match the welcome message
        const filteredMsgs = msgs.filter(
          (msg) => msg.message !== "Welcome message not found."
        );
        if (filteredMsgs.length > 0) {
          setInstantReplies(filteredMsgs);
          setShowInstantReplies(true);
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }, [apiKey, ensureHttps, getNormalizedApiBase]);

  useEffect(() => {
    if (isOpen && apiKey) {
      // Fetch instant replies when chat opens
      fetchInstantReplies().then(() => {});
    }
  }, [isOpen, apiKey, fetchInstantReplies]);

  const sendMessage = async (text: string) => {
    handleUserInteraction();

    const newUserMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newUserMessage]);
    setBatchedMessages(false);
    setIsTyping(true);

    // Play message send sound if enabled
    const soundSettings =
      serverSettings?.sound_notifications || settings?.sound_notifications;
    if (
      soundSettings?.enabled &&
      soundSettings?.message_sound?.enabled &&
      soundSettings?.message_sound?.play_on_send
    ) {
      playMessageSound();

      // Notify parent widget if embedded
      if (window.parent !== window) {
        try {
          window.parent.postMessage("messageSent", "*");
        } catch (e) {
          // Ignore errors
        }
      }
    }

    try {
      const response = await sendMessageToApi(text, sessionId);
      if (response.mode) setCurrentMode(response.mode as BotMode);

      const responseAgentMode =
        response.user_data?.agent_mode ||
        response.agent_mode ||
        (response.answer && response.answer.includes("agent"));
      if (responseAgentMode && !isAgentMode) setIsAgentMode(true);

      if (response.user_data) {
        if (messages.length <= 1) {
          const historyMessages = convertToMessages(
            response.user_data.conversation_history
          );
          setMessages(historyMessages);
        } else if (!isAgentMode) {
          const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: response.answer,
            sender: "bot",
            timestamp: new Date(),
          };
          const appointmentSlots = parseAppointmentSlots(response.answer);
          if (appointmentSlots) botMessage.appointmentSlots = appointmentSlots;
          setMessages((prev) => [...prev, botMessage]);
        }
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I encountered an error. Please try again.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleInstantReplyClick = (message: string) => {
    // Hide instant replies once user clicks on one
    setShowInstantReplies(false);

    const userMessage: Message = {
      id: `instant_reply_${Date.now()}`,
      text: message,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    sendMessage(message);
  };

  const handleOptionClick = (option: string) => {
    sendMessage(option);
  };

  const handleSlotSelect = (slot: AppointmentSlot) => {
    setMessages((prev) => {
      const idx = [...prev].reverse().findIndex((m) => m.sender === "bot");
      if (idx === -1) return prev;
      const actual = prev.length - 1 - idx;
      const updated = [...prev];
      updated[actual] = {
        ...updated[actual],
        selectedSlot: slot,
        awaitingConfirmation: true,
      };
      return updated;
    });
  };

  const handleSlotConfirm = async (slot: AppointmentSlot) => {
    const slotSelectionMessage: Message = {
      id: Date.now().toString(),
      text: `I'd like to book: ${slot.day} at ${slot.time} (ID: ${slot.id})`,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, slotSelectionMessage]);
    setIsTyping(true);

    try {
      const response = await confirmAppointmentSlot({
        slotId: slot.id,
        sessionId,
        day: slot.day,
        time: slot.time,
      });
      const confirmationMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.answer,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, confirmationMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I encountered an error confirming your appointment. Please try again.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // intro messages in normal flow (video autoplay + welcome)
  const introVideoMessage: Message | null = useMemo(() => {
    // Prefer nested intro_video from server settings, then legacy video_url
    const videoUrl =
      serverSettings?.intro_video?.enabled &&
      serverSettings?.intro_video?.video_url
        ? serverSettings.intro_video.video_url
        : serverSettings?.video_url ||
          settings?.intro_video?.video_url ||
          settings?.video_url;

    if (!videoUrl) return null;

    return {
      id: "__intro_video__",
      text: videoUrl.startsWith("http")
        ? videoUrl
        : `${import.meta.env.VITE_API_BASE_URL}${videoUrl}`,
      sender: "bot",
      timestamp: new Date(),
      // @ts-expect-error: allow metadata
      metadata: { type: "video" },
    };
  }, [
    serverSettings?.intro_video?.enabled,
    serverSettings?.intro_video?.video_url,
    serverSettings?.video_url,
    settings?.intro_video?.video_url,
    settings?.video_url,
  ]);

  const resolvedWelcomeText = useMemo(() => {
    return (welcomeMessage && welcomeMessage.trim()) || getDefaultWelcome();
  }, [welcomeMessage, getDefaultWelcome]);

  const inlineWelcomeMessage: Message = useMemo(
    () => ({
      id: "__welcome__",
      text: resolvedWelcomeText,
      sender: "bot",
      timestamp: new Date(),
    }),
    [resolvedWelcomeText]
  );

  const displayMessages: Message[] = useMemo(() => {
    // If we have conversation history (messages length > 0), don't show welcome/intro
    // Only show welcome message for brand new conversations
    if (messages.length > 0) {
      return messages;
    }

    // For new conversations, show intro video + welcome message
    return introVideoMessage
      ? [introVideoMessage, inlineWelcomeMessage]
      : [inlineWelcomeMessage];
  }, [introVideoMessage, inlineWelcomeMessage, messages]);

  return (
    <>
      <motion.div
        className={`${
          embedded
            ? "relative w-full h-full"
            : "fixed bottom-0 right-0 mb-4 mr-4"
        } z-50`}
        initial={false}
        animate={isOpen ? "open" : "closed"}
        onClick={handleUserInteraction}
      >
        {!embedded && (
          <AnimatePresence>
            {showTooltip && !isOpen && (
              <motion.div
                key={tooltipKey}
                className="absolute bottom-[12%] right-16 sm:right-20 bg-indigo-800 text-white p-2 sm:p-3 rounded-lg shadow-md transform translate-y-1/2 min-w-[100px] sm:min-w-[120px] max-w-[240px] sm:max-w-[320px] w-auto text-xs sm:text-sm mr-1 sm:mr-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="relative">
                  <motion.div
                    key={tooltipKey}
                    className="typing-animation whitespace-normal"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    {tooltipText}
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {!embedded && (
          <motion.button
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-indigo-700 text-white flex items-center justify-center shadow-lg hover:bg-indigo-800 transition-colors overflow-hidden"
            style={{
              pointerEvents: "auto",
              cursor: "pointer",
              zIndex: 9999,
            }}
            onClick={(e) => {
              e.stopPropagation();
              setShowTooltip(false);
              if (!isOpen) {
                setIsOpen(true);
                setTimeout(() => forceScrollToBottom(), 800);
              } else {
                setIsOpen(false);
              }
              if (tooltipTimeoutRef.current)
                clearTimeout(tooltipTimeoutRef.current);
              onToggleChat?.();
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {settings?.avatarUrl ? (
              <img
                src={settings.avatarUrl}
                alt="Assistant"
                className="w-full h-full object-cover"
              />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 sm:h-8 sm:w-8"
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
          </motion.button>
        )}

        <AnimatePresence>
          {(isOpen || embedded) && (
            <motion.div
              className={`flex flex-col ${
                embedded
                  ? "h-full w-full"
                  : "h-[calc(100vh-2rem)] sm:h-[500px] sm:w-[350px] md:w-96"
              } bg-gray-800 rounded-lg shadow-xl overflow-hidden text-gray-100 ${
                embedded
                  ? "fixed inset-0 m-0 p-0 rounded-none"
                  : "fixed bottom-0 right-0 sm:relative"
              }`}
              style={{
                fontFamily:
                  settings?.font_name ||
                  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              }}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              ref={chatBodyRef}
            >
              <ChatHeader
                toggleChat={() => {
                  setShowTooltip(false);
                  if (!isOpen) {
                    // Open chat immediately - history will load via useEffect
                    setIsOpen(true);
                    setTimeout(() => forceScrollToBottom(), 800);
                  } else {
                    setIsOpen(false);
                  }
                  if (tooltipTimeoutRef.current)
                    clearTimeout(tooltipTimeoutRef.current);
                  onToggleChat?.();
                }}
                currentMode={currentMode}
                isLoading={isLoading || isPositioningScroll}
                settings={settings}
                isAgentMode={isAgentMode}
                agentId={agentId}
              />

              {isLoading || isPositioningScroll ? (
                <motion.div
                  className="flex-1 flex items-center justify-center bg-gray-900"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex flex-col items-center space-y-3">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                    <p className="text-indigo-300">
                      Loading conversation history...
                    </p>
                  </div>
                </motion.div>
              ) : (
                <>
                  <ChatBody
                    messages={displayMessages}
                    isTyping={isTyping}
                    onOptionClick={handleOptionClick}
                    onSlotSelect={handleSlotSelect}
                    onSlotConfirm={handleSlotConfirm}
                    isBatchLoading={batchedMessages}
                    forceScrollKey={forceScrollBottom}
                    instantReplies={instantReplies}
                    showInstantReplies={showInstantReplies}
                    onInstantReplyClick={handleInstantReplyClick}
                    settings={settings}
                  />
                </>
              )}

              <motion.div
                className={embedded ? "mb-0 pb-0" : ""}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <ChatInput
                  sendMessage={sendMessage}
                  disabled={isTyping || isLoading || isPositioningScroll}
                  embedded={embedded}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};

export default ChatBot;
