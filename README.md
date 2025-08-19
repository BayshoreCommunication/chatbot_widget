# Chatbot Widget

A customizable chatbot widget that can be embedded on any website. Built with React, TypeScript, and Vite.

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Widget Embed URL (base URL where the widget is hosted)
VITE_WIDGET_EMBED_URL=https://your-domain.com

# API URLs for the widget to communicate with the backend
VITE_API_CHATBOT_SETTINGS_URL=https://your-backend-domain.com/api/chatbot/settings
VITE_API_CHATBOT_URL=https://your-backend-domain.com/api/chatbot/chat
VITE_API_CHATBOT_HISTORY_URL=https://your-backend-domain.com/api/chatbot/history
VITE_API_BASE_URL=https://your-backend-domain.com
```

### Required Environment Variables

- `VITE_WIDGET_EMBED_URL`: The base URL where your chatbot is hosted (defaults to `https://aibotwizard.vercel.app` if not set)
- `VITE_API_CHATBOT_SETTINGS_URL`: URL for fetching chatbot settings including avatar (defaults to `https://aibotwizard.vercel.app/api/chatbot/settings`)
- `VITE_API_CHATBOT_URL`: URL for chat API (defaults to `https://aibotwizard.vercel.app/api/chatbot/chat`)
- `VITE_API_CHATBOT_HISTORY_URL`: URL for chat history API (defaults to `https://aibotwizard.vercel.app/api/chatbot/history`)
- `VITE_API_BASE_URL`: Base URL for API endpoints (defaults to `https://aibotwizard.vercel.app`)

## Troubleshooting

### Avatar Not Showing

If the chatbot avatar is not displaying in live mode, check the following:

1. **Environment Variables**: Ensure all API URLs are correctly configured in your `.env` file
2. **CORS Issues**: Make sure your backend allows requests from your widget domain
3. **Avatar URL**: Verify that the avatar URL in your chatbot settings is accessible and returns a valid image
4. **Network Tab**: Check the browser's network tab for any failed requests to the settings API

### Common Issues

- **Settings not loading**: Check `VITE_API_CHATBOT_SETTINGS_URL` configuration
- **Chat not working**: Verify `VITE_API_CHATBOT_URL` is correct
- **History not loading**: Ensure `VITE_API_CHATBOT_HISTORY_URL` is properly set

## Development

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ["./tsconfig.node.json", "./tsconfig.app.json"],
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    "react-x": reactX,
    "react-dom": reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs["recommended-typescript"].rules,
    ...reactDom.configs.recommended.rules,
  },
});
```
