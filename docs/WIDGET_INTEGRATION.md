# Chatbot Widget Integration Guide

This guide explains how to integrate the AI chatbot widget into your website.

## Quick Start

To add the chatbot to your website, simply add the following script tag to your HTML:

```html
<script 
  src="https://your-domain.com/chatbot-widget.min.js" 
  data-api-key="YOUR_API_KEY">
</script>
```

Replace `YOUR_API_KEY` with your organization's API key, and `https://your-domain.com` with the URL where the widget script is hosted.

## Configuration

The widget only requires two parameters:

| Parameter | Description |
|-----------|-------------|
| `src` | The URL where the widget script is hosted |
| `data-api-key` | Your organization's API key |

## URL Parameter Alternative

Alternatively, you can provide the API key as a URL parameter:

```
https://your-website.com/?chatbot-api-key=YOUR_API_KEY
```

This is useful in situations where you can't modify the HTML directly.

## How It Works

The widget script:
1. Creates a chat button on your website
2. Opens a chat interface when clicked
3. Communicates with our AI service using your API key
4. Integrates seamlessly with your website design

## Troubleshooting

If the chatbot doesn't appear:

1. Check that you've included the correct API key
2. Verify that the script URL is correct and accessible
3. Check your browser's console for any error messages

## Security Notes

- Keep your API key secure and don't expose it in client-side code outside of this integration
- We recommend rotating your API key periodically for enhanced security

## Getting Help

If you encounter any issues or have questions about integrating the chatbot widget, please contact our support team. 