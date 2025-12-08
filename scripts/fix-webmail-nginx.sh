#!/bin/bash

# Webmail Nginx konfiguráció javítása

set -e

echo "🔧 Webmail Nginx konfiguráció javítása"
echo "======================================"
echo ""

# Nginx konfiguráció teljes újraírása
cat > /etc/nginx/sites-available/zedgaminghosting.hu << 'NGINXCONF'
server {
    listen 80;
    listen [::]:80;
    server_name zedgaminghosting.hu www.zedgaminghosting.hu;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name zedgaminghosting.hu www.zedgaminghosting.hu;

    ssl_certificate /etc/letsencrypt/live/zedgaminghosting.hu/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/zedgaminghosting.hu/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    root /var/www/html;
    index index.php index.html;

    # Webmail - Roundcube
    location /webmail {
        alias /usr/share/roundcube;
        try_files $uri $uri/ /webmail/index.php?$args;
        
        location ~ \.php$ {
            include snippets/fastcgi-php.conf;
            fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
            fastcgi_param SCRIPT_FILENAME $request_filename;
            fastcgi_param PATH_INFO $fastcgi_path_info;
        }
    }

    # Webmail root redirect
    location = /webmail {
        return 301 /webmail/;
    }

    # Főalkalmazás
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINXCONF

nginx -t && systemctl reload nginx
echo "✅ Nginx konfiguráció frissítve"

