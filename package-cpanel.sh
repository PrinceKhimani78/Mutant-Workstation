#!/bin/bash
set -e

echo "📦 Packaging Mutant Workstation for cPanel Deployment..."

# Generate multi-platform Prisma engines
npx prisma generate

# Build Next.js app in standalone mode
npm run build

# Prepare cpanel staging directory
rm -rf cpanel_build
mkdir -p cpanel_build

# Copy standalone build
cp -R .next/standalone/. cpanel_build/

# Ensure .next, public, and prisma exist
mkdir -p cpanel_build/public
mkdir -p cpanel_build/.next/static
mkdir -p cpanel_build/prisma

# Copy static assets & public assets
cp -R public/. cpanel_build/public/
cp -R .next/static/. cpanel_build/.next/static/

# Copy BUILD_ID and build manifests into .next root
cp .next/BUILD_ID cpanel_build/.next/ 2>/dev/null || true
cp .next/routes-manifest.json cpanel_build/.next/ 2>/dev/null || true
cp .next/prerender-manifest.json cpanel_build/.next/ 2>/dev/null || true

# Copy database files
cp prisma/dev.db cpanel_build/prisma/ 2>/dev/null || true
cp -R prisma/. cpanel_build/prisma/ 2>/dev/null || true

# Patch server.js to prevent parseInt on Phusion Passenger UNIX socket strings
if [ -f cpanel_build/server.js ]; then
  sed -i.bak 's/parseInt(process.env.PORT, 10)/process.env.PORT/g' cpanel_build/server.js 2>/dev/null || sed -i '' 's/parseInt(process.env.PORT, 10)/process.env.PORT/g' cpanel_build/server.js
  rm -f cpanel_build/server.js.bak
fi

# Create crash-safe diagnostic cPanel entry point (app.js)
cat << 'EOF' > cpanel_build/app.js
const fs = require('fs');
const http = require('http');

process.env.NODE_ENV = 'production';
process.env.PRISMA_CLIENT_ENGINE_TYPE = 'library';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./prisma/dev.db';

process.chdir(__dirname);

let initError = null;

try {
  require('./server.js');
} catch (err) {
  initError = err;
  try {
    fs.writeFileSync('init_error.txt', err.stack || String(err));
  } catch (e) {}
}

if (initError) {
  const server = http.createServer((req, res) => {
    res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <html>
        <body style="font-family: sans-serif; padding: 20px; background: #0f172a; color: #f8fafc;">
          <h1 style="color: #ef4444;">Mutant Workstation Deployment Error</h1>
          <p>The Next.js production server encountered an error during boot:</p>
          <pre style="background: #1e293b; padding: 15px; border-radius: 8px; color: #fca5a5; overflow-x: auto;">${initError.stack}</pre>
        </body>
      </html>
    `);
  });
  const listenPort = process.env.PORT || 3000;
  server.listen(listenPort);
}
EOF

# Zip the bundle
rm -f cpanel-mutant-workstation.zip
cd cpanel_build
zip -r ../cpanel-mutant-workstation.zip .
cd ..

echo "✅ SUCCESS! Created 'cpanel-mutant-workstation.zip' and 'cpanel_build/' directory."
