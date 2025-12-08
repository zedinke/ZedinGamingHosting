#!/bin/bash

# NEXTAUTH_URL frissítése .env fájlban

cd /opt/zedingaming

# NEXTAUTH_URL frissítése
sed -i 's|NEXTAUTH_URL=.*|NEXTAUTH_URL="https://zedgaminghosting.hu"|' .env

echo "✅ NEXTAUTH_URL frissítve"
grep NEXTAUTH_URL .env

