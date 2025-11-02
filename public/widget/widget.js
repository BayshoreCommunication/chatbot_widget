// Chatbot Widget Script
// This script allows organizations to embed the chatbot on their website

(function () {
  // Helper to ensure all URLs use HTTPS (prevents mixed content errors)
  function ensureHttps(url) {
    if (!url) return url;
    return url.replace(/^http:\/\//i, "https://");
  }

  // Simple sound notification functions
  let hasPlayedWelcomeSound = false;

  function playWelcomeSound() {
    if (hasPlayedWelcomeSound) return; // Only play once per session
    try {
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 523.25; // C note
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.5
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);

      hasPlayedWelcomeSound = true;
    } catch (error) {
      console.log("Audio not supported or blocked by browser");
    }
  }

  function playMessageSound() {
    try {
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // Higher pitch for message
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.15
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.15);
    } catch (error) {
      console.log("Audio not supported or blocked by browser");
    }
  }

  // Widget configuration
  const widgetConfig = {
    apiKey: "",
    position: "bottom-right", // default position
    settings: null, // will store chatbot settings
  };

  // Color utility functions
  function isColorString(str) {
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
  }

  function darkenHex(hex, amount = 12) {
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
      const toHex = (n) => n.toString(16).padStart(2, "0");
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    } catch (e) {
      return hex;
    }
  }

  function resolveColors(selected) {
    if (!selected)
      return {
        primary: "#3b82f6",
        hover: "#2563eb",
        shadow: "rgba(59, 130, 246, 0.4)",
      };

    // PRIORITY: If it's a hex color (like #1a0c0c), use it directly
    if (
      selected.startsWith("#") &&
      (selected.length === 4 || selected.length === 7)
    ) {
      const primary = darkenHex(selected, 10); // Make it 10% darker for primary
      const hover = darkenHex(selected, 20); // Make it 20% darker for hover
      const shadow = "rgba(0, 0, 0, 0.4)";
      return { primary, hover, shadow };
    }

    // If it's a predefined color name, use the old mapping
    const predefinedColors = {
      black: {
        primary: "#000000",
        hover: "#1a1a1a",
        shadow: "rgba(0, 0, 0, 0.4)",
      },
      red: {
        primary: "#ef4444",
        hover: "#dc2626",
        shadow: "rgba(239, 68, 68, 0.4)",
      },
      orange: {
        primary: "#f97316",
        hover: "#ea580c",
        shadow: "rgba(249, 115, 22, 0.4)",
      },
      blue: {
        primary: "#3b82f6",
        hover: "#2563eb",
        shadow: "rgba(59, 130, 246, 0.4)",
      },
      pink: {
        primary: "#ec4899",
        hover: "#db2777",
        shadow: "rgba(236, 72, 153, 0.4)",
      },
    };

    if (predefinedColors[selected]) {
      return predefinedColors[selected];
    }

    // If it's other color formats (rgb, hsl), use as-is
    if (isColorString(selected)) {
      const shadow = "rgba(0, 0, 0, 0.4)";
      return { primary: selected, hover: selected, shadow };
    }

    // Default fallback
    return {
      primary: "#3b82f6",
      hover: "#2563eb",
      shadow: "rgba(59, 130, 246, 0.4)",
    };
  }

  // Legacy color mapping for backward compatibility
  const colorMap = {
    black: {
      primary: "#000000",
      hover: "#1a1a1a",
      shadow: "rgba(0, 0, 0, 0.4)",
    },
    red: {
      primary: "#ef4444",
      hover: "#dc2626",
      shadow: "rgba(239, 68, 68, 0.4)",
    },
    orange: {
      primary: "#f97316",
      hover: "#ea580c",
      shadow: "rgba(249, 115, 22, 0.4)",
    },
    blue: {
      primary: "#3b82f6",
      hover: "#2563eb",
      shadow: "rgba(59, 130, 246, 0.4)",
    },
    pink: {
      primary: "#ec4899",
      hover: "#db2777",
      shadow: "rgba(236, 72, 153, 0.4)",
    },
  };

  // Parse script attributes or URL parameters
  function parseConfig() {
    // Get the script tag that loaded this widget
    const scripts = document.getElementsByTagName("script");
    const currentScript = scripts[scripts.length - 1];

    // Extract API key from data attribute
    if (currentScript.getAttribute("data-api-key")) {
      widgetConfig.apiKey = currentScript.getAttribute("data-api-key") || "";
    }

    // Extract fallback API key
    if (currentScript.getAttribute("data-fallback-api-key")) {
      widgetConfig.fallbackApiKey =
        currentScript.getAttribute("data-fallback-api-key") || "";
    }

    // Extract widget name
    if (currentScript.getAttribute("data-widget-name")) {
      widgetConfig.widgetName =
        currentScript.getAttribute("data-widget-name") || "AI Assistant";
    }

    // Extract widget color
    if (currentScript.getAttribute("data-widget-color")) {
      widgetConfig.widgetColor =
        currentScript.getAttribute("data-widget-color") || "blue";
    }

    // Extract auto-open setting
    if (currentScript.getAttribute("data-auto-open")) {
      widgetConfig.autoOpen =
        currentScript.getAttribute("data-auto-open") === "true";
    }

    // Extract lead capture setting
    if (currentScript.getAttribute("data-lead-capture")) {
      widgetConfig.leadCapture =
        currentScript.getAttribute("data-lead-capture") === "true";
    }

    // Extract position if specified
    if (currentScript.getAttribute("data-position")) {
      widgetConfig.position =
        currentScript.getAttribute("data-position") || "bottom-right";
    }

    // If no API key found in script tag, try URL query parameters
    if (!widgetConfig.apiKey) {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has("chatbot-api-key")) {
        widgetConfig.apiKey = urlParams.get("chatbot-api-key") || "";
      }
    }

    // Validate that we have an API key
    if (!widgetConfig.apiKey) {
      console.error(
        "Chatbot widget error: No API key provided. Add data-api-key attribute to script tag."
      );
      return false;
    }

    return true;
  }

  // Fetch chatbot settings with fallback
  async function fetchSettings() {
    try {
      const apiUrl = ensureHttps(
        window.CHATBOT_API_URL || "https://api.bayshorecommunication.org"
      );
      const response = await fetch(`${apiUrl}/api/chatbot/settings`, {
        method: "GET",
        headers: {
          "X-API-Key": widgetConfig.apiKey,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.warn("API returned error status:", response.status);
        // Try fallback API key if available
        const fallbackApiKey = document.currentScript?.getAttribute(
          "data-fallback-api-key"
        );
        if (fallbackApiKey && fallbackApiKey !== widgetConfig.apiKey) {
          console.log("Trying fallback API key...");
          widgetConfig.apiKey = fallbackApiKey;
          return await fetchSettingsWithKey(fallbackApiKey);
        }
        return false;
      }

      const data = await response.json();
      if (data.status === "success") {
        widgetConfig.settings = data.settings;
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to fetch chatbot settings:", error);

      // Try fallback API key if available
      const fallbackApiKey = document.currentScript?.getAttribute(
        "data-fallback-api-key"
      );
      if (fallbackApiKey && fallbackApiKey !== widgetConfig.apiKey) {
        console.log("Trying fallback API key due to error...");
        widgetConfig.apiKey = fallbackApiKey;
        return await fetchSettingsWithKey(fallbackApiKey);
      }

      return false;
    }
  }

  // Helper function to fetch settings with a specific API key
  async function fetchSettingsWithKey(apiKey) {
    try {
      const apiUrl = ensureHttps(
        window.CHATBOT_API_URL || "https://api.bayshorecommunication.org"
      );
      const response = await fetch(`${apiUrl}/api/chatbot/settings`, {
        method: "GET",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.warn(
          "Fallback API also returned error status:",
          response.status
        );
        return false;
      }

      const data = await response.json();
      if (data.status === "success") {
        widgetConfig.settings = data.settings;
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to fetch settings with fallback API key:", error);
      return false;
    }
  }

  // Create default settings when API fails
  function createDefaultSettings() {
    console.log("Creating default settings for widget");
    widgetConfig.settings = {
      name: widgetConfig.widgetName || "AI Assistant",
      selectedColor: widgetConfig.widgetColor || "blue",
      leadCapture:
        widgetConfig.leadCapture !== undefined
          ? widgetConfig.leadCapture
          : true,
      botBehavior: "2",
      avatarUrl: null,
      is_bot_connected: false,
      auto_open: widgetConfig.autoOpen || false,
      ai_behavior:
        "You are a helpful and friendly AI assistant. You should be professional, concise, and focus on providing accurate information while maintaining a warm and engaging tone.",
    };
    return true;
  }

  // Load CSS styles for the widget
  function loadStyles() {
    const style = document.createElement("style");
    const colors = resolveColors(widgetConfig.settings?.selectedColor);

    // Get font name from settings, fallback to system fonts
    const fontFamily =
      widgetConfig.settings?.font_name ||
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

    style.textContent = `
      /* Global font style for widget */
      .chatbot-widget-container,
      .chatbot-toggle-button,
      .chatbot-tooltip,
      .instant-reply-popup {
        font-family: ${fontFamily};
      }

      .chatbot-widget-container {
        position: fixed;
        z-index: 9999;
        width: 350px;
        height: 500px;
        box-shadow: 0 5px 40px rgba(0, 0, 0, 0.3);
        border-radius: 12px;
        overflow: hidden;
        background-color: #1a202c;
        border: 1px solid #2d3748;
        will-change: transform, opacity;
      }
      .chatbot-widget-container.bottom-right {
        bottom: 60px;
        right: 20px;
      }
      .chatbot-widget-container.bottom-left {
        bottom: 60px;
        left: 20px;
      }
      .chatbot-widget-container.top-right {
        top: 90px;
        right: 20px;
      }
      .chatbot-widget-container.top-left {
        top: 60px;
        left: 20px;
      }
      .chatbot-widget-container.hidden {
        visibility: hidden;
        opacity: 0;
        transform: scale(0.9) translateY(20px);
        pointer-events: none;
      }
      .chatbot-widget-container.visible {
        visibility: visible;
        opacity: 1;
        transform: scale(1) translateY(0);
        transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), 
                    opacity 0.2s ease, 
                    visibility 0s;
      }
      .chatbot-toggle-button {
        position: fixed;
        z-index: 10000;
        border: none;
        border-radius: 50%;
        width: 56px;
        height: 56px;
        background-color: ${colors.primary};
        color: white;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), 
                    background-color 0.3s ease,
                    opacity 0.3s ease,
                    visibility 0.3s ease;
        will-change: transform, opacity;
      }
      .chatbot-toggle-button:hover {
        transform: scale(1.1);
        background-color: ${colors.hover};
      }
      .chatbot-toggle-button.bottom-right {
        bottom: 20px;
        right: 20px;
      }
      .chatbot-toggle-button.bottom-left {
        bottom: 20px;
        left: 20px;
      }
      .chatbot-toggle-button.top-right {
        top: 20px;
        right: 20px;
      }
      .chatbot-toggle-button.top-left {
        top: 20px;
        left: 20px;
      }
      .chatbot-toggle-button.hidden {
        transform: scale(0);
        opacity: 0;
        visibility: hidden;
      }
      .chatbot-iframe {
        width: 100%;
        height: 100%;
        border: none;
        display: block;
      }
      
      /* Tooltip styles */
      .chatbot-tooltip {
        position: absolute;
        background-color: ${colors.primary};
        color: white;
        padding: 8px 12px;
        border-radius: 8px;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        max-width: 220px;
        z-index: 10001;
        opacity: 0;
        transform: translateX(10px);
        transition: opacity 0.3s ease, transform 0.3s ease;
      }
      .chatbot-tooltip.bottom-right {
        bottom: 70px;
        right: 70px;
      }
      .chatbot-tooltip.bottom-left {
        bottom: 70px;
        left: 70px;
      }
      .chatbot-tooltip.top-right {
        top: 70px;
        right: 70px;
      }
      .chatbot-tooltip.top-left {
        top: 70px;
        left: 70px;
      }
      .chatbot-tooltip.visible {
        opacity: 1;
        transform: translateX(0);
      }
      .chatbot-tooltip:after {
        content: '';
        position: absolute;
        width: 0;
        height: 0;
        border-style: solid;
      }
      .chatbot-tooltip.bottom-right:after {
        border-width: 8px 8px 0 0;
        border-color: ${colors.primary} transparent transparent transparent;
        bottom: -8px;
        right: 20px;
      }
      .chatbot-tooltip.bottom-left:after {
        border-width: 8px 0 0 8px;
        border-color: ${colors.primary} transparent transparent transparent;
        bottom: -8px;
        left: 20px;
      }
      
      @keyframes pulse-theme {
        0% {
          box-shadow: 0 0 0 0 ${colors.shadow};
        }
        70% {
          box-shadow: 0 0 0 10px rgba(0, 0, 0, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
        }
      }
      
      .animate-pulse-theme {
        animation: pulse-theme 2s infinite;
        padding: 3px;
      }

      @keyframes typing-dots {
        0%, 20% {
          opacity: 0;
        }
        50% {
          opacity: 1;
        }
        100% {
          opacity: 0;
        }
      }

      .typing-dot {
        display: inline-block;
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background-color: white;
        margin: 0 2px;
        opacity: 0;
      }

      .typing-dot:nth-child(1) {
        animation: typing-dots 1.4s infinite 0.2s;
      }
      .typing-dot:nth-child(2) {
        animation: typing-dots 1.4s infinite 0.4s;
      }
      .typing-dot:nth-child(3) {
        animation: typing-dots 1.4s infinite 0.6s;
      }

      /* New styles for the chat icon */
      .chatbot-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        object-fit: cover;
      }

      .chatbot-icon {
        width: 24px;
        height: 24px;
      }
      @media (min-width: 640px) {
        .chatbot-icon {
          width: 32px;
          height: 32px;
        }
      }

      /* Instant reply popup styles */
      .instant-reply-container {
        position: fixed;
        z-index: 10001;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
      }
      .instant-reply-container.bottom-right {
        bottom: 20px;
        right: 90px;
        align-items: flex-end;
      }
      .instant-reply-container.bottom-left {
        bottom: 20px;
        left: 90px;
        align-items: flex-start;
      }
      .instant-reply-container.top-right {
        top: 20px;
        right: 90px;
        align-items: flex-end;
      }
      .instant-reply-container.top-left {
        top: 20px;
        left: 90px;
        align-items: flex-start;
      }
      .instant-reply-popup {
        background: ${colors.primary};
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        max-width: 280px;
        pointer-events: auto;
        cursor: pointer;
        animation: slideInFromRight 0.3s ease;
        transition: transform 0.3s ease, opacity 0.3s ease;
        margin: 4px 0;
      }
      .instant-reply-popup:hover {
        transform: translateX(-2px);
      }
      .instant-reply-popup.fade-out {
        opacity: 0;
        transform: translateX(-10px);
      }
      @keyframes slideInFromRight {
        from {
          opacity: 0;
          transform: translateX(20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      /* Add a tail/arrow pointing to the chat icon */
      .instant-reply-popup:after {
        content: '';
        position: absolute;
        right: -8px;
        top: 50%;
        transform: translateY(-50%);
        border-style: solid;
        border-width: 8px 0 8px 8px;
        border-color: transparent transparent transparent ${colors.primary};
      }

      /* For left-positioned widgets, flip the tail */
      .instant-reply-container.bottom-left .instant-reply-popup:after,
      .instant-reply-container.top-left .instant-reply-popup:after {
        right: auto;
        left: -8px;
        border-width: 8px 8px 8px 0;
        border-color: transparent ${colors.primary} transparent transparent;
      }

      /* Adjust animation for left-positioned widgets */
      .instant-reply-container.bottom-left .instant-reply-popup,
      .instant-reply-container.top-left .instant-reply-popup {
        animation: slideInFromLeft 0.3s ease;
      }

      @keyframes slideInFromLeft {
        from {
          opacity: 0;
          transform: translateX(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Create and inject the widget components
  function createWidget() {
    // Create the toggle button
    const toggleButton = document.createElement("button");
    toggleButton.className = `chatbot-toggle-button ${widgetConfig.position}`;

    // Use avatar if provided, otherwise use default chat icon
    if (widgetConfig.settings?.avatarUrl) {
      toggleButton.innerHTML = `
                <img src="${widgetConfig.settings.avatarUrl}" alt="${
        widgetConfig.settings?.name || "Chat"
      }" class="chatbot-avatar">
            `;
    } else {
      toggleButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="chatbot-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
            `;
    }

    // Create the widget container (initially hidden)
    const widgetContainer = document.createElement("div");
    widgetContainer.className = `chatbot-widget-container ${widgetConfig.position} hidden`;

    // Create instant reply container
    const instantReplyContainer = document.createElement("div");
    instantReplyContainer.className = `instant-reply-container ${widgetConfig.position}`;

    // Flags and cleanup arrays
    let instantReplyLoopRunning = false;
    let instantReplyTimeouts = [];

    // Create the iframe that will load the chatbot
    const iframe = document.createElement("iframe");
    iframe.className = "chatbot-iframe";

    // Set the iframe source to load the chatbot with the apiKey parameter
    const widgetUrl = ensureHttps(
      window.CHATBOT_WIDGET_URL ||
        "https://aibotwidget.bayshorecommunication.org"
    );
    const chatbotUrl = new URL(`${widgetUrl}/chatbot-embed`);
    chatbotUrl.searchParams.append("apiKey", widgetConfig.apiKey);
    chatbotUrl.searchParams.append("isWidget", "true");

    // Add settings to URL if lead capture is enabled
    if (widgetConfig.settings?.leadCapture) {
      chatbotUrl.searchParams.append("leadCapture", "true");
    }

    iframe.src = chatbotUrl.toString();

    // Append iframe to widget container
    widgetContainer.appendChild(iframe);

    // Add the elements to the DOM
    document.body.appendChild(toggleButton);
    document.body.appendChild(widgetContainer);
    document.body.appendChild(instantReplyContainer);

    // Add a pulse animation to the button
    toggleButton.classList.add("animate-pulse-theme");

    // Helper function to clear all instant reply timeouts
    function clearInstantReplyTimeouts() {
      instantReplyTimeouts.forEach((id) => clearTimeout(id));
      instantReplyTimeouts = [];
    }

    // Function to close the chat widget with animation
    function closeWidget() {
      // First start the animation
      widgetContainer.classList.remove("visible");
      widgetContainer.classList.add("hidden");

      // Show the button with animation
      toggleButton.style.display = "flex";
      setTimeout(() => {
        toggleButton.classList.remove("hidden");

        // Add pulse effect after the button appears
        setTimeout(() => {
          if (!isOpen) {
            toggleButton.classList.add("animate-pulse-theme");
          }
        }, 500);
      }, 100);

      isOpen = false;

      // Restart instant reply loop after a delay
      if (!instantReplyLoopRunning) {
        const restartTimeout = setTimeout(() => {
          instantReplyLoopRunning = false;
          fetchInstantReplies();
        }, 2000);
        instantReplyTimeouts.push(restartTimeout);
      }
    }

    // Function to open the chat widget with animation
    function openWidget() {
      // Hide button first
      toggleButton.classList.add("hidden");
      toggleButton.classList.remove("animate-pulse-theme");

      // Show widget with animation
      widgetContainer.classList.remove("hidden");

      // Trigger reflow for animation
      void widgetContainer.offsetWidth;

      // Add visible class to start animation
      widgetContainer.classList.add("visible");

      // Hide button element after animation
      setTimeout(() => {
        if (isOpen) {
          toggleButton.style.display = "none";
        }
      }, 300);

      isOpen = true;

      // Fallback: Play welcome sound on first open if it was blocked by autoplay policy
      if (!hasPlayedWelcomeSound) {
        const soundSettings = widgetConfig.settings?.sound_notifications;
        if (soundSettings?.enabled && soundSettings?.welcome_sound?.enabled) {
          console.log("🔊 Playing welcome sound on chat open (fallback)...");
          setTimeout(() => {
            playWelcomeSound();
          }, 300); // Short delay for smooth UX
        }
      }

      // Clear instant reply popups and stop loop when chat opens
      instantReplyContainer.innerHTML = "";
      clearInstantReplyTimeouts();
      instantReplyLoopRunning = false;
    }

    // Function to show all instant reply popups at once (stacked)
    function showAllInstantReplies(messages) {
      // Clear any existing popups
      instantReplyContainer.innerHTML = "";

      // Show all messages stacked with staggered animation
      messages.forEach((messageObj, index) => {
        const timeout = setTimeout(() => {
          if (!isOpen) {
            const popup = document.createElement("div");
            popup.className = "instant-reply-popup";
            popup.innerHTML = messageObj.message;

            // Add click handler to open chat
            popup.addEventListener("click", () => {
              openWidget();
            });

            // Add to container
            instantReplyContainer.appendChild(popup);
          }
        }, index * 100); // Stagger by 100ms for smooth appearance

        instantReplyTimeouts.push(timeout);
      });

      // Auto-hide all popups after 10 seconds
      const hideTimeout = setTimeout(() => {
        const popups = instantReplyContainer.querySelectorAll(
          ".instant-reply-popup"
        );
        popups.forEach((popup, index) => {
          const fadeTimeout = setTimeout(() => {
            popup.classList.add("fade-out");
            setTimeout(() => popup.remove(), 300);
          }, index * 50);
          instantReplyTimeouts.push(fadeTimeout);
        });
      }, 10000);

      instantReplyTimeouts.push(hideTimeout);
    }

    // Function to show instant reply popup (legacy - for single message)
    function showInstantReply(message, displayDuration = 4000) {
      const startTime = new Date().toLocaleTimeString();

      // Clear any existing popups first (only show one at a time)
      instantReplyContainer.innerHTML = "";

      const popup = document.createElement("div");
      popup.className = "instant-reply-popup";
      popup.innerHTML = message;

      // Add click handler to open chat
      popup.addEventListener("click", () => {
        openWidget();
        // Remove all popups when chat is opened
        instantReplyContainer.innerHTML = "";
      });

      // Add to container
      instantReplyContainer.appendChild(popup);

      // Auto remove after specified duration (4 seconds by default)
      const timeout = setTimeout(() => {
        const endTime = new Date().toLocaleTimeString();
        popup.classList.add("fade-out");
        setTimeout(() => popup.remove(), 300);
      }, displayDuration);

      instantReplyTimeouts.push(timeout);
    }

    // Function to fetch and display instant replies with continuous looping
    async function fetchInstantReplies() {
      // Prevent multiple loops from running
      if (instantReplyLoopRunning) {
        return;
      }

      try {
        const apiUrl = ensureHttps(
          window.CHATBOT_API_URL || "https://api.bayshorecommunication.org"
        );
        const response = await fetch(`${apiUrl}/api/instant-reply`, {
          headers: {
            "X-API-Key": widgetConfig.apiKey,
          },
        });
        const data = await response.json();

        if (
          data &&
          data.status === "success" &&
          data.data &&
          data.data.isActive
        ) {
          const messages = data.data.messages || [];

          if (messages.length > 0) {
            // Sort messages by order
            const sortedMessages = messages.sort((a, b) => a.order - b.order);

            // Set flag to prevent multiple loops
            instantReplyLoopRunning = true;

            // Function to show all messages at once, then loop
            function showMessagesLoop() {
              console.log("🔄 Showing all instant reply messages...");

              // Show all messages at once (stacked)
              showAllInstantReplies(sortedMessages);

              // Schedule next loop after 15 seconds (10s display + 5s pause)
              const loopTimeout = setTimeout(() => {
                if (!isOpen) {
                  showMessagesLoop();
                }
              }, 15000);

              instantReplyTimeouts.push(loopTimeout);
            }

            // Start the message loop
            showMessagesLoop();
          }
        } else {
          console.log("❌ Instant replies not active or no messages available");
        }
      } catch (error) {
        console.error("💥 Error fetching instant replies:", error);
      }
    }

    // Listen for messages from the iframe
    window.addEventListener("message", (event) => {
      // Verify origin for security
      const widgetUrl =
        window.CHATBOT_WIDGET_URL ||
        "https://aibotwidget.bayshorecommunication.org";
      if (event.origin !== widgetUrl) {
        return;
      }

      // Handle close command from iframe
      if (event.data === "closeChatbot") {
        closeWidget();
      }

      // Handle message sent event for sound notification
      if (event.data === "messageSent") {
        const soundSettings = widgetConfig.settings?.sound_notifications;
        if (
          soundSettings?.enabled &&
          soundSettings?.message_sound?.enabled &&
          soundSettings?.message_sound?.play_on_send
        ) {
          playMessageSound();
        }
      }
    });

    // Toggle widget visibility when button is clicked
    let isOpen = false;
    toggleButton.addEventListener("click", () => {
      if (isOpen) {
        closeWidget();
      } else {
        openWidget();
      }
    });

    // Start fetching instant replies after widget initialization
    const initTimeout = setTimeout(() => {
      fetchInstantReplies();
    }, 1000); // Reduced from 2s to 1s

    instantReplyTimeouts.push(initTimeout);

    // Check if auto-open is enabled from API settings
    if (
      widgetConfig.settings?.auto_open_widget ||
      widgetConfig.settings?.auto_open
    ) {
      console.log("🚀 Auto-opening widget...");
      const autoOpenTimeout = setTimeout(() => {
        if (!isOpen) {
          openWidget();
        }
      }, 500); // Small delay for smooth UX
      instantReplyTimeouts.push(autoOpenTimeout);
    }
  }

  // Initialize the widget
  async function init() {
    if (parseConfig()) {
      // Make sure we have the API key before fetching settings
      if (widgetConfig.apiKey) {
        const settingsLoaded = await fetchSettings();
        if (!settingsLoaded) {
          console.log(
            "Failed to load settings from API, using default settings"
          );
          createDefaultSettings();
        }
      } else {
        console.error("API key is required to fetch settings");
        createDefaultSettings();
      }
      loadStyles();
      createWidget();
      console.log(
        "Chatbot widget initialized with API key:",
        widgetConfig.apiKey
      );

      // Mark widget as loaded for fallback detection
      window.chatbotWidgetLoaded = true;

      // Play welcome sound 2-3 seconds AFTER widget is fully loaded and visible
      const soundSettings = widgetConfig.settings?.sound_notifications;
      if (soundSettings?.enabled && soundSettings?.welcome_sound?.enabled) {
        console.log(
          "🔊 Scheduling welcome sound for 2.5 seconds after page load..."
        );
        setTimeout(() => {
          console.log("🔊 Playing welcome sound now...");
          playWelcomeSound();
        }, 2500); // 2.5 seconds after widget is fully initialized
      }
    }
  }

  // Initialize when DOM is fully loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
