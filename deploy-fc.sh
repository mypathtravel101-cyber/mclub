#!/bin/bash
echo "=== MCLUB Deployment to Alibaba Cloud FC ==="
echo ""
echo "Prerequisites: Alibaba Cloud AccessKey configured"
echo "  Run: s config add"
echo ""

# Build production
echo "Step 1: Building production package..."
npm ci
npx prisma generate
npm run build

# Prepare deployment directory
echo "Step 2: Preparing deployment package..."
rm -rf /tmp/mclub-deploy
mkdir -p /tmp/mclub-deploy

cp -a .next/standalone/. /tmp/mclub-deploy/
cp -a .next/static /tmp/mclub-deploy/.next/static
cp -a public /tmp/mclub-deploy/ 2>/dev/null
cp -a prisma /tmp/mclub-deploy/ 2>/dev/null
mkdir -p /tmp/mclub-deploy/db
cp -a db/custom.db /tmp/mclub-deploy/db/ 2>/dev/null
cp -a bootstrap /tmp/mclub-deploy/
cp -a s.yaml /tmp/mclub-deploy/

echo "Step 3: Deploying to Function Compute..."
cd /tmp/mclub-deploy
s deploy -y

echo ""
echo "Done! Visit your function URL to verify."
