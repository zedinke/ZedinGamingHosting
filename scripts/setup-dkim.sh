#!/bin/bash

# DKIM beállítás script - Hestia CP
# Futtasd: bash scripts/setup-dkim.sh

DOMAIN="zedgaminghosting.hu"
USER="ZedGamingHosting"

echo "=========================================="
echo "DKIM Beállítás - Hestia CP"
echo "Domain: $DOMAIN"
echo "User: $USER"
echo "=========================================="
echo ""

# 1. Jelenlegi DKIM állapot
echo "1. JELENLEGI DKIM ÁLLAPOT"
echo "========================="
/usr/local/hestia/bin/v-list-mail-domain-dkim $USER $DOMAIN 2>/dev/null || echo "   ⚠️  DKIM nincs beállítva"
echo ""

# 2. DKIM törlése (ha van)
echo "2. DKIM TÖRLÉSE (ha van)"
echo "========================"
read -p "Törölni szeretnéd a jelenlegi DKIM-et? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    /usr/local/hestia/bin/v-delete-mail-domain-dkim $USER $DOMAIN
    echo "   ✅ DKIM törölve"
else
    echo "   ⏭️  DKIM törlés kihagyva"
fi
echo ""

# 3. DKIM újragenerálása
echo "3. DKIM ÚJRAGENERÁLÁSA"
echo "======================"
read -p "Generálni szeretnéd az új DKIM-et? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    /usr/local/hestia/bin/v-add-mail-domain-dkim $USER $DOMAIN
    echo "   ✅ DKIM generálva"
else
    echo "   ⏭️  DKIM generálás kihagyva"
fi
echo ""

# 4. DKIM információk
echo "4. DKIM INFORMÁCIÓK"
echo "==================="
/usr/local/hestia/bin/v-list-mail-domain-dkim $USER $DOMAIN
echo ""

# 5. DNS rekord ellenőrzése
echo "5. DNS REKORD ELLENŐRZÉSE"
echo "=========================="
echo "Default selector:"
dig TXT default._domainkey.$DOMAIN +short | head -1
echo ""
echo "Mail selector:"
dig TXT mail._domainkey.$DOMAIN +short | head -1
echo ""

# 6. Exim4 újraindítása
echo "6. EXIM4 ÚJRAINDÍTÁSA"
echo "====================="
read -p "Újraindítod az Exim4-et? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    systemctl restart exim4
    echo "   ✅ Exim4 újraindítva"
else
    echo "   ⏭️  Exim4 újraindítás kihagyva"
fi
echo ""

echo "=========================================="
echo "KÉSZ!"
echo "=========================================="
echo ""
echo "Következő lépések:"
echo "1. Várj 1-2 órát a DNS propagációra"
echo "2. Teszteld: https://www.mail-tester.com/"
echo "3. Küldj egy emailt egy Gmail címre és nézd meg a 'Show original' részt"
echo ""

