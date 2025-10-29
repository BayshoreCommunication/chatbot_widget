import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
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
        isBatchLoading ? 100 : 100
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
    }, 100);

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
    // When loading history, only animate a few most recent messages
    if (isBatchLoading && totalMessages > 10) {
      // Only animate the last 5 messages
      const lastMessageIndex = totalMessages - 1;
      const animationThreshold = lastMessageIndex - 4;

      if (index <= animationThreshold) {
        // No animation delay for older messages
        return 0;
      }

      // Stagger animation only for the last 5 messages
      return 0.05 * (index - animationThreshold);
    }

    // Normal animation behavior for smaller histories or non-batch loads
    return 0.05 * Math.min(index % 5, 5);
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
        {/* Instant Replies Section */}
        <AnimatePresence>
          {showInstantReplies && instantReplies.length > 0 && (
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {instantReplies.map((reply, index) => (
                <motion.div
                  key={`instant-reply-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex justify-start"
                >
                  <button
                    onClick={() => onInstantReplyClick?.(reply.message)}
                    className="max-w-[75%] bg-indigo-700 hover:bg-indigo-600 text-white rounded-lg p-3 text-sm transition-colors duration-200 cursor-pointer text-left"
                  >
                    {reply.message}
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={
                isBatchLoading && index < messages.length - 5
                  ? { opacity: 1, y: 0 }
                  : { opacity: 0, y: 20, scale: 0.95 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.3,
                delay: getMessageDelay(index, messages.length),
                type: "spring",
                stiffness: 400,
                damping: 30,
              }}
              onAnimationComplete={() => {
                // Ensure we're still at the bottom after each message animates
                // Only scroll if no instant replies are showing
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
          ))}
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
