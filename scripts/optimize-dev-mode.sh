#!/bin/bash

# Development mód optimalizálása

echo "⚡ Development mód optimalizálása..."

cd /opt/zedingaming

# 1. Next.js cache törlése
echo "🧹 Next.js cache törlése..."
rm -rf .next/cache

# 2. Node modules optimalizálás
echo "📦 Node modules optimalizálás..."
# NODE_OPTIONS beállítása a memória optimalizáláshoz
export NODE_OPTIONS="--max-old-space-size=2048"

# 3. PM2 újraindítás optimalizált beállításokkal
echo "🔄 PM2 újraindítás optimalizált beállításokkal..."
pm2 delete zedingaming 2>/dev/null

# Development mód, de optimalizált beállításokkal
pm2 start npm --name zedingaming -- \
  --max-old-space-size=2048 \
  run dev

pm2 save

echo "✅ Optimalizáció kész!"
echo ""
echo "PM2 Status:"
pm2 list

