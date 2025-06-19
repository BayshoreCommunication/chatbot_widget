import { useState } from 'react';
import type { Message, AppointmentSlot } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import { RiRobot3Line, RiCalendarEventLine, RiExternalLinkLine } from 'react-icons/ri';

interface MessageBubbleProps {
    message: Message;
    onOptionClick?: (option: string) => void;
    onSlotSelect?: (slot: AppointmentSlot) => void;
    onSlotConfirm?: (slot: AppointmentSlot) => void;
}

interface AppointmentBookingLink {
    text: string;
    url: string;
    appointmentDetails?: {
        date: string;
        time: string;
    };
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
    message,
    onOptionClick,
    onSlotSelect,
    onSlotConfirm
}) => {
    const { text, sender, timestamp, options, appointmentSlots, selectedSlot, awaitingConfirmation, confirmed } = message;
    const isBot = sender === 'bot';
    const [selectedLocalSlot, setSelectedLocalSlot] = useState<AppointmentSlot | null>(null);
    const [isConfirmed, setIsConfirmed] = useState<boolean>(false);

    // Format time to show hours and minutes
    const formattedTime = new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });

    const handleOptionClick = (option: string) => {
        if (onOptionClick) {
            onOptionClick(option);
        }
    };

    const handleSlotSelect = (slot: AppointmentSlot) => {
        setSelectedLocalSlot(slot);
        if (onSlotSelect) {
            onSlotSelect(slot);
        }
    };

    const handleSlotConfirm = () => {
        setIsConfirmed(true);
        if (selectedSlot && onSlotConfirm) {
            onSlotConfirm(selectedSlot);
        } else if (selectedLocalSlot && onSlotConfirm) {
            onSlotConfirm(selectedLocalSlot);
        }
    };

    // Helper function to parse appointment booking links
    const parseAppointmentBookingLinks = (text: string): { cleanText: string; bookingLinks: AppointmentBookingLink[] } => {
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const bookingLinks: AppointmentBookingLink[] = [];
        let cleanText = text;

        // Extract appointment details if present in the text
        const dateMatch = text.match(/(?:for\s+)?(\w+day),\s+([A-Za-z]+\s+\d+,\s+\d+)/i);
        const timeMatch = text.match(/at\s+(\d+:\d+\s+[AP]M)/i);

        let match;
        while ((match = linkRegex.exec(text)) !== null) {
            const [fullMatch, linkText, url] = match;

            // Check if this is likely a booking link (Calendly, booking-related text, etc.)
            const isBookingLink = url.includes('calendly.com') ||
                url.includes('booking') ||
                linkText.toLowerCase().includes('book') ||
                linkText.toLowerCase().includes('schedule') ||
                linkText.toLowerCase().includes('appointment');

            if (isBookingLink) {
                const appointmentDetails = dateMatch && timeMatch ? {
                    date: `${dateMatch[1]}, ${dateMatch[2]}`,
                    time: timeMatch[1]
                } : undefined;

                bookingLinks.push({
                    text: linkText,
                    url,
                    appointmentDetails
                });

                // Remove the markdown link from the clean text
                cleanText = cleanText.replace(fullMatch, '');
            }
        }

        // Clean up any leftover formatting
        cleanText = cleanText.replace(/\n\s*\n/g, '\n').trim();

        return { cleanText, bookingLinks };
    };

    // Helper function to parse appointment slots from text
    const parseSlotsFromText = (text: string): AppointmentSlot[] => {
        const slots: AppointmentSlot[] = [];
        const lines = text.split('\n');

        let currentDate = '';
        let currentDay = '';

        for (const line of lines) {
            if (line.includes('📅')) {
                const dateMatch = line.match(/📅\s+(.*?)(?:,\s+(\d{4}))?$/);
                if (dateMatch) {
                    currentDay = dateMatch[1];
                    currentDate = currentDay;
                }
            } else if (line.trim().startsWith('•') || line.trim().startsWith('*') || line.trim().startsWith('-')) {
                const timeMatch = line.match(/([0-9]+:[0-9]+\s+[AP]M)/i);

                if (timeMatch) {
                    // Extract day from the line if it contains a day
                    const dayMatch = line.match(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)(?:,\s+([A-Za-z]+\s+\d+))?/);
                    const slotDay = dayMatch ? dayMatch[1] : currentDay;
                    const slotDate = dayMatch && dayMatch[2] ? dayMatch[2] : currentDate;

                    // Generate a unique ID if none exists
                    const id = `slot_${slotDay}_${timeMatch[1].replace(/\s+/g, '').replace(':', '')}_${Math.floor(Math.random() * 1000)}`;

                    slots.push({
                        id: id,
                        day: slotDay,
                        date: slotDate,
                        time: timeMatch[1],
                        available: true
                    });
                }
            }
        }

        return slots;
    };

    // Parse the message for booking links
    const { cleanText, bookingLinks } = parseAppointmentBookingLinks(text);

    // If appointmentSlots is not provided but text contains appointment info, try to parse it
    const hasAppointmentInfo = text.includes('appointment') &&
        (text.includes('Available appointment slots') ||
            text.match(/\d+:\d+\s+[AP]M/i) ||
            text.includes('book') ||
            text.includes('slot'));

    const displaySlots = appointmentSlots || (
        hasAppointmentInfo ? parseSlotsFromText(text) : undefined
    );

    // Extract any intro text that should still be displayed
    const getIntroText = () => {
        if (!hasAppointmentInfo || !displaySlots || displaySlots.length === 0) return cleanText;

        // Split by the first occurrence of a list pattern
        const parts = cleanText.split(/(?=(?:-|\*|•|\d+\.)\s+.*\d+:\d+\s+[AP]M)/i);
        if (parts.length > 1) {
            return parts[0].trim();
        }

        return cleanText.split('\n').filter(line =>
            !line.match(/\d+:\d+\s+[AP]M/i) &&
            !line.trim().startsWith('-') &&
            !line.trim().startsWith('*') &&
            !line.trim().startsWith('•')
        ).join('\n');
    };

    const introText = getIntroText();
    const appointmentConfirmed = isConfirmed || confirmed;

    // Animation variants
    const buttonVariants = {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        hover: { scale: 1.03, backgroundColor: "rgb(67, 56, 202)" },
        tap: { scale: 0.97 }
    };

    const slotsContainerVariants = {
        initial: { opacity: 0 },
        animate: {
            opacity: 1,
            transition: {
                staggerChildren: 0.06
            }
        }
    };

    const slotItemVariants = {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 }
    };

    const bookingLinkVariants = {
        initial: { opacity: 0, y: 15, scale: 0.95 },
        animate: { opacity: 1, y: 0, scale: 1 },
        hover: {
            scale: 1.02,
            boxShadow: "0 8px 25px rgba(99, 102, 241, 0.4)",
            transition: { duration: 0.2 }
        },
        tap: { scale: 0.98 }
    };

    return (
        <div className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
            {isBot && (
                <motion.div
                    className=" w-8 h-8 rounded-full bg-indigo-900 flex items-center justify-start mr-2 mt-1"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, delay: 0.1 }}
                >
                    <div className='flex items-center justify-center ml-1.5'>
                        <RiRobot3Line className='text-indigo-300 text-xl' />
                    </div>
                </motion.div>
            )}

            <div className="max-w-[75%] flex flex-col">
                <motion.div
                    className={`rounded-lg px-4 py-2 ${isBot
                        ? 'bg-gray-800 border border-gray-700 text-gray-100 text-left'
                        : 'bg-indigo-600 border border-indigo-500 shadow-sm text-white text-left flex flex-col'
                        }`}
                    initial={{ opacity: 0, scale: 0.8, x: isBot ? -20 : 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                >
                    {/* Show only intro text when appointment slots are available */}
                    {(!displaySlots || displaySlots.length === 0) ? (
                        <p className={`whitespace-pre-wrap break-words leading-relaxed tracking-wide ${!isBot ? 'font-medium' : ''}`}>{cleanText}</p>
                    ) : (
                        <p className={`whitespace-pre-wrap break-words leading-relaxed tracking-wide ${!isBot ? 'font-medium' : ''}`}>{introText}</p>
                    )}

                    {/* Professional Appointment Booking Links */}
                    <AnimatePresence>
                        {isBot && bookingLinks.length > 0 && (
                            <motion.div
                                className="mt-4 space-y-3"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                            >
                                {bookingLinks.map((link, index) => (
                                    <motion.div
                                        key={index}
                                        className="relative"
                                        variants={bookingLinkVariants}
                                        initial="initial"
                                        animate="animate"
                                        whileHover="hover"
                                        whileTap="tap"
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        {/* Professional Appointment Card */}
                                        <div className="bg-gray-700 rounded-xl p-4 shadow-lg border border-gray-600 backdrop-blur-sm">
                                            {/* Header */}
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                                                        <RiCalendarEventLine className="text-white text-lg" />
                                                    </div>
                                                    <h3 className="font-semibold text-gray-100 text-sm">
                                                        Appointment Ready
                                                    </h3>
                                                </div>
                                                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                                            </div>

                                            {/* Appointment Details */}
                                            {link.appointmentDetails && (
                                                <div className="mb-4 p-3 bg-gray-800 rounded-lg border border-gray-600">
                                                    <div className="text-gray-300 text-xs font-medium mb-1">Scheduled for:</div>
                                                    <div className="text-gray-100 font-semibold text-sm">
                                                        {link.appointmentDetails.date}
                                                    </div>
                                                    <div className="text-gray-200 text-sm">
                                                        {link.appointmentDetails.time}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Action Button */}
                                            <motion.a
                                                href={link.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group relative w-full inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg transition-all duration-200 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-700"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <span className="flex items-center space-x-2">
                                                    <span>{link.text}</span>
                                                    <RiExternalLinkLine className="text-sm transition-transform group-hover:translate-x-0.5" />
                                                </span>
                                            </motion.a>

                                            {/* Footer */}
                                            <div className="mt-3 flex items-center justify-between text-gray-400 text-xs">
                                                <span>Click to confirm your booking</span>
                                                <span>•</span>
                                                <span>Calendly</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Regular options */}
                    {isBot && options && options.length > 0 && !displaySlots && (
                        <motion.div
                            className="mt-3 space-y-2"
                            initial="initial"
                            animate="animate"
                            variants={slotsContainerVariants}
                        >
                            {options.map((option, index) => (
                                <motion.button
                                    key={index}
                                    onClick={() => handleOptionClick(option)}
                                    className="w-full text-left px-3 py-1.5 bg-indigo-900 hover:bg-indigo-800 text-indigo-100 rounded text-sm transition-colors"
                                    variants={buttonVariants}
                                    whileHover="hover"
                                    whileTap="tap"
                                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                >
                                    {option}
                                </motion.button>
                            ))}
                        </motion.div>
                    )}

                    {/* Appointment slots as buttons */}
                    <AnimatePresence>
                        {isBot && displaySlots && displaySlots.length > 0 && !selectedSlot && !awaitingConfirmation && !appointmentConfirmed && (
                            <motion.div
                                className="mt-3"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                transition={{ duration: 0.3 }}
                            >
                                <motion.h4
                                    className="font-medium text-gray-300 mb-2"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    Available Slots:
                                </motion.h4>
                                <motion.div
                                    className="grid grid-cols-2 gap-2"
                                    variants={slotsContainerVariants}
                                    initial="initial"
                                    animate="animate"
                                >
                                    {displaySlots.map((slot, index) => (
                                        <motion.button
                                            key={slot.id}
                                            onClick={() => handleSlotSelect(slot)}
                                            className={`px-3 py-2 bg-indigo-900 hover:bg-indigo-800 text-indigo-100 rounded text-sm transition-colors ${selectedLocalSlot?.id === slot.id ? 'ring-2 ring-indigo-500 bg-indigo-800' : ''}`}
                                            variants={slotItemVariants}
                                            whileHover="hover"
                                            whileTap="tap"
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <div className="font-medium">{slot.day}</div>
                                            <div>{slot.time}</div>
                                        </motion.button>
                                    ))}
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Confirmation UI */}
                    <AnimatePresence>
                        {isBot && (selectedSlot || selectedLocalSlot) && (awaitingConfirmation || selectedLocalSlot) && !appointmentConfirmed && (
                            <motion.div
                                className="mt-3 p-3 bg-gray-700 rounded-lg"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                            >
                                <motion.h4
                                    className="font-medium text-gray-200"
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    Confirm your appointment:
                                </motion.h4>
                                <motion.div
                                    className="my-2 p-2 bg-gray-800 rounded border border-gray-600"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <p className="font-medium">{selectedSlot?.day || selectedLocalSlot?.day}</p>
                                    <p>{selectedSlot?.time || selectedLocalSlot?.time}</p>
                                    <p className="text-xs text-gray-400">ID: {selectedSlot?.id || selectedLocalSlot?.id}</p>
                                </motion.div>
                                <motion.div
                                    className="flex space-x-2 mt-2"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <motion.button
                                        onClick={handleSlotConfirm}
                                        className="px-4 py-1.5 bg-green-700 hover:bg-green-800 text-white rounded text-sm transition-colors"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        Confirm
                                    </motion.button>
                                    <motion.button
                                        onClick={() => setSelectedLocalSlot(null)}
                                        className="px-4 py-1.5 bg-gray-600 hover:bg-gray-500 text-gray-100 rounded text-sm transition-colors"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        Cancel
                                    </motion.button>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Confirmed Appointment Display */}
                    <AnimatePresence>
                        {isBot && (selectedSlot || selectedLocalSlot) && appointmentConfirmed && (
                            <motion.div
                                className="mt-3 p-3 bg-green-900 rounded-lg"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 15
                                }}
                            >
                                <motion.div
                                    className="flex items-center mb-2"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-300 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <h4 className="font-medium text-green-200">Appointment Selected!</h4>
                                </motion.div>
                                <motion.div
                                    className="p-2 bg-gray-800 rounded border border-green-700"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <p className="font-medium">{selectedSlot?.day || selectedLocalSlot?.day}</p>
                                    <p>{selectedSlot?.time || selectedLocalSlot?.time}</p>
                                    <p className="text-xs text-gray-400">ID: {selectedSlot?.id || selectedLocalSlot?.id}</p>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                <motion.span
                    className={`text-xs mt-1 text-gray-400 ${isBot ? 'ml-1' : 'mr-1 self-end font-medium'}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    {formattedTime}
                </motion.span>
            </div>

            {!isBot && (
                <motion.div
                    className="w-8 h-8 rounded-full bg-indigo-600 border border-indigo-500 shadow-md flex items-center justify-center ml-2 mt-1"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, delay: 0.1 }}
                >
                    <span className="text-white text-sm font-medium">U</span>
                </motion.div>
            )}
        </div>
    );
};

export default MessageBubble; 