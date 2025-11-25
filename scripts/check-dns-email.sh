#!/bin/bash

# Email DNS rekordok ellenőrző script
# Futtasd: bash scripts/check-dns-email.sh

DOMAIN="zedgaminghosting.hu"

echo "=========================================="
echo "Email DNS Rekordok Ellenőrzése"
echo "Domain: $DOMAIN"
echo "=========================================="
echo ""

echo "1. SPF rekord ellenőrzése:"
echo "-------------------------"
SPF=$(dig TXT $DOMAIN +short | grep -i spf)
if [ -z "$SPF" ]; then
    echo "❌ SPF rekord NEM található!"
    echo "   Hozz létre egy TXT rekordot:"
    echo "   Név: @ (vagy üres)"
    echo "   Érték: v=spf1 a mx ip4:116.203.226.140 ~all"
else
    echo "✅ SPF rekord található:"
    echo "   $SPF"
fi
echo ""

echo "2. DKIM rekord ellenőrzése (default selector):"
echo "-----------------------------------------------"
DKIM_DEFAULT=$(dig TXT default._domainkey.$DOMAIN +short)
if [ -z "$DKIM_DEFAULT" ]; then
    echo "⚠️  default._domainkey NEM található"
else
    echo "✅ default._domainkey található:"
    echo "   ${DKIM_DEFAULT:0:100}..."
fi
echo ""

echo "3. DKIM rekord ellenőrzése (mail selector):"
echo "-------------------------------------------"
DKIM_MAIL=$(dig TXT mail._domainkey.$DOMAIN +short)
if [ -z "$DKIM_MAIL" ]; then
    echo "⚠️  mail._domainkey NEM található"
else
    echo "✅ mail._domainkey található:"
    echo "   ${DKIM_MAIL:0:100}..."
fi
echo ""

echo "4. DMARC rekord ellenőrzése:"
echo "----------------------------"
DMARC=$(dig TXT _dmarc.$DOMAIN +short)
if [ -z "$DMARC" ]; then
    echo "❌ DMARC rekord NEM található!"
else
    echo "✅ DMARC rekord található:"
    echo "   $DMARC"
fi
echo ""

echo "5. DNS propagáció ellenőrzése:"
echo "-------------------------------"
echo "Google DNS (8.8.8.8):"
SPF_GOOGLE=$(dig @8.8.8.8 TXT $DOMAIN +short | grep -i spf)
if [ -z "$SPF_GOOGLE" ]; then
    echo "   ⚠️  SPF még NEM propagálódott a Google DNS-re"
else
    echo "   ✅ SPF propagálódott"
fi
echo ""

echo "Cloudflare DNS (1.1.1.1):"
SPF_CF=$(dig @1.1.1.1 TXT $DOMAIN +short | grep -i spf)
if [ -z "$SPF_CF" ]; then
    echo "   ⚠️  SPF még NEM propagálódott a Cloudflare DNS-re"
else
    echo "   ✅ SPF propagálódott"
fi
echo ""

echo "=========================================="
echo "Hestia CP DKIM állapot:"
echo "=========================================="
if [ -f "/usr/local/hestia/bin/v-list-mail-domain-dkim" ]; then
    /usr/local/hestia/bin/v-list-mail-domain-dkim $DOMAIN 2>/dev/null || echo "DKIM nincs beállítva a Hestia CP-ben"
else
    echo "Hestia CP nem található"
fi
echo ""

echo "=========================================="
echo "Ajánlott lépések:"
echo "=========================================="
echo "1. Ha az SPF rekord neve 'zedgaminghosting.hu', változtasd '@'-ra"
echo "2. Ha a DKIM selector 'mail', próbáld 'default'-ot"
echo "3. Várj 1-2 órát a DNS propagációra"
echo "4. Teszteld: https://www.mail-tester.com/"
echo ""

