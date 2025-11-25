#!/bin/bash

# Exim4 DKIM konfiguráció ellenőrzése
# Futtasd: bash scripts/check-exim-dkim.sh

DOMAIN="zedgaminghosting.hu"

echo "=========================================="
echo "Exim4 DKIM Konfiguráció Ellenőrzése"
echo "Domain: $DOMAIN"
echo "=========================================="
echo ""

# 1. Exim4 állapot
echo "1. EXIM4 ÁLLAPOT"
echo "================"
if systemctl is-active --quiet exim4; then
    echo "✅ Exim4 fut"
    systemctl status exim4 --no-pager -l | head -5
else
    echo "❌ Exim4 NEM fut"
    echo "   Indítás: systemctl start exim4"
fi
echo ""

# 2. DKIM konfiguráció ellenőrzése
echo "2. DKIM KONFIGURÁCIÓ ELLENŐRZÉSE"
echo "================================="
echo ""

# Exim4 fő konfiguráció
if [ -f "/etc/exim4/exim4.conf.template" ]; then
    echo "Exim4 konfiguráció található:"
    echo "   /etc/exim4/exim4.conf.template"
    
    # DKIM router ellenőrzése
    if grep -q "dkim" /etc/exim4/exim4.conf.template; then
        echo "   ✅ DKIM konfiguráció található"
        echo ""
        echo "   DKIM router részletek:"
        grep -A 5 "dkim" /etc/exim4/exim4.conf.template | head -10
    else
        echo "   ⚠️  DKIM konfiguráció NEM található a template-ben"
    fi
else
    echo "   ⚠️  Exim4 konfiguráció nem található"
fi
echo ""

# Hestia CP DKIM kulcsok
echo "3. HESTIA CP DKIM KULCSOK"
echo "=========================="
if [ -f "/usr/local/hestia/bin/v-list-mail-domain-dkim" ]; then
    echo "DKIM kulcs információk:"
    /usr/local/hestia/bin/v-list-mail-domain-dkim $DOMAIN 2>/dev/null || echo "   ⚠️  DKIM nincs beállítva"
    
    # DKIM kulcs fájlok ellenőrzése
    echo ""
    echo "DKIM kulcs fájlok:"
    if [ -d "/usr/local/hestia/data/ssl/dkim" ]; then
        ls -la /usr/local/hestia/data/ssl/dkim/ | grep "$DOMAIN" || echo "   ⚠️  Nincs DKIM kulcs fájl"
    else
        echo "   ⚠️  DKIM könyvtár nem található"
    fi
else
    echo "   ⚠️  Hestia CP DKIM parancs nem található"
fi
echo ""

# DKIM selector ellenőrzése
echo "4. DKIM SELECTOR ELLENŐRZÉSE"
echo "============================="
echo "Mail selector ellenőrzése:"
DKIM_MAIL=$(dig TXT mail._domainkey.$DOMAIN +short)
if [ ! -z "$DKIM_MAIL" ]; then
    echo "   ✅ mail._domainkey található"
else
    echo "   ❌ mail._domainkey NEM található"
fi

echo "Default selector ellenőrzése:"
DKIM_DEFAULT=$(dig TXT default._domainkey.$DOMAIN +short)
if [ ! -z "$DKIM_DEFAULT" ]; then
    echo "   ✅ default._domainkey található"
else
    echo "   ⚠️  default._domainkey NEM található"
fi
echo ""

# Exim4 log ellenőrzése
echo "5. EXIM4 LOG ELLENŐRZÉSE"
echo "========================"
if [ -f "/var/log/exim4/mainlog" ]; then
    echo "Utolsó 10 email küldés (DKIM információkkal):"
    tail -20 /var/log/exim4/mainlog | grep -i dkim | tail -5 || echo "   Nincs DKIM információ a logban"
else
    echo "   ⚠️  Exim4 log nem található"
fi
echo ""

# Összefoglaló
echo "=========================================="
echo "ÖSSZEFOGLALÓ ÉS JAVASLATOK"
echo "=========================================="
echo ""

if systemctl is-active --quiet exim4; then
    echo "✅ Exim4 fut"
else
    echo "❌ Exim4 NEM fut - indítsd el: systemctl start exim4"
fi

if [ ! -z "$DKIM_MAIL" ] || [ ! -z "$DKIM_DEFAULT" ]; then
    echo "✅ DKIM DNS rekord létezik"
else
    echo "❌ DKIM DNS rekord hiányzik"
fi

echo ""
echo "Ha a DKIM nem működik, próbáld:"
echo "1. DKIM újragenerálása:"
echo "   /usr/local/hestia/bin/v-delete-mail-domain-dkim $DOMAIN"
echo "   /usr/local/hestia/bin/v-add-mail-domain-dkim $DOMAIN"
echo ""
echo "2. Exim4 újraindítása:"
echo "   systemctl restart exim4"
echo ""
echo "3. DNS rekordok ellenőrzése:"
echo "   dig TXT mail._domainkey.$DOMAIN +short"
echo ""

