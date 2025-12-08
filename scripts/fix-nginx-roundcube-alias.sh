#!/bin/bash

# Nginx konfiguráció javítása Roundcube-hoz (alias használata)

cat > /etc/nginx/sites-available/zedgaminghosting.hu << 'NGINXCONFIG'
server {
    listen 80;
    listen [::]:80;
    server_name zedgaminghosting.hu www.zedgaminghosting.hu;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name zedgaminghosting.hu www.zedgaminghosting.hu;

    ssl_certificate /etc/letsencrypt/live/zedgaminghosting.hu/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/zedgaminghosting.hu/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    root /var/www/html;
    index index.html index.htm;

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

    location /webmail {
        alias /usr/share/roundcube;
        index index.php;
        try_files $uri $uri/ /webmail/index.php?$query_string;

        location ~ \.php$ {
            include snippets/fastcgi-php.conf;
            fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
            fastcgi_param SCRIPT_FILENAME $request_filename;
        }
    }

    location = /webmail {
        return 301 /webmail/;
    }
}
NGINXCONFIG

ln -sf /etc/nginx/sites-available/zedgaminghosting.hu /etc/nginx/sites-enabled/zedgaminghosting.hu

nginx -t && systemctl reload nginx && echo "✅ Nginx konfigurálva"

