# Chatbot Widget Deployment Guide

## Issues Fixed

The main issues preventing your chatbot widget from working on Vercel were:

1. **Hardcoded localhost URLs** - Widget was using localhost instead of production URLs
2. **Environment configuration mismatch** - Environment variables weren't properly configured
3. **Build process issues** - Widget wasn't being built during deployment
4. **Missing production configuration** - No proper production environment setup

## Deployment Steps

### 1. Environment Variables Setup

Add these environment variables in your Vercel project settings:

```bash
VITE_WIDGET_EMBED_URL=https://aibotwizard.vercel.app
VITE_API_CHATBOT_SETTINGS_URL=https://aibotwizard.vercel.app/api/chatbot/settings
VITE_API_CHATBOT_URL=https://aibotwizard.vercel.app/api/chatbot/chat
VITE_API_CHATBOT_HISTORY_URL=https://aibotwizard.vercel.app/api/chatbot/history
VITE_API_BASE_URL=https://aibotwizard.vercel.app
VITE_SOCKET_URL=https://aibotwizard.vercel.app
VITE_WIDGET_CHATBOT_URL=https://aibotwizard.vercel.app/chatbot-embed
VITE_WIDGET_INSTANT_REPLY_URL=https://aibotwizard.vercel.app/api/instant-reply
```

### 2. Build Configuration

The build process now automatically:
- Builds the main React app
- Builds the widget script
- Generates both minified and unminified versions

### 3. Deployment Commands

```bash
# Install dependencies
npm install

# Build for production (includes widget build)
npm run build

# Deploy to Vercel
npm run deploy
```

### 4. Widget Integration

After deployment, embed the widget using:

```html
<script 
  src="https://aibotwizard.vercel.app/chatbot-widget.min.js" 
  data-api-key="YOUR_API_KEY">
</script>
```

## Key Changes Made

### 1. Environment Detection
The widget now automatically detects if it's running in development or production:

```javascript
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const baseUrl = isDevelopment ? 'http://localhost:5174' : 'https://aibotwizard.vercel.app';
const apiBaseUrl = isDevelopment ? 'http://localhost:8000' : 'https://aibotwizard.vercel.app';
```

### 2. Updated URLs
- All hardcoded localhost URLs replaced with environment-aware URLs
- API endpoints now use production URLs in production
- Socket.IO connection uses production URL

### 3. Build Process
- Widget is now built from TypeScript source
- Both development and production builds are generated
- Proper minification for production

### 4. Vercel Configuration
- Added proper headers for widget files
- Configured caching for better performance
- Added proper routing configuration

## Testing

### Local Testing
```bash
npm run dev
npm run test:widget
```

### Production Testing
1. Deploy to Vercel
2. Test widget on a test website
3. Verify API connections work
4. Check Socket.IO connections

## Troubleshooting

### Common Issues

1. **Widget not loading**: Check if the widget script is accessible at the correct URL
2. **API errors**: Verify environment variables are set correctly in Vercel
3. **Socket.IO connection issues**: Ensure the Socket.IO URL is correct
4. **CORS errors**: Check if the API endpoints allow requests from the widget domain

### Debug Steps

1. Check browser console for errors
2. Verify network requests in browser dev tools
3. Check Vercel deployment logs
4. Test API endpoints directly

## File Structure

```
chatbot_widget/
├── src/
│   ├── widget/
│   │   └── widget.ts          # Widget source (TypeScript)
│   └── config/
│       └── environment.ts     # Environment configuration
├── public/
│   ├── chatbot-widget.js      # Built widget (unminified)
│   └── chatbot-widget.min.js  # Built widget (minified)
├── scripts/
│   └── build-widget.js        # Widget build script
└── vercel.json               # Vercel configuration
```

## Security Considerations

1. **Origin verification**: Widget verifies message origins
2. **API key validation**: All API requests include API key
3. **HTTPS enforcement**: Production uses HTTPS only
4. **CORS configuration**: Proper CORS headers for cross-origin requests

## Performance Optimization

1. **Minified widget**: Smaller file size for faster loading
2. **Caching headers**: Long-term caching for widget files
3. **Lazy loading**: Widget loads only when needed
4. **Compression**: Vercel automatically compresses static files
