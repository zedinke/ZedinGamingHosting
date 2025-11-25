#!/bin/bash

# ZedinGamingHosting Deployment Script
# Használat: ./scripts/deploy.sh

set -e

echo "🚀 ZedinGamingHosting Deployment Script"
echo "========================================"

# Színek
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Ellenőrzések
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env fájl nem található!${NC}"
    echo "Kérjük, másold a .env.example fájlt .env-re és töltsd ki."
    exit 1
fi

echo -e "${YELLOW}📦 Függőségek telepítése...${NC}"
npm install

echo -e "${YELLOW}🔧 Prisma client generálása...${NC}"
npm run db:generate

echo -e "${YELLOW}🗄️  Adatbázis migrációk...${NC}"
npm run db:push

echo -e "${YELLOW}🏗️  Production build...${NC}"
npm run build

echo -e "${GREEN}✅ Build sikeres!${NC}"

# PM2 ellenőrzés
if command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}🔄 PM2 újraindítás...${NC}"
    
    if pm2 list | grep -q "zedingaming"; then
        pm2 restart zedingaming
        echo -e "${GREEN}✅ PM2 újraindítva!${NC}"
    else
        pm2 start npm --name "zedingaming" -- start
        pm2 save
        echo -e "${GREEN}✅ PM2 elindítva!${NC}"
    fi
    
    echo -e "${YELLOW}📊 PM2 státusz:${NC}"
    pm2 list
else
    echo -e "${YELLOW}⚠️  PM2 nem található. Kérjük, telepítsd: npm install -g pm2${NC}"
fi

echo -e "${GREEN}🎉 Deployment sikeres!${NC}"

