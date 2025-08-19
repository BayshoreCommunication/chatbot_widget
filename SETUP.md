# Chatbot Widget Setup Guide

## Quick Fix for Avatar Not Showing

The most common reason for the avatar not showing in live mode is missing environment variables. Follow these steps:

### 1. Create Environment File

Create a `.env` file in the `chatbot_widget/` directory with the following content:

```env
# Replace with your actual backend domain
VITE_API_CHATBOT_SETTINGS_URL=https://your-backend-domain.com/api/chatbot/settings
VITE_API_CHATBOT_URL=https://your-backend-domain.com/api/chatbot/chat
VITE_API_CHATBOT_HISTORY_URL=https://your-backend-domain.com/api/chatbot/history
VITE_API_BASE_URL=https://your-backend-domain.com
VITE_WIDGET_EMBED_URL=https://your-widget-domain.com
```

### 2. Update Your Client Website

In your client website (`carter-injury-law/app/layout.js`), update the script tag to use the correct domain:

```javascript
<Script 
  src="https://your-widget-domain.com/chatbot-widget.min.js" 
  data-api-key="your-api-key" 
  async
/>
```

### 3. Verify Backend Settings

Make sure your backend has:
- CORS configured to allow requests from your widget domain
- The chatbot settings API endpoint working correctly
- A valid avatar URL stored in the database

### 4. Test the Setup

1. Build the widget: `npm run build`
2. Deploy to your domain
3. Test on your client website
4. Check browser console for any errors

## Common Issues and Solutions

### Issue: Avatar not loading
**Solution**: Check that `VITE_API_CHATBOT_SETTINGS_URL` points to your backend and the avatar URL in settings is accessible.

### Issue: Chat not working
**Solution**: Verify `VITE_API_CHATBOT_URL` is correct and your backend is running.

### Issue: CORS errors
**Solution**: Configure your backend to allow requests from your widget domain.

## Support

If you're still having issues, check the browser's network tab for failed requests and console for error messages.
