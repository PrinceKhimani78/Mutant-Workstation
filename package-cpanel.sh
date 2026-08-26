#!/bin/bash
set -e

echo "📦 Packaging Mutant Workstation for cPanel Deployment..."

# Build Next.js app in standalone mode
npm run build

# Prepare cpanel staging directory
rm -rf cpanel_build
mkdir -p cpanel_build

# Copy standalone build
cp -r .next/standalone/* cpanel_build/
mkdir -p cpanel_build/public
mkdir -p cpanel_build/.next/static
mkdir -p cpanel_build/prisma

# Copy static assets into standalone structure
cp -r public/* cpanel_build/public/
cp -r .next/static/* cpanel_build/.next/static/
cp -r prisma/dev.db cpanel_build/prisma/ 2>/dev/null || true
cp -r prisma/schema.prisma cpanel_build/prisma/ 2>/dev/null || true

# Create cPanel entry point (app.js)
cat << 'EOF' > cpanel_build/app.js
const port = process.env.PORT || 3000;
process.env.NODE_ENV = 'production';
require('./server.js');
EOF

# Zip the bundle
rm -f cpanel-mutant-workstation.zip
cd cpanel_build
zip -r ../cpanel-mutant-workstation.zip .
cd ..

rm -rf cpanel_build

echo "✅ SUCCESS! Created 'cpanel-mutant-workstation.zip' in project root."
