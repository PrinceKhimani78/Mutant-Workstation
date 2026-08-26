#!/bin/bash
set -e

echo "📦 Packaging Mutant Workstation for cPanel Deployment..."

# Build Next.js app in standalone mode
npm run build

# Prepare cpanel staging directory
rm -rf cpanel_build
mkdir -p cpanel_build

# Copy standalone build including all hidden .next files
cp -R .next/standalone/. cpanel_build/

# Ensure public, .next/static, and prisma exist
mkdir -p cpanel_build/public
mkdir -p cpanel_build/.next/static
mkdir -p cpanel_build/prisma

# Copy static files & media into standalone structure
cp -R public/. cpanel_build/public/
cp -R .next/static/. cpanel_build/.next/static/
cp -R prisma/. cpanel_build/prisma/ 2>/dev/null || true

# Create cPanel entry point (app.js)
cat << 'EOF' > cpanel_build/app.js
const path = require('path');
process.env.NODE_ENV = 'production';
process.chdir(__dirname);
require('./server.js');
EOF

# Zip the bundle including hidden dotfiles
rm -f cpanel-mutant-workstation.zip
cd cpanel_build
zip -r ../cpanel-mutant-workstation.zip . .next
cd ..

echo "✅ SUCCESS! Created 'cpanel-mutant-workstation.zip' and 'cpanel_build/' directory."
