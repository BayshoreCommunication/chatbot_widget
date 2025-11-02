# Mixed Content Error Fix - Deployment Instructions

## Problem Summary

The chatbot widget was making HTTP requests from an HTTPS page, causing "Mixed Content" errors:

```
Mixed Content: The page at 'https://www.carterinjurylaw.com/' was loaded over HTTPS,
but requested an insecure resource 'http://api.bayshorecommunication.org/api/instant-reply/'.
This request has been blocked; the content must be served over HTTPS.
```

## Solution Applied

✅ **Code Changes Made:**

1. Enhanced `ensureHttps()` function to force all URLs to use HTTPS
2. Updated `getNormalizedApiBase()` to apply HTTPS enforcement with logging
3. Updated `fetchInstantReplies()` to explicitly use `ensureHttps()`
4. All API calls now enforce HTTPS protocol

✅ **Widget Rebuilt:**

- Rebuilt widget with HTTPS URLs baked in
- Generated files:
  - `public/chatbot-widget.js` (23.49 KB)
  - `public/chatbot-widget.min.js` (15.87 KB)

## Deployment Steps

### Step 1: Upload Widget Files

Upload the newly built widget files to your hosting server:

**Files to upload:**

```
chatbot_widget/public/chatbot-widget.min.js
chatbot_widget/public/chatbot-widget.js
```

**Upload to:**

```
https://aibotwidget.bayshorecommunication.org/
```

### Step 2: Verify Environment Variables

Ensure your `.env` file has HTTPS URLs (already configured):

```bash
VITE_API_BASE_URL=https://api.bayshorecommunication.org
VITE_API_CHATBOT_URL=https://api.bayshorecommunication.org/api/chatbot/ask
VITE_API_CHATBOT_HISTORY_URL=https://api.bayshorecommunication.org/api/chatbot/history
VITE_API_CHATBOT_SETTINGS_URL=https://api.bayshorecommunication.org/api/chatbot/settings
VITE_API_INSTANT_REPLY_URL=https://api.bayshorecommunication.org/api/instant-reply
VITE_SOCKET_URL=https://api.bayshorecommunication.org
```

### Step 3: Clear Browser Cache

After deployment, users may need to clear their browser cache or perform a hard refresh:

- **Chrome/Edge:** Ctrl + Shift + R (Windows) or Cmd + Shift + R (Mac)
- **Firefox:** Ctrl + F5 (Windows) or Cmd + Shift + R (Mac)

### Step 4: Verify the Fix

After deployment, test at https://www.carterinjurylaw.com/ and verify:

1. ✅ No "Mixed Content" errors in browser console
2. ✅ Welcome message loads successfully
3. ✅ Instant replies work correctly
4. ✅ All API calls use HTTPS URLs

## Commands for Future Builds

### Development Build

```bash
npm run dev
```

### Production Widget Build

```bash
npm run build:widget
```

### Test Widget Locally

```bash
npm run test:widget
```

### Deploy to Vercel (if using Vercel)

```bash
npm run deploy
```

## Technical Details

### What Changed in Code

File: `chatbot_widget/src/components/chatbot/ChatBot.tsx`

1. **Enhanced getNormalizedApiBase():**

```typescript
const getNormalizedApiBase = useCallback(() => {
  const raw = (
    import.meta.env.VITE_API_BASE_URL || "https://api.bayshorecommunication.org"
  ).trim();
  const cleaned = raw.replace(/%0A|\n|\r/g, "").replace(/\s+/g, "");
  const noTrailingSlash = cleaned.replace(/\/+$/, "");
  const noTrailingApi = noTrailingSlash.replace(/\/api$/, "");
  // Force HTTPS - critical for production to avoid mixed content errors
  const httpsUrl = ensureHttps(noTrailingApi);
  console.log("🔐 API Base URL:", httpsUrl);
  return httpsUrl;
}, [ensureHttps]);
```

2. **Updated fetchInstantReplies():**

```typescript
const fetchInstantReplies = async () => {
  try {
    const apiUrl = ensureHttps(getNormalizedApiBase());
    const response = await fetch(`${apiUrl}/api/instant-reply`, {
      headers: {
        "X-API-Key": apiKey || "org_sk_3ca4feb8c1afe80f73e1a40256d48e7c",
      },
    });
    // ... rest of function
  }
};
```

### Why This Happened

- The widget was previously built with HTTP URLs in environment variables
- When deployed, the minified JavaScript had HTTP URLs hardcoded
- Browsers block HTTP requests from HTTPS pages for security (Mixed Content Policy)

### Prevention

- Always use HTTPS URLs in `.env` files
- Rebuild widget after any URL changes
- Test on actual HTTPS site before final deployment

## Need Help?

If issues persist after deployment:

1. Check browser console for any remaining HTTP requests
2. Verify all environment variables use HTTPS
3. Ensure CDN/hosting server serves files with proper CORS headers
4. Check network tab in DevTools to see actual URLs being requested
