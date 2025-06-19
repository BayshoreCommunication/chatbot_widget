// Simple HTTP server for testing the chatbot widget locally
// Run with: node scripts/serve-test.js

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory with ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve from the public directory
const publicDir = path.join(__dirname, '../public');
const port = 8080;

// MIME types for common file extensions
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    // Parse URL and remove query string
    let filePath = req.url.split('?')[0];

    // Remove leading slash and decode URI
    filePath = decodeURIComponent(filePath.substr(1));

    // Default to test-widget.html if no file specified
    if (filePath === '' || filePath === '/') {
        filePath = 'test-widget.html';
    }

    // Build full file path
    const fullPath = path.join(publicDir, filePath);

    // Security check - make sure we're serving from public directory
    if (!fullPath.startsWith(publicDir)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden');
        return;
    }

    // Check if file exists
    fs.stat(fullPath, (err, stats) => {
        if (err || !stats.isFile()) {
            // File not found
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File not found');
            console.log(`❌ 404: ${filePath}`);
            return;
        }

        // Get file extension and content type
        const ext = path.extname(fullPath).toLowerCase();
        const contentType = mimeTypes[ext] || 'application/octet-stream';

        // Add CORS headers for development
        const headers = {
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Cache-Control': 'no-cache'
        };

        // Read and serve the file
        fs.readFile(fullPath, (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error');
                console.log(`❌ Error reading ${filePath}:`, err.message);
                return;
            }

            res.writeHead(200, headers);
            res.end(data);
            console.log(`✅ Served: ${filePath} (${data.length} bytes)`);
        });
    });
});

// Handle server errors
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`❌ Port ${port} is already in use. Try a different port or stop the other server.`);
    } else {
        console.log('❌ Server error:', err.message);
    }
    process.exit(1);
});

// Start the server
server.listen(port, 'localhost', () => {
    console.log(`
🚀 Widget Test Server Started!

📍 Server running at: http://localhost:${port}
📁 Serving files from: ${publicDir}

📋 Available test pages:
• Main Test: http://localhost:${port}/test-widget.html
• Dev Test:  http://localhost:${port}/test-local-dev.html
• Embedded:  http://localhost:${port}/test-embedded.html

🔧 Widget files available:
• Development: http://localhost:${port}/chatbot-widget.js
• Production:  http://localhost:${port}/chatbot-widget.min.js

Press Ctrl+C to stop the server.
`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.close(() => {
        console.log('✅ Server stopped.');
        process.exit(0);
    });
}); 