import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { v4 as uuidv4 } from "uuid";
import { environment } from "../../config/environment";
import ChatBody from "./ChatBody";
import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import type { AppointmentSlot, BotMode, Message } from "./types";
// import InstantReplyPopup from './InstantReplyPopup';

interface ChatBotProps {
  apiKey?: string;
  customApiUrl?: string;
  embedded?: boolean;
  initiallyOpen?: boolean;
  onToggleChat?: () => void;
  settings?: ChatbotSettings | null;
}

interface ChatbotSettings {
  name: string;
  selectedColor: "black" | "red" | "orange" | "blue" | "pink";
  leadCapture: boolean;
  avatarUrl: string;
  auto_open?: boolean;
  video_url?: string;
  video_autoplay?: boolean;
  video_duration?: number;
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

// interface InstantReplyMessage {
//     message: string;
//     order: number;
// }

const ChatBot: React.FC<ChatBotProps> = ({
  apiKey,
  customApiUrl = environment.API_CHATBOT_URL,
  embedded = false,
  initiallyOpen = false,
  onToggleChat,
  settings,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(() => Boolean(initiallyOpen));
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
  const tooltipTexts = [
    "Hello! I'm your AI assistant. Need help?",
    "Have a question? Click here to chat!",
    "I can help schedule your appointments.",
    "Looking for information? Just ask me!",
    "Let me assist you today. Click to open.",
  ];

  const chatBodyRef = useRef<HTMLDivElement>(null);
  const [forceScrollBottom, setForceScrollBottom] = useState(0);
  // const [instantReplies, setInstantReplies] = useState<InstantReplyMessage[]>([]);
  // const [showInstantReplies, setShowInstantReplies] = useState(false);
  // const [lastInteractionTime, setLastInteractionTime] = useState<number>(Date.now());
  // const [hasInteracted, setHasInteracted] = useState(false);

  // Socket.IO state for real-time admin messages
  const [isAgentMode, setIsAgentMode] = useState(false);
  const [agentId, setAgentId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Video state
  const [showVideo, setShowVideo] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Check if user is new (first time visitor)
  const [isNewUser, setIsNewUser] = useState<boolean>(() => {
    const hasVisited = localStorage.getItem("chatbot_has_visited");
    const hasSeenVideo = localStorage.getItem("chatbot_video_seen");
    return !hasVisited && !hasSeenVideo;
  });

  // Add function to force scroll to bottom
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

  // Handle video functionality
  const handleVideoPlay = () => {
    console.log("handleVideoPlay called with:", {
      video_url: settings?.video_url,
      video_autoplay: settings?.video_autoplay,
      isNewUser,
      videoEnded,
      showVideo,
    });

    if (
      settings?.video_url &&
      settings?.video_autoplay &&
      isNewUser && // Only play for new users
      !videoEnded &&
      !showVideo
    ) {
      console.log("Playing video for new user:", settings.video_url);
      setShowVideo(true);

      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.muted = true; // Mute for autoplay

          const playPromise = videoRef.current.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log("Video started playing successfully");
                // Stop video after specified duration
                const duration = settings.video_duration || 10;
                setTimeout(() => {
                  if (videoRef.current) {
                    videoRef.current.pause();
                    setVideoEnded(true);
                    setShowVideo(false);
                  }
                }, duration * 1000);
              })
              .catch((error) => {
                console.error("Error playing video:", error);
                setShowVideo(false);
              });
          }
        }
      }, 100);
    } else {
      console.log("Video play conditions not met:", {
        hasVideoUrl: !!settings?.video_url,
        videoAutoplay: settings?.video_autoplay,
        isNewUser,
        videoEnded,
        showVideo,
      });
    }
  };

  const handleVideoEnd = () => {
    console.log("Video ended, marking user as seen video");
    setVideoEnded(true);
    setShowVideo(false);

    // Mark user as having seen the video (this prevents future plays)
    localStorage.setItem("chatbot_video_seen", "true");
    setIsNewUser(false);

    // Also mark as visited for general tracking
    localStorage.setItem("chatbot_has_visited", "true");

    // Show welcome message after video ends
    setTimeout(() => {
      const welcomeMessage: Message = {
        id: `video_welcome_${Date.now()}`,
        text:
          "👋 Welcome! I'm your AI assistant. I can help you with:\n\n" +
          "• Scheduling appointments\n" +
          "• Answering questions about our services\n" +
          "• Providing information and support",
        sender: "bot",
        timestamp: new Date(),
      };

      // Only add welcome message if no messages exist yet or only video-related messages
      setMessages((prev) => {
        const hasNonSystemMessages = prev.some(
          (msg) =>
            msg.sender === "user" ||
            (msg.sender === "bot" && !msg.id.startsWith("video_welcome_"))
        );

        if (!hasNonSystemMessages) {
          return [welcomeMessage];
        }
        return prev;
      });
    }, 500);
  };

  // API Functions
  const getConversationHistory = async (
    sessionId: string
  ): Promise<ChatResponse> => {
    try {
      const response = await fetch(
        `${environment.API_CHATBOT_HISTORY_URL}/${sessionId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": apiKey || import.meta.env.VITE_DEFAULT_API_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching conversation history:", error);
      throw error;
    }
  };

  const sendMessageToApi = async (
    message: string,
    sessionId: string
  ): Promise<ChatResponse> => {
    try {
      const response = await fetch(customApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey || import.meta.env.VITE_DEFAULT_API_KEY,
        },
        body: JSON.stringify({
          question: message,
          session_id: sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error calling chatbot API:", error);
      throw error;
    }
  };

  const confirmAppointmentSlot = async (request: {
    slotId: string;
    sessionId: string;
    day: string;
    time: string;
  }): Promise<ChatResponse> => {
    try {
      const message = `I want to confirm my appointment for ${request.day} at ${request.time} (ID: ${request.slotId})`;

      const response = await fetch(customApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey || import.meta.env.VITE_DEFAULT_API_KEY,
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

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error confirming appointment slot:", error);
      throw error;
    }
  };

  const convertToMessages = (
    conversationHistory: ConversationMessage[]
  ): Message[] => {
    return conversationHistory.map((item, index) => ({
      id: index.toString(),
      text: item.content,
      sender: item.role === "user" ? "user" : "bot",
      timestamp: new Date(),
    }));
  };

  const parseAppointmentSlots = (
    text: string
  ): AppointmentSlot[] | undefined => {
    if (!text.includes("Available appointment slots")) {
      return undefined;
    }

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

  const [sessionId] = useState<string>(() => {
    const savedSession = localStorage.getItem("chatSessionId");
    return savedSession || uuidv4();
  });

  useEffect(() => {
    localStorage.setItem("chatSessionId", sessionId);
  }, [sessionId]);

  // Settings loaded: log and restore video-played state from storage
  useEffect(() => {
    if (settings) {
      console.log("ChatBot settings loaded:", settings);
      console.log("Auto-open setting:", settings.auto_open);
      console.log("Video settings:", {
        video_url: settings.video_url,
        video_autoplay: settings.video_autoplay,
        video_duration: settings.video_duration,
      });
      console.log("Is new user:", isNewUser);

      // Check if user has already seen the video
      const hasSeenVideo =
        localStorage.getItem("chatbot_video_seen") === "true";
      if (hasSeenVideo) {
        setVideoEnded(true);
        setIsNewUser(false);
      }

      // Always hide overlay when settings change
      setShowVideo(false);
    }
  }, [settings, sessionId, isNewUser]);

  // Sync internal open state with initiallyOpen prop when it changes (after settings load)
  useEffect(() => {
    // Accept booleans, 'true' strings, and 1/'1' for safety
    const shouldOpen =
      initiallyOpen === true ||
      (typeof initiallyOpen === "string" &&
        initiallyOpen.toLowerCase() === "true") ||
      (initiallyOpen as any) === 1 ||
      (initiallyOpen as any) === "1";
    if (shouldOpen && !isOpen) {
      setIsOpen(true);
    }
  }, [initiallyOpen, isOpen]);

  // Handle auto-open setting (fallback if initiallyOpen wasn't used)
  useEffect(() => {
    if (settings?.auto_open && !isOpen) {
      // Small delay to ensure component is fully mounted and settings are loaded
      const t = setTimeout(() => {
        console.log("Auto-opening chatbot due to settings");
        setIsOpen(true);
      }, 2000); // Increased delay to ensure everything is loaded
      return () => clearTimeout(t);
    }
  }, [settings?.auto_open, isOpen]);

  // Handle video when chat opens
  useEffect(() => {
    console.log("Video trigger effect - conditions:", {
      isOpen,
      hasVideoUrl: !!settings?.video_url,
      videoAutoplay: settings?.video_autoplay,
      isNewUser,
      videoEnded,
      showVideo,
    });

    if (
      isOpen &&
      settings?.video_url &&
      settings?.video_autoplay &&
      isNewUser && // Only play for new users
      !videoEnded &&
      !showVideo
    ) {
      // Small delay to ensure chat is fully opened
      setTimeout(() => {
        console.log("Auto-playing video for new user");
        handleVideoPlay();
      }, 1000); // Increased delay to ensure chat is fully loaded
    }
  }, [
    isOpen,
    settings?.video_url,
    settings?.video_autoplay,
    isNewUser,
    videoEnded,
    showVideo,
  ]);

  // Initialize chat and fetch conversation history
  useEffect(() => {
    if (!isOpen || historyFetched) return;

    const fetchConversationHistory = async () => {
      const savedSession = localStorage.getItem("chatSessionId");
      if (!savedSession) {
        setIsTyping(true);
        // Add initial welcome message
        const welcomeMessage: Message = {
          id: Date.now().toString(),
          text:
            "👋 Welcome! I'm your AI assistant. I can help you with:\n\n" +
            "• Scheduling appointments\n" +
            "• Answering questions about our services\n" +
            "• Providing information and support",
          sender: "bot",
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
        setIsTyping(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await getConversationHistory(savedSession);

        if (response.user_data && response.user_data.conversation_history) {
          // Check if the conversation is in agent mode
          if (response.user_data.agent_mode || response.agent_mode) {
            setIsAgentMode(true);
          }

          // Fallback: Check if there are any agent messages in the history
          const hasAgentMessages = response.user_data.conversation_history.some(
            (msg) =>
              msg.metadata?.type === "agent_message" || msg.metadata?.agent_id
          );
          if (hasAgentMessages) {
            setIsAgentMode(true);
          }

          const historyMessages = convertToMessages(
            response.user_data.conversation_history
          );
          if (historyMessages.length > 0) {
            setIsPositioningScroll(true);
            setBatchedMessages(true);

            setTimeout(() => {
              setMessages(historyMessages);
              if (response.mode) {
                setCurrentMode(response.mode as BotMode);
              }
              setTimeout(() => {
                forceScrollToBottom();
                setTimeout(() => {
                  setIsLoading(false);
                  setIsPositioningScroll(false);
                }, 300);
              }, 300);
            }, 300);
          } else {
            // Add welcome message for empty history
            const welcomeMessage: Message = {
              id: Date.now().toString(),
              text:
                "👋 Welcome! I'm your AI assistant. I can help you with:\n\n" +
                "• Scheduling appointments\n" +
                "• Answering questions about our services\n" +
                "• Providing information and support",
              sender: "bot",
              timestamp: new Date(),
            };
            setMessages([welcomeMessage]);
            setIsLoading(false);
            setIsTyping(false);
          }
        } else {
          // Add welcome message when no user data
          const welcomeMessage: Message = {
            id: Date.now().toString(),
            text:
              "👋 Welcome! I'm your AI assistant. I can help you with:\n\n" +
              "• Scheduling appointments\n" +
              "• Answering questions about our services\n" +
              "• Providing information and support",
            sender: "bot",
            timestamp: new Date(),
          };
          setMessages([welcomeMessage]);
          setIsLoading(false);
          setIsTyping(false);
        }
      } catch (error) {
        console.error("Error fetching conversation history:", error);
        // Add welcome message on error
        const welcomeMessage: Message = {
          id: Date.now().toString(),
          text:
            "👋 Welcome! I'm your AI assistant. I can help you with:\n\n" +
            "• Scheduling appointments\n" +
            "• Answering questions about our services\n" +
            "• Providing information and support",
          sender: "bot",
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
        setIsLoading(false);
        setIsTyping(false);
      } finally {
        setHistoryFetched(true);
      }
    };

    fetchConversationHistory();
  }, [isOpen, historyFetched]);

  // Reset batchedMessages after it's been applied
  useEffect(() => {
    if (batchedMessages && !isLoading) {
      // Reset batch flag after a short delay
      const timer = setTimeout(() => {
        setBatchedMessages(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [batchedMessages, isLoading]);

  // Add tooltip rotation on a timer
  useEffect(() => {
    const startTooltipRotation = () => {
      if (isOpen) {
        setShowTooltip(false);
        if (tooltipTimeoutRef.current) {
          clearTimeout(tooltipTimeoutRef.current);
        }
        return;
      }

      // Show tooltip and rotate text
      setShowTooltip(true);

      const rotateTooltipText = () => {
        setTooltipText((prevText) => {
          const currentIndex = tooltipTexts.indexOf(prevText);
          const nextIndex = (currentIndex + 1) % tooltipTexts.length;
          return tooltipTexts[nextIndex];
        });
        setTooltipKey((prev) => prev + 1); // Increment key to reset animation

        // Schedule next rotation
        tooltipTimeoutRef.current = setTimeout(rotateTooltipText, 5000);
      };

      // Start rotation
      tooltipTimeoutRef.current = setTimeout(rotateTooltipText, 5000);
    };

    startTooltipRotation();

    // Cleanup on unmount
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, [isOpen]);

  // Force scroll to bottom when batch loading completes
  useEffect(() => {
    if (!batchedMessages && messages.length > 0) {
      // Batch loading just completed
      setTimeout(() => {
        forceScrollToBottom();
      }, 300);
    }
  }, [batchedMessages, messages.length]);

  // Socket.IO connection for real-time admin messages
  useEffect(() => {
    if (!apiKey) return;

    console.log(
      "[WIDGET] Initializing Socket.IO connection for real-time admin messages"
    );

    // Create socket connection
    const socketInstance = io(environment.SOCKET_URL, {
      transports: ["websocket", "polling"],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: {
        apiKey: apiKey,
      },
      query: {
        apiKey: apiKey,
      },
      forceNew: true,
    });

    socketRef.current = socketInstance;

    // Connection event handlers
    socketInstance.on("connect", () => {
      console.log("[WIDGET] Socket connected successfully");
      // Join organization room
      socketInstance.emit("join_room", { room: apiKey });
    });

    socketInstance.on("connect_error", (error) => {
      console.error("[WIDGET] Socket connection error:", error);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("[WIDGET] Socket disconnected:", reason);
    });

    socketInstance.on("connection_confirmed", (data) => {
      console.log("[WIDGET] Socket connection confirmed:", data);
    });

    socketInstance.on("room_joined", (data) => {
      console.log("[WIDGET] Socket room joined:", data);
    });

    // Handle agent takeover events
    socketInstance.on("agent_takeover", (data) => {
      console.log("[WIDGET] Agent takeover received:", data);
      if (data.session_id === sessionId) {
        setIsAgentMode(true);
        setAgentId(data.agent_id || null);

        // Add a system message to indicate agent takeover
        const takoverMessage: Message = {
          id: `takeover_${Date.now()}`,
          text: "👋 Hello! A live agent has joined the conversation to provide you with personalized assistance. How can we help you today?",
          sender: "bot",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, takoverMessage]);
      }
    });

    // Handle agent release events
    socketInstance.on("agent_release", (data) => {
      console.log("[WIDGET] Agent release received:", data);
      if (data.session_id === sessionId) {
        setIsAgentMode(false);
        setAgentId(null);

        // Add a system message to indicate agent release
        const releaseMessage: Message = {
          id: `release_${Date.now()}`,
          text: "🤖 Thank you for chatting with our agent! The conversation has been transferred back to your AI assistant. I'm here to help with any additional questions.",
          sender: "bot",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, releaseMessage]);
      }
    });

    // Handle real-time admin messages
    socketInstance.on("new_message", (data) => {
      console.log("[WIDGET] New message received:", data);

      // Process messages for this session
      if (data.session_id === sessionId) {
        console.log("[WIDGET] Processing message for current session");

        if (data.message.role === "user") {
          // User message - add to messages if not already present
          const userMessage: Message = {
            id: `user_${Date.now()}_${Math.random()}`,
            text: data.message.content,
            sender: "user",
            timestamp: new Date(data.message.timestamp),
          };

          setMessages((prev) => {
            // Check if message already exists to avoid duplicates
            const exists = prev.some(
              (msg) =>
                msg.sender === "user" &&
                msg.text === data.message.content &&
                Math.abs(
                  new Date(msg.timestamp).getTime() -
                    new Date(data.message.timestamp).getTime()
                ) < 5000
            );

            if (!exists) {
              return [...prev, userMessage];
            }
            return prev;
          });

          // Show typing animation for AI response
          setIsTyping(true);
        } else if (data.message.role === "assistant") {
          // Assistant message (AI or Agent)
          const assistantMessage: Message = {
            id: `assistant_${Date.now()}_${Math.random()}`,
            text: data.message.content,
            sender: "bot",
            timestamp: new Date(data.message.timestamp),
          };

          setMessages((prev) => {
            // Check if message already exists to avoid duplicates
            const exists = prev.some(
              (msg) =>
                msg.sender === "bot" &&
                msg.text === data.message.content &&
                Math.abs(
                  new Date(msg.timestamp).getTime() -
                    new Date(data.message.timestamp).getTime()
                ) < 5000
            );

            if (!exists) {
              return [...prev, assistantMessage];
            }
            return prev;
          });

          // Stop typing animation
          setIsTyping(false);

          // Check if this is an agent message
          if (data.message.agent_id) {
            setIsAgentMode(true);
            setAgentId(data.message.agent_id);
          }
        }
      }
    });

    // Cleanup on unmount
    return () => {
      console.log("[WIDGET] Cleaning up Socket.IO connection");
      socketInstance.disconnect();
    };
  }, [apiKey, sessionId]);

  // Handle messages from parent window (for testing)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "getSocketStatus") {
        // Respond with Socket.IO connection status
        const connected = socketRef.current?.connected || false;
        window.parent.postMessage(
          {
            type: "socketStatus",
            connected: connected,
          },
          "*"
        );
      } else if (event.data.type === "testConnection") {
        window.parent.postMessage(
          {
            type: "connectionTest",
            message: "Connection successful",
          },
          "*"
        );
      } else if (event.data.type === "testInstantReplies") {
        window.parent.postMessage(
          {
            type: "instantReplies",
            messages: "Test completed",
          },
          "*"
        );
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Track user interactions
  const handleUserInteraction = () => {
    // setLastInteractionTime(Date.now());
    // setHasInteracted(true);

    // Mark user as visited on first interaction (but don't prevent video if they haven't seen it)
    if (isNewUser) {
      localStorage.setItem("chatbot_has_visited", "true");
      // Don't set isNewUser to false here - let video logic handle that
    }
  };

  // Base message sending function
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

    try {
      const response = await sendMessageToApi(text, sessionId);

      if (response.mode) {
        setCurrentMode(response.mode as BotMode);
      }

      // Check if the response indicates agent mode from the API
      const responseAgentMode =
        response.user_data?.agent_mode ||
        response.agent_mode ||
        (response.answer && response.answer.includes("agent"));

      if (responseAgentMode && !isAgentMode) {
        setIsAgentMode(true);
      }

      // Only add bot message if not in agent mode and we have an answer
      // In agent mode, the message will come via Socket.IO
      if (response.user_data && !isAgentMode && response.answer) {
        if (messages.length <= 1) {
          const historyMessages = convertToMessages(
            response.user_data.conversation_history
          );
          setMessages(historyMessages);
        } else {
          // Normal AI response when not in agent mode
          const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: response.answer,
            sender: "bot",
            timestamp: new Date(),
          };

          const appointmentSlots = parseAppointmentSlots(response.answer);
          if (appointmentSlots) {
            botMessage.appointmentSlots = appointmentSlots;
          }

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
      console.error("Error sending message:", error);
    } finally {
      // Only stop typing if we're not in agent mode
      // In agent mode, typing will be controlled by Socket.IO events
      if (!isAgentMode) {
        setIsTyping(false);
      }
    }
  };

  // Handle instant reply message click - DISABLED: now handled by widget script
  // const handleInstantReplyClick = (message: string) => {
  //     handleUserInteraction();

  //     if (!isOpen) {
  //         setIsOpen(true);
  //     }

  //     setTimeout(() => {
  //         sendMessage(message);
  //     }, 300);
  // };

  const toggleChat = () => {
    const wasOpen = isOpen;
    setIsOpen(!isOpen);
    setShowTooltip(false);

    // When opening chat, reset fetched flag to trigger history fetch
    if (!wasOpen) {
      setHistoryFetched(false);

      // Reset video state when opening chat (but only for new users)
      if (isNewUser) {
        setVideoEnded(false);
        setShowVideo(false);
      }

      // Force scroll to bottom after opening
      setTimeout(() => {
        forceScrollToBottom();
      }, 800); // Longer delay to ensure everything has loaded
    }

    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }

    // Call the onToggleChat callback if provided
    if (onToggleChat) {
      onToggleChat();
    }
  };

  const handleOptionClick = (option: string) => {
    // When an option is clicked, send it as a user message
    sendMessage(option);
  };

  const handleSlotSelect = (slot: AppointmentSlot) => {
    // Update the last bot message to show confirmation UI
    setMessages((prev) => {
      const lastBotMessageIndex = [...prev]
        .reverse()
        .findIndex((msg) => msg.sender === "bot");
      if (lastBotMessageIndex === -1) return prev;

      const actualIndex = prev.length - 1 - lastBotMessageIndex;
      const updatedMessages = [...prev];
      updatedMessages[actualIndex] = {
        ...updatedMessages[actualIndex],
        selectedSlot: slot,
        awaitingConfirmation: true,
      };

      return updatedMessages;
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
      console.error("Error confirming appointment:", error);
    } finally {
      setIsTyping(false);
    }
  };

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
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-indigo-700 text-white flex items-center justify-center shadow-lg hover:bg-indigo-800 transition-colors"
            onClick={toggleChat}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
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
          </motion.button>
        )}

        <AnimatePresence>
          {(isOpen || embedded) && (
            <motion.div
              className={`flex flex-col ${
                embedded
                  ? "h-full w-full"
                  : "h-[calc(100vh-2rem)] sm:h-[500px] sm:w-[350px] md:w-96"
              } bg-gray-800 rounded-lg shadow-xl overflow-hidden  text-gray-100 ${
                embedded
                  ? "fixed inset-0 m-0 p-0 rounded-none"
                  : "fixed bottom-0 right-0 sm:relative"
              }`}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              ref={chatBodyRef}
            >
              <ChatHeader
                toggleChat={toggleChat}
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
                  {/* Video Overlay */}
                  <AnimatePresence>
                    {showVideo && settings?.video_url && (
                      <motion.div
                        className="absolute inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="relative max-w-md w-full mx-4">
                          <video
                            ref={videoRef}
                            className="w-full rounded-lg shadow-lg"
                            onEnded={handleVideoEnd}
                            onError={handleVideoEnd}
                            muted
                            playsInline
                          >
                            <source
                              src={
                                settings.video_url?.startsWith("http")
                                  ? settings.video_url
                                  : `${environment.API_BASE_URL}${settings.video_url}`
                              }
                              type="video/mp4"
                            />
                            Your browser does not support the video tag.
                          </video>
                          <button
                            onClick={handleVideoEnd}
                            className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-70 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <ChatBody
                    messages={messages}
                    isTyping={isTyping}
                    onOptionClick={handleOptionClick}
                    onSlotSelect={handleSlotSelect}
                    onSlotConfirm={handleSlotConfirm}
                    isBatchLoading={batchedMessages}
                    forceScrollKey={forceScrollBottom}
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

      {/* Show InstantReplyPopup in both embedded and non-embedded modes */}
      {/* <InstantReplyPopup
                messages={instantReplies}
                isOpen={(!isOpen || embedded) && showInstantReplies}
                onMessageClick={handleInstantReplyClick}
                embedded={embedded}
            /> */}
    </>
  );
};

export default ChatBot;
