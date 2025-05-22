// Chatbot Widget Script
// This script allows organizations to embed the chatbot on their website

(function () {
    // Widget configuration
    const widgetConfig = {
        apiKey: '',
        position: 'bottom-right', // default position
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

    // Load CSS styles for the widget
    function loadStyles() {
        const style = document.createElement('style');
        style.textContent = `
      .chatbot-widget-container {
        position: fixed;
        z-index: 9999;
        width: 375px;
        height: 600px;
        box-shadow: 0 5px 40px rgba(0, 0, 0, 0.16);
        border-radius: 16px;
        overflow: hidden;
        transition: transform 0.3s ease;
      }
      .chatbot-widget-container.bottom-right {
        bottom: 100px;
        right: 20px;
      }
      .chatbot-widget-container.bottom-left {
        bottom: 100px;
        left: 20px;
      }
      .chatbot-widget-container.top-right {
        top: 100px;
        right: 20px;
      }
      .chatbot-widget-container.top-left {
        top: 100px;
        left: 20px;
      }
      .chatbot-widget-container.hidden {
        transform: translateY(150%);
      }
      .chatbot-toggle-button {
        position: fixed;
        z-index: 10000;
        border: none;
        border-radius: 50%;
        width: 60px;
        height: 60px;
        background-color: #4A6CF7;
        color: white;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        transition: all 0.3s ease;
      }
      .chatbot-toggle-button:hover {
        transform: scale(1.05);
        box-shadow: 0 2px 15px rgba(0, 0, 0, 0.3);
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
      .chatbot-iframe {
        width: 100%;
        height: 100%;
        border: none;
      }
    `;
        document.head.appendChild(style);
    }

    // Create and inject the widget components
    function createWidget() {
        // Create the toggle button (chat icon)
        const toggleButton = document.createElement('button');
        toggleButton.className = `chatbot-toggle-button ${widgetConfig.position}`;
        toggleButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    `;

        // Create the widget container (initially hidden)
        const widgetContainer = document.createElement('div');
        widgetContainer.className = `chatbot-widget-container ${widgetConfig.position} hidden`;

        // Create the iframe that will load the chatbot
        const iframe = document.createElement('iframe');
        iframe.className = 'chatbot-iframe';

        // Set the iframe source to load the chatbot with the apiKey parameter
        const chatbotUrl = new URL('https://aibotwizard.vercel.app/chatbot-embed');
        chatbotUrl.searchParams.append('apiKey', widgetConfig.apiKey);

        iframe.src = chatbotUrl.toString();

        // Append iframe to widget container
        widgetContainer.appendChild(iframe);

        // Add the elements to the DOM
        document.body.appendChild(toggleButton);
        document.body.appendChild(widgetContainer);

        // Toggle widget visibility when button is clicked
        let isOpen = false;
        toggleButton.addEventListener('click', () => {
            isOpen = !isOpen;
            if (isOpen) {
                widgetContainer.classList.remove('hidden');
                toggleButton.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        `;
            } else {
                widgetContainer.classList.add('hidden');
                toggleButton.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        `;
            }
        });
    }

    // Initialize the widget
    function init() {
        if (parseConfig()) {
            loadStyles();
            createWidget();
            console.log('Chatbot widget initialized with API key:', widgetConfig.apiKey);
        }
    }

    // Initialize when DOM is fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})(); 