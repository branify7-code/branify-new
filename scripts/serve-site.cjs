#!/usr/bin/env node
/* Zero-dependency static server for the built dist — SPA fallback to index.html.
   Usage: node serve-site.cjs <distDir> <port> */
const http = require('http');
const fs = require('fs');
const path = require('path');

const dist = path.resolve(process.argv[2] || 'dist');
const port = parseInt(process.argv[3] || '3000', 10);
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.ttf': 'font/ttf', '.xml': 'application/xml', '.txt': 'text/plain', '.map': 'application/json'
};

http.createServer((req, res) => {
  try {
    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    let filePath = path.join(dist, urlPath);
    if (!filePath.startsWith(dist)) { res.writeHead(403); return res.end(); }
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(dist, 'index.html'); // SPA fallback
    }
    const ext = path.extname(filePath).toLowerCase();
    const data = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600'
    });
    res.end(data);
  } catch (e) {
    res.writeHead(500); res.end('error');
  }
}).listen(port, () => console.log(`serving ${dist} on :${port}`));
