#!/bin/sh
set -e

echo "🚀 Starting ExpectedEstate..."
echo "📦 Node: $(node --version)"
echo "🔌 PORT: ${PORT:-not set}"
echo "🌍 NODE_ENV: ${NODE_ENV:-not set}"
echo "💾 DATABASE_URL: ${DATABASE_URL:+configured}"

# List directory contents for debugging
echo "📁 Current directory contents:"
ls -la /app/

# Check if dist folder exists
if [ ! -d "/app/dist" ]; then
    echo "❌ ERROR: /app/dist folder not found!"
    exit 1
fi
echo "✅ dist folder exists ($(du -sh /app/dist | cut -f1))"

# Check if server folder exists
if [ ! -d "/app/server" ]; then
    echo "❌ ERROR: /app/server folder not found!"
    exit 1
fi
echo "✅ server folder exists"

# Check if node_modules exists
if [ ! -d "/app/node_modules" ]; then
    echo "❌ ERROR: /app/node_modules folder not found!"
    exit 1
fi
echo "✅ node_modules exists"

# Check if Prisma client is generated
if [ ! -d "/app/node_modules/.prisma" ]; then
    echo "⚠️  WARNING: Prisma client not found at /app/node_modules/.prisma"
    echo "📁 Checking node_modules structure:"
    ls -la /app/node_modules/ | head -20
    echo "🔧 Attempting to generate Prisma client..."
    npx prisma generate || {
        echo "❌ Failed to generate Prisma client"
        exit 1
    }
fi
echo "✅ Prisma client ready"

# Start the server (compiled JS for speed)
echo "🎧 Starting server on port ${PORT}..."
exec node dist-server/index.js
