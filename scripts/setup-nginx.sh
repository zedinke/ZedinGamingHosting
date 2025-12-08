#!/bin/bash

# Nginx reverse proxy beállítása

cat > /etc/nginx/sites-available/zedingaming << 'EOF'
server {
    listen 80;
    server_name 116.203.226.140;

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
EOF

ln -sf /etc/nginx/sites-available/zedingaming /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx && echo "✅ Nginx reverse proxy beállítva"

