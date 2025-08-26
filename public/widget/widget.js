// Chatbot Widget Script
// This script allows organizations to embed the chatbot on their website

(function () {
  // Widget configuration
  const widgetConfig = {
    apiKey: '',
    position: 'bottom-right', // default position
    settings: null // will store chatbot settings
  };

  // Color mapping for the theme
  const colorMap = {
    black: {
      primary: '#000000',
      hover: '#1a1a1a',
      shadow: 'rgba(0, 0, 0, 0.4)'
    },
    red: {
      primary: '#ef4444',
      hover: '#dc2626',
      shadow: 'rgba(239, 68, 68, 0.4)'
    },
    orange: {
      primary: '#f97316',
      hover: '#ea580c',
      shadow: 'rgba(249, 115, 22, 0.4)'
    },
    blue: {
      primary: '#3b82f6',
      hover: '#2563eb',
      shadow: 'rgba(59, 130, 246, 0.4)'
    },
    pink: {
      primary: '#ec4899',
      hover: '#db2777',
      shadow: 'rgba(236, 72, 153, 0.4)'
    }
  };

  // Parse script attributes or URL parameters
  function parseConfig() {
    // Get the script tag that loaded this widget
    const scripts = document.getElementsByTagName('script');
    const currentScript = scripts[scripts.length - 1];

    // Extract API key from data attribute
    if (currentScript.getAttribute('data-api-key')) {
      widgetConfig.apiKey = currentScript.getAttribute('data-api-key') || '';
    }

    // Extract fallback API key
    if (currentScript.getAttribute('data-fallback-api-key')) {
      widgetConfig.fallbackApiKey = currentScript.getAttribute('data-fallback-api-key') || '';
    }

    // Extract widget name
    if (currentScript.getAttribute('data-widget-name')) {
      widgetConfig.widgetName = currentScript.getAttribute('data-widget-name') || 'AI Assistant';
    }

    // Extract widget color
    if (currentScript.getAttribute('data-widget-color')) {
      widgetConfig.widgetColor = currentScript.getAttribute('data-widget-color') || 'blue';
    }

    // Extract auto-open setting
    if (currentScript.getAttribute('data-auto-open')) {
      widgetConfig.autoOpen = currentScript.getAttribute('data-auto-open') === 'true';
    }

    // Extract lead capture setting
    if (currentScript.getAttribute('data-lead-capture')) {
      widgetConfig.leadCapture = currentScript.getAttribute('data-lead-capture') === 'true';
    }

    // Extract position if specified
    if (currentScript.getAttribute('data-position')) {
      widgetConfig.position = currentScript.getAttribute('data-position') || 'bottom-right';
    }

    // If no API key found in script tag, try URL query parameters
    if (!widgetConfig.apiKey) {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('chatbot-api-key')) {
        widgetConfig.apiKey = urlParams.get('chatbot-api-key') || '';
      }
    }

    // Validate that we have an API key
    if (!widgetConfig.apiKey) {
      console.error('Chatbot widget error: No API key provided. Add data-api-key attribute to script tag.');
      return false;
    }

    return true;
  }

  // Fetch chatbot settings with fallback
  async function fetchSettings() {
    try {
      const apiUrl = window.CHATBOT_API_URL || 'https://api.bayshorecommunication.org';
      const response = await fetch(`${apiUrl}/api/chatbot/settings`, {
        method: 'GET',
        headers: {
          'X-API-Key': widgetConfig.apiKey,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.warn('API returned error status:', response.status);
        // Try fallback API key if available
        const fallbackApiKey = document.currentScript?.getAttribute('data-fallback-api-key');
        if (fallbackApiKey && fallbackApiKey !== widgetConfig.apiKey) {
          console.log('Trying fallback API key...');
          widgetConfig.apiKey = fallbackApiKey;
          return await fetchSettingsWithKey(fallbackApiKey);
        }
        return false;
      }
      
      const data = await response.json();
      if (data.status === 'success') {
        widgetConfig.settings = data.settings;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to fetch chatbot settings:', error);
      
      // Try fallback API key if available
      const fallbackApiKey = document.currentScript?.getAttribute('data-fallback-api-key');
      if (fallbackApiKey && fallbackApiKey !== widgetConfig.apiKey) {
        console.log('Trying fallback API key due to error...');
        widgetConfig.apiKey = fallbackApiKey;
        return await fetchSettingsWithKey(fallbackApiKey);
      }
      
      return false;
    }
  }

  // Helper function to fetch settings with a specific API key
  async function fetchSettingsWithKey(apiKey) {
    try {
      const apiUrl = window.CHATBOT_API_URL || 'https://api.bayshorecommunication.org';
      const response = await fetch(`${apiUrl}/api/chatbot/settings`, {
        method: 'GET',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.warn('Fallback API also returned error status:', response.status);
        return false;
      }
      
      const data = await response.json();
      if (data.status === 'success') {
        widgetConfig.settings = data.settings;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to fetch settings with fallback API key:', error);
      return false;
    }
  }

  // Create default settings when API fails
  function createDefaultSettings() {
    console.log('Creating default settings for widget');
    widgetConfig.settings = {
      name: widgetConfig.widgetName || 'AI Assistant',
      selectedColor: widgetConfig.widgetColor || 'blue',
      leadCapture: widgetConfig.leadCapture !== undefined ? widgetConfig.leadCapture : true,
      botBehavior: '2',
      avatarUrl: null,
      is_bot_connected: false,
      auto_open: widgetConfig.autoOpen || false,
      ai_behavior: 'You are a helpful and friendly AI assistant. You should be professional, concise, and focus on providing accurate information while maintaining a warm and engaging tone.'
    };
    return true;
  }

  // Load CSS styles for the widget
  function loadStyles() {
    const style = document.createElement('style');
    const colors = widgetConfig.settings?.selectedColor
      ? colorMap[widgetConfig.settings.selectedColor]
      : colorMap.blue; // fallback to blue if no color is selected

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
    const toggleButton = document.createElement('button');
    toggleButton.className = `chatbot-toggle-button ${widgetConfig.position}`;

    // Use avatar if provided, otherwise use default chat icon
    if (widgetConfig.settings?.avatarUrl) {
      toggleButton.innerHTML = `
                <img src="${widgetConfig.settings.avatarUrl}" alt="${widgetConfig.settings?.name || 'Chat'}" class="chatbot-avatar">
            `;
    } else {
      toggleButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="chatbot-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
            `;
    }

    // Create the widget container (initially hidden)
    const widgetContainer = document.createElement('div');
    widgetContainer.className = `chatbot-widget-container ${widgetConfig.position} hidden`;

    // Create instant reply container
    const instantReplyContainer = document.createElement('div');
    instantReplyContainer.className = `instant-reply-container ${widgetConfig.position}`;

    // Flag to prevent multiple loops
    let instantReplyLoopRunning = false;

    // Create the iframe that will load the chatbot
    const iframe = document.createElement('iframe');
    iframe.className = 'chatbot-iframe';

    // Set the iframe source to load the chatbot with the apiKey parameter
    const widgetUrl = window.CHATBOT_WIDGET_URL || 'http://localhost:5174';
    const chatbotUrl = new URL(`${widgetUrl}/chatbot-embed`);
    chatbotUrl.searchParams.append('apiKey', widgetConfig.apiKey);
    chatbotUrl.searchParams.append('isWidget', 'true');

    // Add settings to URL if lead capture is enabled
    if (widgetConfig.settings?.leadCapture) {
      chatbotUrl.searchParams.append('leadCapture', 'true');
    }

    iframe.src = chatbotUrl.toString();

    // Append iframe to widget container
    widgetContainer.appendChild(iframe);

    // Add the elements to the DOM
    document.body.appendChild(toggleButton);
    document.body.appendChild(widgetContainer);
    document.body.appendChild(instantReplyContainer);

    // Add a pulse animation to the button
    toggleButton.classList.add('animate-pulse-theme');

    // Function to close the chat widget with animation
    function closeWidget() {
      // First start the animation
      widgetContainer.classList.remove('visible');
      widgetContainer.classList.add('hidden');

      // Show the button with animation
      toggleButton.style.display = 'flex';
      setTimeout(() => {
        toggleButton.classList.remove('hidden');

        // Add pulse effect after the button appears
        setTimeout(() => {
          if (!isOpen) {
            toggleButton.classList.add('animate-pulse-theme');
          }
        }, 500);
      }, 100);

      isOpen = false;
    }

    // Function to open the chat widget with animation
    function openWidget() {
      // Hide button first
      toggleButton.classList.add('hidden');
      toggleButton.classList.remove('animate-pulse-theme');

      // Show widget with animation
      widgetContainer.classList.remove('hidden');

      // Trigger reflow for animation
      void widgetContainer.offsetWidth;

      // Add visible class to start animation
      widgetContainer.classList.add('visible');

      // Hide button element after animation
      setTimeout(() => {
        if (isOpen) {
          toggleButton.style.display = 'none';
        }
      }, 300);

      isOpen = true;
    }

    // Function to show instant reply popup
    function showInstantReply(message, displayDuration = 4000) {
      const startTime = new Date().toLocaleTimeString();

      // Clear any existing popups first (only show one at a time)
      instantReplyContainer.innerHTML = '';

      const popup = document.createElement('div');
      popup.className = 'instant-reply-popup';
      popup.innerHTML = message;

      // Add click handler to open chat
      popup.addEventListener('click', () => {
        openWidget();
        // Remove all popups when chat is opened
        instantReplyContainer.innerHTML = '';
      });

      // Add to container
      instantReplyContainer.appendChild(popup);

      // Auto remove after specified duration (4 seconds by default)
      setTimeout(() => {
        const endTime = new Date().toLocaleTimeString();
        popup.classList.add('fade-out');
        setTimeout(() => popup.remove(), 300);
      }, displayDuration);
    }

    // Function to fetch and display instant replies with continuous looping
    async function fetchInstantReplies() {
      // Prevent multiple loops from running
      if (instantReplyLoopRunning) {
        return;
      }

      try {
        const response = await fetch('https://api.bayshorecommunication.org/api/instant-reply/', {
          headers: {
            'X-API-Key': widgetConfig.apiKey
          }
        });
        const data = await response.json();

        if (data && data.status === 'success' && data.data && data.data.isActive) {
          const messages = data.data.messages || [];

          if (messages.length > 0) {
            // Sort messages by order
            const sortedMessages = messages.sort((a, b) => a.order - b.order);

            // Set flag to prevent multiple loops
            instantReplyLoopRunning = true;

            // Function to show messages in a loop
            function showMessagesLoop() {
              const loopStartTime = new Date().toLocaleTimeString();

              let currentTime = 0;

              sortedMessages.forEach((messageObj, index) => {
                const scheduledTime = new Date(Date.now() + currentTime).toLocaleTimeString();

                setTimeout(() => {
                  if (!isOpen) { // Only show if chat is not open
                    showInstantReply(messageObj.message, 4000); // Show for 4 seconds
                  } else {
                    console.log(`✅ Message ${index + 1} will be shown inside chat interface`);
                  }
                }, currentTime);

                // Next message should start after: current message display time (4s) + interval (2s)
                currentTime += 6000; // 4000ms display + 2000ms interval
              });

              // Schedule next loop: after all messages are done + 2 second interval
              // Total time = last message start + 4s display + 2s interval
              const totalCycleTime = currentTime + 2000;
              const nextLoopTime = new Date(Date.now() + totalCycleTime).toLocaleTimeString();

              setTimeout(showMessagesLoop, totalCycleTime);
            }

            // Start the message loop
            showMessagesLoop();
          }
        } else {
          console.log('❌ Instant replies not active or no messages available');
        }
      } catch (error) {
        console.error('💥 Error fetching instant replies:', error);
      }
    }

    // Listen for messages from the iframe
    window.addEventListener('message', (event) => {
      // Verify origin for security
      const widgetUrl = window.CHATBOT_WIDGET_URL || 'http://localhost:5174';
    if (event.origin !== widgetUrl) {
        return;
      }

      // Handle close command from iframe
      if (event.data === 'closeChatbot') {
        closeWidget();
      }
    });

    // Toggle widget visibility when button is clicked
    let isOpen = false;
    toggleButton.addEventListener('click', () => {
      if (isOpen) {
        closeWidget();
      } else {
        openWidget();
      }
    });

    // Start fetching instant replies after widget initialization
    setTimeout(() => {
      fetchInstantReplies();
    }, 2000); // Wait 2 seconds after widget initialization
  }

  // Initialize the widget
  async function init() {
    if (parseConfig()) {
      // Make sure we have the API key before fetching settings
      if (widgetConfig.apiKey) {
        const settingsLoaded = await fetchSettings();
        if (!settingsLoaded) {
          console.log('Failed to load settings from API, using default settings');
          createDefaultSettings();
        }
      } else {
        console.error('API key is required to fetch settings');
        createDefaultSettings();
      }
      loadStyles();
      createWidget();
      console.log('Chatbot widget initialized with API key:', widgetConfig.apiKey);
      
      // Mark widget as loaded for fallback detection
      window.chatbotWidgetLoaded = true;
    }
  }

  // Initialize when DOM is fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(); 