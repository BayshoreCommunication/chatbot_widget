# Environment Variables Reference

This document lists all environment variables used by the chatbot widget.

## Required Environment Variables

### Core URLs

```bash
# Widget embed URL (base URL where the widget is hosted)
VITE_WIDGET_EMBED_URL=https://aibotwizard.vercel.app

# API URLs for the widget to communicate with the backend
VITE_API_CHATBOT_SETTINGS_URL=https://aibotwizard.vercel.app/api/chatbot/settings
VITE_API_CHATBOT_URL=https://aibotwizard.vercel.app/api/chatbot/chat
VITE_API_CHATBOT_HISTORY_URL=https://aibotwizard.vercel.app/api/chatbot/history
VITE_API_BASE_URL=https://aibotwizard.vercel.app

# Socket.IO URL for real-time messaging
VITE_SOCKET_URL=https://aibotwizard.vercel.app

# Widget specific URLs
VITE_WIDGET_CHATBOT_URL=https://aibotwizard.vercel.app/chatbot-embed
VITE_WIDGET_INSTANT_REPLY_URL=https://aibotwizard.vercel.app/api/instant-reply
```

## Optional Environment Variables

### Development & Testing

```bash
# Default API key for development/testing (optional)
VITE_DEFAULT_API_KEY=your_test_api_key_here

# Build information
VITE_BUILD_VERSION=1.0.0
VITE_BUILD_DATE=2024-01-01T00:00:00.000Z
```

### Feature Flags

```bash
# Enable debug mode (default: false)
VITE_ENABLE_DEBUG_MODE=true

# Enable analytics (default: true)
VITE_ENABLE_ANALYTICS=true
```

### Performance Settings

```bash
# Widget load timeout in milliseconds (default: 10000)
VITE_WIDGET_LOAD_TIMEOUT=10000

# API request timeout in milliseconds (default: 30000)
VITE_API_REQUEST_TIMEOUT=30000

# Socket.IO reconnect delay in milliseconds (default: 1000)
VITE_SOCKET_RECONNECT_DELAY=1000
```

### Security Settings

```bash
# Enable origin verification (default: true)
VITE_ENABLE_ORIGIN_VERIFICATION=true

# Allowed origins for CORS (comma-separated)
VITE_ALLOWED_ORIGINS=https://aibotwizard.vercel.app,https://yourdomain.com
```

## Environment-Specific Configurations

### Development Environment

```bash
# Local development URLs
VITE_WIDGET_EMBED_URL=http://localhost:5174
VITE_API_CHATBOT_SETTINGS_URL=http://localhost:8000/api/chatbot/settings
VITE_API_CHATBOT_URL=http://localhost:8000/api/chatbot/chat
VITE_API_CHATBOT_HISTORY_URL=http://localhost:8000/api/chatbot/history
VITE_API_BASE_URL=http://localhost:8000
VITE_SOCKET_URL=http://localhost:8000
VITE_WIDGET_CHATBOT_URL=http://localhost:5174/chatbot-embed
VITE_WIDGET_INSTANT_REPLY_URL=http://localhost:8000/api/instant-reply

# Enable debug mode for development
VITE_ENABLE_DEBUG_MODE=true
```

### Production Environment

```bash
# Production URLs
VITE_WIDGET_EMBED_URL=https://aibotwizard.vercel.app
VITE_API_CHATBOT_SETTINGS_URL=https://aibotwizard.vercel.app/api/chatbot/settings
VITE_API_CHATBOT_URL=https://aibotwizard.vercel.app/api/chatbot/chat
VITE_API_CHATBOT_HISTORY_URL=https://aibotwizard.vercel.app/api/chatbot/history
VITE_API_BASE_URL=https://aibotwizard.vercel.app
VITE_SOCKET_URL=https://aibotwizard.vercel.app
VITE_WIDGET_CHATBOT_URL=https://aibotwizard.vercel.app/chatbot-embed
VITE_WIDGET_INSTANT_REPLY_URL=https://aibotwizard.vercel.app/api/instant-reply

# Disable debug mode for production
VITE_ENABLE_DEBUG_MODE=false
```

## Setting Up Environment Variables

### Vercel Dashboard

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable with the appropriate value
4. Select the environment (Production, Preview, Development)
5. Click "Save"

### Local Development (.env.local)

Create a `.env.local` file in the root directory:

```bash
# Copy the development configuration above
VITE_WIDGET_EMBED_URL=http://localhost:5174
VITE_API_CHATBOT_SETTINGS_URL=http://localhost:8000/api/chatbot/settings
# ... add other variables as needed
```

### Environment File Priority

1. `.env.local` (highest priority, local development)
2. `.env.production` (production builds)
3. `.env.development` (development builds)
4. Default values in code (lowest priority)

## Validation

The environment configuration includes validation and fallbacks:

- All URLs have production fallbacks
- Timeout values are parsed as integers with defaults
- Boolean flags are properly converted
- Arrays are split from comma-separated strings

## Security Notes

- Never commit API keys to version control
- Use environment variables for sensitive data
- Enable origin verification in production
- Set appropriate CORS origins
- Use HTTPS in production

## Troubleshooting

### Common Issues

1. **Widget not loading**: Check if all required URLs are set
2. **API errors**: Verify API endpoints are accessible
3. **CORS errors**: Check allowed origins configuration
4. **Socket.IO issues**: Ensure Socket.IO URL is correct

### Debug Mode

Enable debug mode to see detailed logs:

```bash
VITE_ENABLE_DEBUG_MODE=true
```

This will show:

- Environment variable values
- API request/response details
- Socket.IO connection status
- Widget initialization steps
