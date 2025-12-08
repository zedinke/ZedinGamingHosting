#!/bin/bash

# Roundcube teljes tesztelése

echo "🔍 Roundcube teljes ellenőrzés"
echo "=============================="
echo ""

# 1. Adatbázis kapcsolat
echo "📦 Adatbázis kapcsolat teszt..."
mysql -u roundcube -pRoundcube2024! roundcube -e "SELECT COUNT(*) as tables FROM information_schema.tables WHERE table_schema = 'roundcube';" 2>/dev/null && echo "✅ Adatbázis OK" || echo "❌ Adatbázis hiba"

# 2. Config fájl
echo ""
echo "⚙️  Config fájl ellenőrzése..."
if [ -f /usr/share/roundcube/config/config.inc.php ]; then
    echo "✅ Config fájl létezik"
    php -l /usr/share/roundcube/config/config.inc.php 2>&1 | grep -q "No syntax errors" && echo "✅ Config szintaktikailag helyes" || echo "❌ Config szintaktikai hiba"
else
    echo "❌ Config fájl nem létezik"
fi

# 3. PHP függőségek
echo ""
echo "🔧 PHP függőségek ellenőrzése..."
php -m | grep -q mysql && echo "✅ MySQL extension OK" || echo "❌ MySQL extension hiányzik"
php -m | grep -q imap && echo "✅ IMAP extension OK" || echo "❌ IMAP extension hiányzik"
php -m | grep -q mbstring && echo "✅ mbstring extension OK" || echo "❌ mbstring extension hiányzik"

# 4. Jogosultságok
echo ""
echo "🔐 Jogosultságok ellenőrzése..."
[ -r /usr/share/roundcube/config/config.inc.php ] && echo "✅ Config olvasható" || echo "❌ Config nem olvasható"
[ -w /usr/share/roundcube/logs ] && echo "✅ Logs írható" || echo "❌ Logs nem írható"
[ -w /usr/share/roundcube/temp ] && echo "✅ Temp írható" || echo "❌ Temp nem írható"

# 5. Webmail teszt
echo ""
echo "🌐 Webmail elérhetőség teszt..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://zedgaminghosting.hu/webmail/)
echo "HTTP Status: $HTTP_CODE"
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Webmail elérhető"
    curl -s https://zedgaminghosting.hu/webmail/ | grep -q "Roundcube\|login" && echo "✅ Roundcube oldal betöltődik" || echo "⚠️  Roundcube oldal nem tölt be helyesen"
else
    echo "❌ Webmail nem elérhető (HTTP $HTTP_CODE)"
fi

echo ""
echo "✅ Tesztelés kész!"

