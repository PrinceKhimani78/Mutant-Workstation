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

# Create cPanel entry point (app.js)
cat << 'EOF' > cpanel_build/app.js
process.env.NODE_ENV = 'production';
process.env.PRISMA_CLIENT_ENGINE_TYPE = 'library';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./prisma/dev.db';

process.chdir(__dirname);

require('./server.js');
EOF

# Create emergency process flusher (kill.php) to reset CloudLinux NPROC limit
cat << 'EOF' > cpanel_build/kill.php
<?php
header('Content-Type: text/plain');
echo "Cleaning stuck Node processes...\n";
exec('pkill -9 -u $(whoami) node 2>&1', $out);
echo implode("\n", $out);
echo "\n✅ Cleaned! Node process table reset successfully.";
?>
EOF

# Zip the bundle
rm -f cpanel-mutant-workstation.zip
cd cpanel_build
zip -r ../cpanel-mutant-workstation.zip .
cd ..

echo "✅ SUCCESS! Created 'cpanel-mutant-workstation.zip' and 'cpanel_build/' directory."
