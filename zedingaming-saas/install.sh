#!/bin/bash

echo "========================================"
echo "ZedinGamingHosting SaaS Telepítés"
echo "========================================"
echo ""

# Ellenőrizzük, hogy Node.js telepítve van-e
if ! command -v node &> /dev/null; then
    echo "HIBA: Node.js nincs telepítve!"
    echo "Kérjük, telepítsd a Node.js-t: https://nodejs.org/"
    exit 1
fi

# Ellenőrizzük, hogy npm telepítve van-e
if ! command -v npm &> /dev/null; then
    echo "HIBA: npm nincs telepítve!"
    exit 1
fi

echo "[1/6] Node.js verzió ellenőrzése..."
node --version
npm --version
echo ""

echo "[2/6] Függőségek telepítése..."
npm install
if [ $? -ne 0 ]; then
    echo "HIBA: A függőségek telepítése sikertelen!"
    exit 1
fi
echo ""

echo "[3/6] Adatbázis mappa létrehozása..."
mkdir -p data
echo ""

echo "[4/6] Prisma client generálása..."
npm run db:generate
if [ $? -ne 0 ]; then
    echo "HIBA: Prisma client generálása sikertelen!"
    exit 1
fi
echo ""

echo "[5/6] Adatbázis inicializálása..."
npm run db:push
if [ $? -ne 0 ]; then
    echo "HIBA: Adatbázis inicializálása sikertelen!"
    exit 1
fi
echo ""

echo "[6/6] Admin felhasználó létrehozása..."
echo ""
read -p "Admin email cím: " ADMIN_EMAIL
read -sp "Admin jelszó: " ADMIN_PASSWORD
echo ""

npm run setup:admin -- --email "$ADMIN_EMAIL" --password "$ADMIN_PASSWORD"
if [ $? -ne 0 ]; then
    echo "HIBA: Admin felhasználó létrehozása sikertelen!"
    exit 1
fi
echo ""

echo "========================================"
echo "Telepítés sikeresen befejeződött!"
echo "========================================"
echo ""
echo "Indítás: npm run dev"
echo "Production build: npm run build && npm start"
echo ""

