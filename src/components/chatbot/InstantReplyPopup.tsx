import { AnimatePresence, motion } from "framer-motion";

interface InstantReplyMessage {
  message: string;
  order: number;
}

interface InstantReplyPopupProps {
  messages: InstantReplyMessage[];
  isOpen: boolean;
  onMessageClick: (message: string) => void;
  embedded?: boolean;
}

const InstantReplyPopup: React.FC<InstantReplyPopupProps> = ({
  messages,
  isOpen,
  onMessageClick,
  embedded = false,
}) => {
  if (!isOpen || messages.length === 0) return null;

  // Sort messages by order
  const sortedMessages = [...messages].sort((a, b) => a.order - b.order);

  return (
    <AnimatePresence>
      <motion.div
        className={`${embedded ? "absolute" : "fixed"} ${
          embedded ? "bottom-20 right-4" : "bottom-24 right-24"
        } z-50 space-y-2`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        {sortedMessages.map((msg, index) => (
          <motion.div
            key={msg.order}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{
              duration: 0.2,
              delay: index * 0.05, // Stagger each button by 50ms
            }}
          >
            <div
              className="bg-indigo-600 text-white rounded-lg p-3 shadow-lg cursor-pointer hover:bg-indigo-700 transition-colors relative"
              onClick={() => onMessageClick(msg.message)}
              style={{
                minWidth: embedded ? "180px" : "200px",
                maxWidth: embedded ? "280px" : "320px",
              }}
            >
              <p className="text-sm font-medium">{msg.message}</p>
              <div className="absolute -right-2 -bottom-2 w-4 h-4 bg-indigo-600 transform rotate-45"></div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
};

export default InstantReplyPopup;
