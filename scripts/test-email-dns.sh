#!/bin/bash

# Email DNS rekordok és konfiguráció teljes tesztelése
# Futtasd: bash scripts/test-email-dns.sh

DOMAIN="zedgaminghosting.hu"
IP="116.203.226.140"

echo "=========================================="
echo "Email DNS és Konfiguráció Teljes Teszt"
echo "Domain: $DOMAIN"
echo "=========================================="
echo ""

# 1. SPF rekord ellenőrzése
echo "1. SPF REKORD ELLENŐRZÉSE"
echo "=========================="
SPF=$(dig TXT $DOMAIN +short | grep -i spf)
if [ ! -z "$SPF" ]; then
    echo "✅ SPF rekord található:"
    echo "   $SPF"
    if echo "$SPF" | grep -q "ip4:$IP"; then
        echo "   ✅ Tartalmazza az IP címet ($IP)"
    else
        echo "   ⚠️  NEM tartalmazza az IP címet ($IP)"
    fi
else
    echo "❌ SPF rekord NEM található!"
fi
echo ""

# 2. DKIM rekord ellenőrzése
echo "2. DKIM REKORD ELLENŐRZÉSE"
echo "=========================="
DKIM_DEFAULT=$(dig TXT default._domainkey.$DOMAIN +short)
if [ ! -z "$DKIM_DEFAULT" ]; then
    echo "✅ default._domainkey található:"
    echo "   ${DKIM_DEFAULT:0:80}..."
    if echo "$DKIM_DEFAULT" | grep -q "v=DKIM1"; then
        echo "   ✅ Helyes DKIM formátum"
    fi
else
    echo "❌ default._domainkey NEM található!"
fi

DKIM_MAIL=$(dig TXT mail._domainkey.$DOMAIN +short)
if [ ! -z "$DKIM_MAIL" ]; then
    echo "✅ mail._domainkey található:"
    echo "   ${DKIM_MAIL:0:80}..."
else
    echo "⚠️  mail._domainkey NEM található (nem probléma, ha default van)"
fi
echo ""

# 3. DMARC rekord ellenőrzése
echo "3. DMARC REKORD ELLENŐRZÉSE"
echo "============================"
DMARC=$(dig TXT _dmarc.$DOMAIN +short)
if [ ! -z "$DMARC" ]; then
    echo "✅ DMARC rekord található:"
    echo "   $DMARC"
else
    echo "❌ DMARC rekord NEM található!"
fi
echo ""

# 4. DNS propagáció ellenőrzése
echo "4. DNS PROPAGÁCIÓ ELLENŐRZÉSE"
echo "=============================="
echo "Google DNS (8.8.8.8):"
SPF_G=$(dig @8.8.8.8 TXT $DOMAIN +short | grep -i spf)
DKIM_G=$(dig @8.8.8.8 TXT default._domainkey.$DOMAIN +short)
if [ ! -z "$SPF_G" ] && [ ! -z "$DKIM_G" ]; then
    echo "   ✅ SPF és DKIM propagálódott"
else
    echo "   ⏳ Még NEM propagálódott (várj 1-2 órát)"
fi

echo "Cloudflare DNS (1.1.1.1):"
SPF_CF=$(dig @1.1.1.1 TXT $DOMAIN +short | grep -i spf)
DKIM_CF=$(dig @1.1.1.1 TXT default._domainkey.$DOMAIN +short)
if [ ! -z "$SPF_CF" ] && [ ! -z "$DKIM_CF" ]; then
    echo "   ✅ SPF és DKIM propagálódott"
else
    echo "   ⏳ Még NEM propagálódott (várj 1-2 órát)"
fi
echo ""

# 5. Exim4 állapot
echo "5. EXIM4 ÁLLAPOT"
echo "================"
if systemctl is-active --quiet exim4; then
    echo "✅ Exim4 fut"
else
    echo "❌ Exim4 NEM fut"
fi
echo ""

# 6. Hestia CP DKIM információk
echo "6. HESTIA CP DKIM INFORMÁCIÓK"
echo "=============================="
if [ -f "/usr/local/hestia/bin/v-list-mail-domain-dkim" ]; then
    USER=$(ls -d /home/*/web/$DOMAIN /home/*/mail/$DOMAIN 2>/dev/null | head -1 | cut -d'/' -f3)
    if [ ! -z "$USER" ]; then
        echo "User: $USER"
        /usr/local/hestia/bin/v-list-mail-domain-dkim $USER $DOMAIN 2>/dev/null | head -10 || echo "   ⚠️  DKIM nincs beállítva"
    else
        echo "   ⚠️  User nem található"
    fi
else
    echo "   ⚠️  Hestia CP nem található"
fi
echo ""

# 7. Összefoglaló
echo "=========================================="
echo "ÖSSZEFOGLALÓ"
echo "=========================================="
echo ""

ALL_OK=true

if [ -z "$SPF" ]; then
    echo "❌ SPF rekord hiányzik"
    ALL_OK=false
fi

if [ -z "$DKIM_DEFAULT" ] && [ -z "$DKIM_MAIL" ]; then
    echo "❌ DKIM rekord hiányzik"
    ALL_OK=false
fi

if [ -z "$DMARC" ]; then
    echo "❌ DMARC rekord hiányzik"
    ALL_OK=false
fi

if [ "$ALL_OK" = true ]; then
    echo "✅ Minden DNS rekord helyesen be van állítva!"
    echo ""
    echo "Következő lépések:"
    echo "1. Várj 1-2 órát a DNS propagációra"
    echo "2. Teszteld: https://www.mail-tester.com/"
    echo "3. Küldj egy emailt egy Gmail címre és nézd meg a 'Show original' részt"
else
    echo "⚠️  Van hiányzó vagy hibás rekord!"
    echo "   Ellenőrizd a fenti részleteket."
fi
echo ""

