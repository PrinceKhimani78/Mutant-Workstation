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
cp -R prisma/. cpanel_build/prisma/ 2>/dev/null || true

# Create cPanel Phusion Passenger entry point (app.js)
cat << 'EOF' > cpanel_build/app.js
const path = require('path');

// Explicitly lock working directory to app root for cPanel Phusion Passenger
process.cwd = function() {
  return __dirname;
};

process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || 3000;
process.env.PRISMA_CLIENT_ENGINE_TYPE = 'library';

require('./server.js');
EOF

# Zip the bundle
rm -f cpanel-mutant-workstation.zip
cd cpanel_build
zip -r ../cpanel-mutant-workstation.zip .
cd ..

echo "✅ SUCCESS! Created 'cpanel-mutant-workstation.zip' and 'cpanel_build/' directory."
