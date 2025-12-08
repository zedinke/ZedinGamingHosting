#!/bin/bash

# Nginx static fájlok konfigurációja standalone build-hez

NGINX_CONF="/etc/nginx/sites-available/zedgaminghosting.hu"

echo "🔧 Nginx static fájlok konfigurációja"
echo "====================================="

# Ellenőrizzük, hogy van-e már _next/static location
if grep -q "location /_next/static" $NGINX_CONF; then
    echo "✅ _next/static location már létezik"
else
    echo "➕ _next/static location hozzáadása..."
    
    # Hozzáadjuk a _next/static location blokkot a proxy location elé
    sed -i "/location \/ {/i \
    # Next.js static fájlok\n\
    location /_next/static {\n\
        alias /opt/zedingaming/.next/standalone/.next/static;\n\
        expires 365d;\n\
        add_header Cache-Control \"public, immutable\";\n\
    }\n\
    \n" $NGINX_CONF
    
    echo "✅ _next/static location hozzáadva"
fi

# Nginx teszt és újraindítás
nginx -t && systemctl reload nginx
echo "✅ Nginx konfigurálva és újraindítva"

