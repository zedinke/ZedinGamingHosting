#!/bin/bash

# ZedinGamingHosting Szerver Telepítési Script
# Használat: bash scripts/server-setup.sh

set -e

echo "🚀 ZedinGamingHosting Szerver Telepítés"
echo "======================================"
echo ""

# Színek
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Adatbázis létrehozása
echo -e "${YELLOW}📦 Adatbázis létrehozása...${NC}"

# Ellenőrizzük, hogy létezik-e az adatbázis
DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='zedingaming'")
if [ "$DB_EXISTS" = "1" ]; then
    echo -e "${GREEN}✅ zedingaming adatbázis már létezik${NC}"
else
    sudo -u postgres psql -c "CREATE DATABASE zedingaming;"
    echo -e "${GREEN}✅ zedingaming adatbázis létrehozva${NC}"
fi

# Ellenőrizzük, hogy létezik-e a felhasználó
USER_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_user WHERE usename='zedingaming_user'")
if [ "$USER_EXISTS" = "1" ]; then
    echo -e "${GREEN}✅ zedingaming_user már létezik${NC}"
else
    sudo -u postgres psql -c "CREATE USER zedingaming_user WITH PASSWORD 'ZedinGaming2024!';"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE zedingaming TO zedingaming_user;"
    echo -e "${GREEN}✅ zedingaming_user létrehozva${NC}"
fi

echo ""

# 2. Környezeti változók beállítása
echo -e "${YELLOW}⚙️  Környezeti változók beállítása...${NC}"

cd /opt/zedingaming

# .env fájl létrehozása
echo ""
echo -e "${YELLOW}📝 .env fájl létrehozása...${NC}"

# NEXTAUTH_SECRET generálása
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# .env fájl frissítése
cat > .env << EOF
# ============================================
# ADATBÁZIS
# ============================================
DATABASE_URL="postgresql://zedingaming_user:ZedinGaming2024!@localhost:5432/zedingaming"

# ============================================
# NEXTAUTH (Autentikáció)
# ============================================
NEXTAUTH_URL="http://116.203.226.140:3000"
NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"

# ============================================
# EMAIL (SMTP - később beállítandó)
# ============================================
SMTP_HOST=localhost
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@zedgaminghosting.hu
SMTP_PASSWORD=
SMTP_FROM=noreply@zedgaminghosting.hu

# ============================================
# STRIPE (Opcionális - később beállítandó)
# ============================================
# STRIPE_SECRET_KEY=
# STRIPE_PUBLISHABLE_KEY=
# STRIPE_WEBHOOK_SECRET=

# ============================================
# OAuth (Opcionális - később beállítandó)
# ============================================
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
# DISCORD_CLIENT_ID=
# DISCORD_CLIENT_SECRET=

# ============================================
# Opcionális beállítások
# ============================================
PORT=3000
NODE_ENV=production
EOF

echo -e "${GREEN}✅ .env fájl frissítve${NC}"
echo ""

# 3. Node.js függőségek telepítése
echo -e "${YELLOW}📦 Node.js függőségek telepítése...${NC}"
npm install
echo -e "${GREEN}✅ Függőségek telepítve${NC}"
echo ""

# 4. Prisma client generálása
echo -e "${YELLOW}🔧 Prisma client generálása...${NC}"
npm run db:generate
echo -e "${GREEN}✅ Prisma client generálva${NC}"
echo ""

# 5. Adatbázis migrációk
echo -e "${YELLOW}🗄️  Adatbázis migrációk...${NC}"
npm run db:push
echo -e "${GREEN}✅ Adatbázis migrációk kész${NC}"
echo ""

# 6. Production build
echo -e "${YELLOW}🏗️  Production build...${NC}"
npm run build
echo -e "${GREEN}✅ Build sikeres${NC}"
echo ""

# 7. PM2 indítás
echo -e "${YELLOW}🚀 PM2 indítás...${NC}"

# Leállítjuk a régi folyamatokat (ha vannak)
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Új folyamat indítása
cd /opt/zedingaming
pm2 start npm --name "zedingaming" -- start
pm2 save
pm2 startup

echo -e "${GREEN}✅ PM2 elindítva${NC}"
echo ""

# 8. PM2 státusz
echo -e "${YELLOW}📊 PM2 státusz:${NC}"
pm2 list

echo ""
echo -e "${GREEN}🎉 Telepítés sikeres!${NC}"
echo ""
echo "Az alkalmazás elérhető: http://116.203.226.140:3000"
echo "PM2 logok: pm2 logs zedingaming"

