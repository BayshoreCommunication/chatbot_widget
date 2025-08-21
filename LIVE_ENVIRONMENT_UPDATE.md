# 🌐 Live Environment Configuration Update

## ✅ **Successfully Updated to Live Environment**

### **Environment Variables Updated:**

- **Main API Server**: `https://api.bayshorecommunication.org`
- **Widget Embed URL**: `https://aibotwizard.bayshorecommunication.org`

### **Files Updated:**

#### 1. **vite.config.ts** ✅

- Updated proxy target to `https://api.bayshorecommunication.org`
- Added `VITE_API_BASE_URL` environment variable
- Updated all API endpoints to use live URLs
- Changed `secure: true` for HTTPS connections

#### 2. **src/components/chatbot/api.ts** ✅

- Updated fallback URLs for chat API
- Updated fallback URLs for history API
- All endpoints now point to live environment

#### 3. **src/pages/chatbot-embed.tsx** ✅

- Updated settings API fallback URL
- Now uses live environment for settings retrieval

#### 4. **src/components/chatbot/ChatBot.tsx** ✅

- Updated socket URL fallback
- Now connects to live WebSocket server

#### 5. **public/widget/widget.js** ✅

- Updated API URL fallback
- Updated instant-reply endpoint
- Widget now uses live environment

#### 6. **public/chatbot-widget.js** ✅

- Updated API URL fallback
- Updated instant-reply endpoint
- Built widget now uses live environment

#### 7. **test-local.html** ✅

- Updated API URL references
- Updated settings endpoint
- Test page now points to live environment

### **Environment Variables Now Configured:**

```javascript
VITE_API_BASE_URL = "https://api.bayshorecommunication.org";
VITE_API_CHATBOT_SETTINGS_URL =
  "https://api.bayshorecommunication.org/api/chatbot/settings";
VITE_API_CHATBOT_URL = "https://api.bayshorecommunication.org/api/chatbot/ask";
VITE_API_CHATBOT_HISTORY_URL =
  "https://api.bayshorecommunication.org/api/chatbot/history";
VITE_SOCKET_URL = "https://api.bayshorecommunication.org";
VITE_WIDGET_EMBED_URL = "https://aibotwizard.bayshorecommunication.org";
```

### **Widget Build Status:**

- ✅ **Widget Rebuilt**: `npm run build:widget` completed successfully
- ✅ **Output Files**:
  - `public/chatbot-widget.js` (17.24 KB)
  - `public/chatbot-widget.min.js` (12.70 KB)

### **Current Configuration:**

- **Backend API**: `https://api.bayshorecommunication.org`
- **Widget Server**: `https://aibotwizard.bayshorecommunication.org`
- **All API Endpoints**: Pointing to live environment
- **WebSocket Connections**: Using live server
- **Widget Embed**: Using live widget URL

### **Next Steps:**

1. **Deploy the updated widget** to your live environment
2. **Test the widget** on your live website
3. **Verify API connectivity** with live backend
4. **Check WebSocket connections** for real-time features

### **Test URLs:**

- **Widget Embed**: `https://aibotwizard.bayshorecommunication.org/chatbot-embed?apiKey=YOUR_API_KEY&isWidget=true`
- **Settings API**: `https://api.bayshorecommunication.org/api/chatbot/settings`
- **Chat API**: `https://api.bayshorecommunication.org/api/chatbot/ask`

### **Embed Code for Live Environment:**

```html
<script
  src="https://aibotwizard.bayshorecommunication.org/chatbot-widget.min.js"
  data-api-key="YOUR_API_KEY"
></script>
```

---

**Status**: 🟢 **LIVE ENVIRONMENT CONFIGURED** - All files updated to use your live API and widget URLs!
