#!/bin/bash

# Email konfiguráció teljes ellenőrzése
# Futtasd: bash scripts/check-email-config.sh

DOMAIN="zedgaminghosting.hu"
IP="116.203.226.140"

echo "=========================================="
echo "Email Konfiguráció Teljes Ellenőrzése"
echo "Domain: $DOMAIN"
echo "=========================================="
echo ""

# 1. DNS rekordok ellenőrzése
echo "1. DNS REKORDOK ELLENŐRZÉSE"
echo "============================"
echo ""

echo "SPF rekord:"
SPF=$(dig TXT $DOMAIN +short | grep -i spf)
if [ -z "$SPF" ]; then
    echo "   ❌ NEM található!"
else
    echo "   ✅ Található: $SPF"
    if echo "$SPF" | grep -q "ip4:$IP"; then
        echo "   ✅ Tartalmazza az IP címet ($IP)"
    else
        echo "   ⚠️  NEM tartalmazza az IP címet ($IP)"
    fi
fi
echo ""

echo "DKIM rekord (mail selector):"
DKIM_MAIL=$(dig TXT mail._domainkey.$DOMAIN +short)
if [ -z "$DKIM_MAIL" ]; then
    echo "   ❌ NEM található!"
else
    echo "   ✅ Található: ${DKIM_MAIL:0:50}..."
    if echo "$DKIM_MAIL" | grep -q "v=DKIM1"; then
        echo "   ✅ Helyes DKIM formátum"
    fi
fi
echo ""

echo "DKIM rekord (default selector):"
DKIM_DEFAULT=$(dig TXT default._domainkey.$DOMAIN +short)
if [ -z "$DKIM_DEFAULT" ]; then
    echo "   ⚠️  NEM található (lehet, hogy csak 'mail' selector van)"
else
    echo "   ✅ Található: ${DKIM_DEFAULT:0:50}..."
fi
echo ""

echo "DMARC rekord:"
DMARC=$(dig TXT _dmarc.$DOMAIN +short)
if [ -z "$DMARC" ]; then
    echo "   ❌ NEM található!"
else
    echo "   ✅ Található: $DMARC"
fi
echo ""

# 2. DNS propagáció ellenőrzése
echo "2. DNS PROPAGÁCIÓ ELLENŐRZÉSE"
echo "=============================="
echo ""

echo "Google DNS (8.8.8.8):"
SPF_G=$(dig @8.8.8.8 TXT $DOMAIN +short | grep -i spf)
if [ -z "$SPF_G" ]; then
    echo "   ⚠️  SPF még NEM propagálódott"
else
    echo "   ✅ SPF propagálódott: $SPF_G"
fi

DKIM_G=$(dig @8.8.8.8 TXT mail._domainkey.$DOMAIN +short)
if [ -z "$DKIM_G" ]; then
    echo "   ⚠️  DKIM még NEM propagálódott"
else
    echo "   ✅ DKIM propagálódott"
fi
echo ""

echo "Cloudflare DNS (1.1.1.1):"
SPF_CF=$(dig @1.1.1.1 TXT $DOMAIN +short | grep -i spf)
if [ -z "$SPF_CF" ]; then
    echo "   ⚠️  SPF még NEM propagálódott"
else
    echo "   ✅ SPF propagálódott: $SPF_CF"
fi

DKIM_CF=$(dig @1.1.1.1 TXT mail._domainkey.$DOMAIN +short)
if [ -z "$DKIM_CF" ]; then
    echo "   ⚠️  DKIM még NEM propagálódott"
else
    echo "   ✅ DKIM propagálódott"
fi
echo ""

# 3. Hestia CP mail szerver ellenőrzése
echo "3. HESTIA CP MAIL SZERVER ELLENŐRZÉSE"
echo "====================================="
echo ""

if [ -f "/usr/local/hestia/bin/v-list-mail-domain-dkim" ]; then
    echo "DKIM konfiguráció:"
    /usr/local/hestia/bin/v-list-mail-domain-dkim $DOMAIN 2>/dev/null || echo "   ⚠️  DKIM nincs beállítva"
    echo ""
else
    echo "   ⚠️  Hestia CP nem található"
    echo ""
fi

echo "Postfix állapot:"
if systemctl is-active --quiet postfix; then
    echo "   ✅ Postfix fut"
else
    echo "   ❌ Postfix NEM fut"
fi
echo ""

echo "Opendkim állapot:"
if systemctl is-active --quiet opendkim; then
    echo "   ✅ Opendkim fut"
    echo "   Selector ellenőrzése:"
    if [ -f "/etc/opendkim/KeyTable" ]; then
        grep -i "$DOMAIN" /etc/opendkim/KeyTable 2>/dev/null | head -1 || echo "      ⚠️  Nincs bejegyzés"
    fi
else
    echo "   ⚠️  Opendkim NEM fut (lehet, hogy a Hestia CP más módon kezeli)"
fi
echo ""

# 4. Email küldés tesztelése
echo "4. EMAIL KÜLDÉS TESZTELÉSE"
echo "=========================="
echo ""
echo "Ajánlott tesztelési módszerek:"
echo "1. Mail-tester: https://www.mail-tester.com/"
echo "   - Küldj egy emailt a megadott címre"
echo "   - Cél: 8-10 pont"
echo ""
echo "2. Gmail teszt:"
echo "   - Küldj egy emailt egy Gmail címre"
echo "   - Nyisd meg az emailt → Show original"
echo "   - Nézd meg: spf=pass, dkim=pass"
echo ""

# 5. Összefoglaló
echo "=========================================="
echo "ÖSSZEFOGLALÓ"
echo "=========================================="
echo ""

if [ ! -z "$SPF" ] && [ ! -z "$DKIM_MAIL" ] && [ ! -z "$DMARC" ]; then
    echo "✅ Minden DNS rekord helyesen be van állítva!"
    echo ""
    if [ ! -z "$SPF_G" ] && [ ! -z "$DKIM_G" ]; then
        echo "✅ DNS propagáció megtörtént!"
        echo ""
        echo "🎉 Minden rendben! Próbáld ki az email küldést!"
        echo "   Ha még mindig nem működik, várj 1-2 órát a teljes propagációra."
    else
        echo "⏳ DNS propagáció még folyamatban..."
        echo "   Várj 1-2 órát, majd próbáld újra."
    fi
else
    echo "❌ Valami hiányzik vagy rosszul van beállítva!"
    echo "   Ellenőrizd a fenti részleteket."
fi
echo ""

