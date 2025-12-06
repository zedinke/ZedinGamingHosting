#!/bin/bash
# Rust Mod Marketplace - Szerver frissítés script
# Futtatás: bash /home/deploy/update-rust-mod.sh

set -e

echo "🔄 ZedGaming - Rust Mod Marketplace frissítés"
echo "=================================================="

# 1. Git pull
echo ""
echo "📥 GitHub pull..."
cd /var/www/zedgaminghosting
git pull origin main --no-edit

# 2. Prisma
echo ""
echo "🗄️  Prisma szinkronizálás..."
npx prisma generate
npx prisma db push --skip-generate

# 3. Seed minta modulok
echo ""
echo "🌱 Minta modulok betöltése..."
npx ts-node prisma/seed-rust-mods.ts

# 4. NPM install
echo ""
echo "📦 NPM install..."
npm ci

# 5. Build
echo ""
echo "🏗️  Next.js build..."
npm run build

# 6. PM2 restart
echo ""
echo "🚀 PM2 restart..."
pm2 restart zedgaming-hosting || pm2 start npm --name "zedgaming-hosting" -- start

# 7. Verify
echo ""
echo "✅ Status check..."
pm2 status

echo ""
echo "🎉 Frissítés kész!"
echo ""
echo "📊 Rust Mod Marketplace kész!"
echo "  - Piactér: https://zedgaminghosting.hu/dashboard/servers/[id]/mods"
echo "  - Admin panel: https://zedgaminghosting.hu/dashboard/admin/rust-mods"
echo "  - API: https://zedgaminghosting.hu/api/rust-mods"
