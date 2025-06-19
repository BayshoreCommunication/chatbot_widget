# 🤖 AI Widget Local Testing Guide

This guide will help you test your embedded AI chatbot widget locally before deploying it to client websites.

## 📋 Quick Start

### 1. Build the Widget
```bash
npm run build:widget
```

### 2. Start Test Server
```bash
npm run test:widget
# OR just serve existing files
npm run serve:test
```

### 3. Open Test Pages
- **Main Test**: http://localhost:8080/test-widget.html
- **Dev Test**: http://localhost:8080/test-local-dev.html

## 🔧 Testing Scenarios

### Scenario 1: Production-Ready Testing
Use `test-widget.html` to test the widget exactly as it would work on a client's website.

**Features:**
- ✅ Uses minified production build
- ✅ Connects to production API
- ✅ Real API key validation
- ✅ Full debugging interface
- ✅ Performance monitoring

### Scenario 2: Development Testing
Use `test-local-dev.html` for development and debugging.

**Features:**
- 🔧 Local development server checks
- 🔧 Enhanced debugging tools
- 🔧 Widget reload functionality
- 🔧 CORS testing

## 📁 Project Structure

```
ai_widget/
├── public/
│   ├── chatbot-widget.js         # Development build
│   ├── chatbot-widget.min.js     # Production build
│   ├── test-widget.html          # Main test page
│   ├── test-local-dev.html       # Development test page
│   └── widget/
│       └── widget.js             # Original source
├── scripts/
│   ├── build-widget.js           # Build script
│   └── serve-test.js             # Test server
└── src/
    └── widget/
        └── widget.ts             # Widget TypeScript source
```

## 🎯 Testing Checklist

### Widget Loading
- [ ] Widget button appears in bottom-right corner
- [ ] No JavaScript errors in console
- [ ] Widget elements found in DOM
- [ ] CSS styles applied correctly

### Widget Functionality
- [ ] Click button opens chat interface
- [ ] Iframe loads successfully
- [ ] API connection established
- [ ] Messages can be sent and received
- [ ] Widget can be closed
- [ ] Widget can be reopened

### API Integration
- [ ] Valid API key accepted
- [ ] Invalid API key rejected
- [ ] CORS headers configured
- [ ] Error handling works
- [ ] Messages persist during session

### Cross-Browser Testing
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile browsers

## 🐛 Debugging

### Common Issues

#### Widget Not Loading
1. Check browser console for errors
2. Verify script src path is correct
3. Ensure API key is valid
4. Check network tab for failed requests

#### API Connection Failed
1. Verify production server is accessible
2. Check CORS configuration
3. Validate API key format
4. Check iframe source URL

#### Styling Issues
1. Check for CSS conflicts
2. Verify z-index values
3. Test on different screen sizes
4. Check for iframe sandbox restrictions

### Debug Tools

The test pages include built-in debugging tools:

```javascript
// Check if widget loaded
testWidgetLoaded()

// Test API connection
testAPIConnection()

// Show widget configuration
showWidgetInfo()

// Clear debug log
clearDebugLog()
```

## 🚀 Deployment Testing

Before deploying to production:

1. **Test with real API keys**
2. **Test on different domains**
3. **Test with HTTPS**
4. **Test iframe embedding**
5. **Test with different positions**

### Test Different Positions
```html
<!-- Bottom Right (default) -->
<script src="chatbot-widget.min.js" data-api-key="YOUR_KEY" data-position="bottom-right"></script>

<!-- Bottom Left -->
<script src="chatbot-widget.min.js" data-api-key="YOUR_KEY" data-position="bottom-left"></script>

<!-- Top Right -->
<script src="chatbot-widget.min.js" data-api-key="YOUR_KEY" data-position="top-right"></script>

<!-- Top Left -->
<script src="chatbot-widget.min.js" data-api-key="YOUR_KEY" data-position="top-left"></script>
```

## 📊 Performance Testing

### Metrics to Monitor
- Script load time
- Widget initialization time
- First paint time
- API response time
- Memory usage

### Tools
- Browser DevTools Network tab
- Performance tab
- Console timing logs
- Lighthouse audit

## 🔒 Security Testing

### Items to Verify
- [ ] API key validation
- [ ] CORS restrictions
- [ ] XSS prevention
- [ ] Iframe sandbox security
- [ ] Message origin validation

## 📝 Customization Testing

### Widget Configuration
Test different configurations to ensure flexibility:

```html
<!-- Minimal setup -->
<script src="chatbot-widget.min.js" data-api-key="YOUR_KEY"></script>

<!-- With position -->
<script src="chatbot-widget.min.js" data-api-key="YOUR_KEY" data-position="top-left"></script>

<!-- URL parameter fallback -->
<script src="chatbot-widget.min.js?chatbot-api-key=YOUR_KEY"></script>
```

## 🆘 Troubleshooting

### Server Issues
```bash
# Port 8080 in use?
lsof -ti:8080

# Kill process on port 8080
kill -9 $(lsof -ti:8080)

# Use different port
PORT=3001 node scripts/serve-test.js
```

### Build Issues
```bash
# Clean build
rm -rf public/chatbot-widget*.js
npm run build:widget

# Check file sizes
ls -la public/chatbot-widget*.js
```

### Widget Issues
1. Check API key format
2. Verify production URL accessibility
3. Test with simple HTML page
4. Check browser compatibility

## 📞 Support

If you encounter issues:
1. Check the debug log in test pages
2. Review browser console errors
3. Verify network connectivity
4. Test with different API keys

## 🔄 Continuous Testing

For ongoing development:
1. Set up automated testing
2. Monitor production metrics
3. Test with real user scenarios
4. Keep test cases updated

---

Happy testing! 🎉 