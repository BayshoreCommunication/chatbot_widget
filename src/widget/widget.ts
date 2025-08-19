// Chatbot Widget Script
// This script allows organizations to embed the chatbot on their website

(function () {
  // Widget configuration
  const widgetConfig = {
    apiKey: "",
    position: "bottom-right", // default position
  };

  // Environment detection and URL configuration
  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const baseUrl = isDevelopment ? 'http://localhost:5174' : 'https://aibotwizard.vercel.app';

  // Parse script attributes or URL parameters
  function parseConfig() {
    // Get the script tag that loaded this widget
    const scripts = document.getElementsByTagName("script");
    const currentScript = scripts[scripts.length - 1];

    // Extract API key from data attribute
    if (currentScript.getAttribute("data-api-key")) {
      widgetConfig.apiKey = currentScript.getAttribute("data-api-key") || "";
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

  // Load CSS styles for the widget
  function loadStyles() {
    const style = document.createElement("style");
    style.textContent = `
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
        background-color: #4f46e5;
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
        background-color: #4338ca;
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
        background-color: #4f46e5;
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
        border-color: #4f46e5 transparent transparent transparent;
        bottom: -8px;
        right: 20px;
      }
      .chatbot-tooltip.bottom-left:after {
        border-width: 8px 0 0 8px;
        border-color: #4f46e5 transparent transparent transparent;
        bottom: -8px;
        left: 20px;
      }
      
      @keyframes pulse-indigo {
        0% {
          box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.4);
        }
        70% {
          box-shadow: 0 0 0 10px rgba(79, 70, 229, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(79, 70, 229, 0);
        }
      }
      
      .animate-pulse-indigo {
        animation: pulse-indigo 2s infinite;
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
    `;
    document.head.appendChild(style);
  }

  // Create and inject the widget components
  function createWidget() {
    // Create the toggle button (chat icon)
    const toggleButton = document.createElement("button");
    toggleButton.className = `chatbot-toggle-button ${widgetConfig.position}`;
    toggleButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    `;

    // Create the widget container (initially hidden)
    const widgetContainer = document.createElement("div");
    widgetContainer.className = `chatbot-widget-container ${widgetConfig.position} hidden`;

    // Create the tooltip
    const tooltip = document.createElement("div");
    tooltip.className = `chatbot-tooltip ${widgetConfig.position}`;
    tooltip.innerHTML = `
      Need help? <span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>
    `;

    // Create the iframe that will load the chatbot
    const iframe = document.createElement("iframe");
    iframe.className = "chatbot-iframe";

    // Set the iframe source to load the chatbot with the apiKey parameter
    const chatbotUrl = new URL(`${baseUrl}/chatbot-embed`);
    chatbotUrl.searchParams.append("apiKey", widgetConfig.apiKey);
    // Add a parameter to identify it's coming from widget for iframe communication
    chatbotUrl.searchParams.append("isWidget", "true");

    iframe.src = chatbotUrl.toString();

    // Append iframe to widget container
    widgetContainer.appendChild(iframe);

    // Add the elements to the DOM
    document.body.appendChild(toggleButton);
    document.body.appendChild(widgetContainer);
    document.body.appendChild(tooltip);

    // Add a pulse animation to the button
    toggleButton.classList.add("animate-pulse-indigo");

    // Show tooltip after a delay (only if not auto-opening)
    setTimeout(() => {
      // Check if this is a new user (first time visitor)
      const hasVisited = localStorage.getItem("chatbot_has_visited");
      const isNewUser = !hasVisited;

      // Only show tooltip for returning users or if auto-open is disabled
      if (!isNewUser) {
        tooltip.classList.add("visible");

        // Hide tooltip after 5 seconds
        setTimeout(() => {
          tooltip.classList.remove("visible");
        }, 5000);
      }
    }, 2000);

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
            toggleButton.classList.add("animate-pulse-indigo");
          }
        }, 500);
      }, 100);

      isOpen = false;
    }

    // Function to open the chat widget with animation
    function openWidget() {
      // Hide button first
      toggleButton.classList.add("hidden");
      toggleButton.classList.remove("animate-pulse-indigo");

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
    }

    // Listen for messages from the iframe
    window.addEventListener("message", (event) => {
      // Verify origin for security
      if (event.origin !== baseUrl) {
        return;
      }

      // Handle close command from iframe
      if (event.data === "closeChatbot") {
        closeWidget();
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
  }

  // Initialize the widget
  function init() {
    if (parseConfig()) {
      loadStyles();
      createWidget();
      console.log(
        "Chatbot widget initialized with API key:",
        widgetConfig.apiKey
      );
    }
  }

  // Initialize when DOM is fully loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
