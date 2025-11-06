import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { RiRobot3Line } from "react-icons/ri";
import MessageBubble from "./MessageBubble";
import type { AppointmentSlot, Message } from "./types";

interface InstantReplyMessage {
  message: string;
  order: number;
}

interface ChatBodyProps {
  messages: Message[];
  isTyping: boolean;
  isBatchLoading?: boolean;
  forceScrollKey?: number;
  onOptionClick?: (option: string) => void;
  onSlotSelect?: (slot: AppointmentSlot) => void;
  onSlotConfirm?: (slot: AppointmentSlot) => void;
  instantReplies?: InstantReplyMessage[];
  currentInstantReplyIndex?: number;
  showInstantReplies?: boolean;
  onInstantReplyClick?: (message: string) => void;
  settings?: {
    avatarUrl?: string;
    name?: string;
  } | null;
}

const ChatBody: React.FC<ChatBodyProps> = ({
  messages,
  isTyping,
  isBatchLoading = false,
  forceScrollKey = 0,
  onOptionClick,
  onSlotSelect,
  onSlotConfirm,
  instantReplies = [],
  currentInstantReplyIndex = 0,
  showInstantReplies = false,
  onInstantReplyClick,
  settings,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [prevMessagesLength, setPrevMessagesLength] = useState(0);
  const [initialScrollComplete, setInitialScrollComplete] = useState(false);
  const [prevIsTyping, setPrevIsTyping] = useState(false);

  // Track typing indicator changes
  useEffect(() => {
    setPrevIsTyping(isTyping);
  }, [isTyping]);

  // Forcefully scroll to bottom
  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  };

  // Scroll to bottom on initial render and when messages change
  useEffect(() => {
    // For batch loading or first load
    if (
      !initialScrollComplete ||
      messages.length !== prevMessagesLength ||
      isTyping !== prevIsTyping
    ) {
      setPrevMessagesLength(messages.length);

      // Force an immediate scroll to bottom for the initial load
      const timer = setTimeout(
        () => {
          // Only scroll to bottom if there are no instant replies showing
          if (!showInstantReplies || instantReplies.length === 0) {
            scrollToBottom();
          }
          setInitialScrollComplete(true);
        },
        isBatchLoading ? 50 : 50 // Reduced from 100ms for faster response
      );

      return () => clearTimeout(timer);
    }
  }, [
    messages,
    isTyping,
    isBatchLoading,
    prevMessagesLength,
    initialScrollComplete,
    prevIsTyping,
    showInstantReplies,
    instantReplies.length,
  ]);

  // Ensure scroll to bottom happens after component mounts and updates
  useEffect(() => {
    // Critical: Initial scroll to bottom when component mounts
    // Only scroll if no instant replies are showing
    if (!showInstantReplies || instantReplies.length === 0) {
      scrollToBottom();
    }

    // Also scroll after a short delay to ensure all content is rendered
    const timer = setTimeout(() => {
      if (!showInstantReplies || instantReplies.length === 0) {
        scrollToBottom();
      }
    }, 50); // Reduced from 100ms

    return () => clearTimeout(timer);
  }, [showInstantReplies, instantReplies.length]); // Empty dependency array means this runs once on mount

  // React to forceScrollKey changes
  useEffect(() => {
    if (forceScrollKey > 0) {
      // Parent component is forcing a scroll to bottom
      // Only scroll if no instant replies are showing
      if (!showInstantReplies || instantReplies.length === 0) {
        scrollToBottom();
      }
    }
  }, [forceScrollKey, showInstantReplies, instantReplies.length]);

  // Optimize message rendering to prevent animation overload with large histories
  const getMessageDelay = (index: number, totalMessages: number) => {
    // When loading history, skip animations for better performance
    if (isBatchLoading && totalMessages > 5) {
      // No animation delay for batch loaded messages
      return 0;
    }

    // For real-time messages, use minimal stagger
    return 0.03 * Math.min(index % 3, 3); // Reduced from 0.05
  };

  return (
    <motion.div
      className="flex-1 overflow-y-auto p-4 bg-gray-900 chat-scroll-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      ref={scrollContainerRef}
      onAnimationComplete={() => {
        // After animation completes, only scroll if no instant replies are showing
        if (!showInstantReplies || instantReplies.length === 0) {
          scrollToBottom();
        }
      }}
    >
      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((message, index) => {
            // Check if this is the welcome message to insert instant replies after it
            const isWelcomeMessage = message.id === "__welcome__";

            return (
              <div key={message.id}>
                {/* Render the message */}
                <motion.div
                  initial={
                    isBatchLoading && index < messages.length - 5
                      ? { opacity: 1, y: 0 }
                      : { opacity: 0, y: 10, scale: 0.98 }
                  }
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: isBatchLoading ? 0.15 : 0.2,
                    delay: getMessageDelay(index, messages.length),
                    ease: "easeOut",
                  }}
                  onAnimationComplete={() => {
                    if (
                      index === messages.length - 1 &&
                      (!showInstantReplies || instantReplies.length === 0)
                    ) {
                      scrollToBottom();
                    }
                  }}
                >
                  <MessageBubble
                    message={message}
                    onOptionClick={onOptionClick}
                    onSlotSelect={onSlotSelect}
                    onSlotConfirm={onSlotConfirm}
                    settings={settings}
                  />
                </motion.div>

                {/* Show instant replies AFTER welcome message */}
                {isWelcomeMessage &&
                  showInstantReplies &&
                  instantReplies.length > 0 && (
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`instant-reply-${currentInstantReplyIndex}`}
                        className="relative z-50 mt-4"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex justify-start">
                          <div className="w-8 h-8 rounded-full bg-indigo-900 flex items-center justify-center mr-2 mt-1 overflow-hidden flex-shrink-0">
                            {settings?.avatarUrl ? (
                              <img
                                src={settings.avatarUrl}
                                alt={settings?.name || "Assistant"}
                                className="w-full h-full object-cover rounded-full"
                              />
                            ) : (
                              <div className="flex items-center justify-center w-full h-full">
                                <RiRobot3Line className="text-indigo-300 text-xl" />
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() =>
                              onInstantReplyClick?.(
                                instantReplies[currentInstantReplyIndex].message
                              )
                            }
                            className="max-w-[75%] bg-indigo-700 hover:bg-indigo-600 text-white rounded-lg px-4 py-3 text-sm transition-all duration-200 cursor-pointer text-left shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            {instantReplies[currentInstantReplyIndex].message}
                          </button>
                        </div>
                        {/* Indicator dots */}
                        {instantReplies.length > 1 && (
                          <div className="flex justify-start ml-10 mt-2 space-x-1">
                            {instantReplies.map((_, idx) => (
                              <div
                                key={idx}
                                className={`w-1.5 h-1.5 rounded-full transition-all ${
                                  idx === currentInstantReplyIndex
                                    ? "bg-indigo-500 w-3"
                                    : "bg-gray-600"
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  )}
              </div>
            );
          })}
        </AnimatePresence>

        <AnimatePresence>
          {isTyping && (
            <motion.div
              className="flex items-start space-x-2 text-gray-300 text-sm ml-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onAnimationComplete={() => {
                // Only scroll if no instant replies are showing
                if (!showInstantReplies || instantReplies.length === 0) {
                  scrollToBottom();
                }
              }}
            >
              {/*               <div className="w-8 h-8 rounded-full bg-indigo-900 flex items-center justify-center">
                <RiRobot3Line className="text-indigo-300" />
              </div> */}
              <div className="flex space-x-1">
                <div
                  className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                  style={{ animationDelay: "200ms" }}
                ></div>
                <div
                  className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                  style={{ animationDelay: "400ms" }}
                ></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>
    </motion.div>
  );
};

export default ChatBody;
