# Chatbot Widget Integration Guide

This guide explains how to integrate the AI chatbot widget into your website.

## Quick Start

To add the chatbot to your website, simply add the following script tag to your HTML:

```html
<script 
  src="http://localhost:5173/chatbot-widget.min.js" 
  data-api-key="YOUR_API_KEY">
</script>
```

Replace `YOUR_API_KEY` with your organization's API key.

## Configuration

The widget supports the following parameters:

| Parameter | Description | Required |
|-----------|-------------|----------|
| `data-api-key` | Your organization's API key | Yes |
| `data-position` | Widget position: `bottom-right` (default), `bottom-left`, `top-right`, or `top-left` | No |

Example with custom position:

```html
<script 
  src="http://localhost:5173/chatbot-widget.min.js" 
  data-api-key="YOUR_API_KEY"
  data-position="bottom-left">
</script>
```

## URL Parameter Alternative

Alternatively, you can provide the API key as a URL parameter:

```
https://your-website.com/?chatbot-api-key=YOUR_API_KEY
```

This is useful in situations where you can't modify the HTML directly.

## How It Works

The widget script:
1. Creates a chat button on your website with a pulsing animation
2. When clicked, the button disappears and chat interface opens
3. When the chat is closed, the button reappears
4. Communicates with our AI service using your API key
5. Integrates seamlessly with your website design

## Widget Appearance

The chatbot widget features:
- A modern indigo-colored chat button
- Smooth animations during opening and closing
- A responsive design that works well on mobile and desktop
- Clean, unobtrusive styling that fits most website designs

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