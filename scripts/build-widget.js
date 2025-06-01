// Build script for creating the embeddable chat widget script

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import * as esbuild from 'esbuild';

// Get current file directory with ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const srcPath = path.join(__dirname, '../src/widget/widget.ts');
const distPath = path.join(__dirname, '../public');
const outPath = path.join(distPath, 'chatbot-widget.js');
const minOutPath = path.join(distPath, 'chatbot-widget.min.js');

// Create dist directory if it doesn't exist
if (!fs.existsSync(distPath)) {
  fs.mkdirSync(distPath);
}

// Build with esbuild for development (unminified)
esbuild.buildSync({
  entryPoints: [srcPath],
  bundle: true,
  outfile: outPath,
  platform: 'browser',
  target: ['es2017'],
  format: 'iife',
});

// Build with esbuild for production (minified)
esbuild.buildSync({
  entryPoints: [srcPath],
  bundle: true,
  outfile: minOutPath,
  platform: 'browser',
  target: ['es2017'],
  format: 'iife',
  minify: true,
});

// File sizes for reporting
const unminifiedSize = fs.statSync(outPath).size;
const minifiedSize = fs.statSync(minOutPath).size;

console.log(`
✓ Widget build successful!

Output files:
- ${outPath} (${(unminifiedSize / 1024).toFixed(2)} KB)
- ${minOutPath} (${(minifiedSize / 1024).toFixed(2)} KB)

To embed the chatbot on your website, add the following script tag:

<script 
  src="${process.env.PUBLIC_URL || 'http://localhost:5173'}/chatbot-widget.min.js" 
  data-api-key="YOUR_API_KEY">
</script>
`); 