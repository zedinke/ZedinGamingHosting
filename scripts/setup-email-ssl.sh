#!/bin/bash

# Email és SSL beállítások

set -e

DOMAIN="zedgaminghosting.hu"
EMAIL="noreply@${DOMAIN}"

echo "🔧 Email és SSL beállítások"
echo "============================"
echo ""

# 1. Postfix konfiguráció
echo "📧 Postfix konfiguráció beállítása..."
postconf -e "myhostname = ${DOMAIN}"
postconf -e "mydomain = ${DOMAIN}"
postconf -e "myorigin = \$mydomain"
postconf -e "inet_interfaces = all"
postconf -e "inet_protocols = ipv4"
postconf -e "mydestination = \$myhostname, localhost.\$mydomain, \$mydomain, localhost"

# Email relay beállítások (ha kell)
postconf -e "smtpd_banner = \$myhostname ESMTP \$mail_name"
postconf -e "biff = no"
postconf -e "append_dot_mydomain = no"
postconf -e "readme_directory = no"

# TLS beállítások
postconf -e "smtpd_tls_cert_file = /etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
postconf -e "smtpd_tls_key_file = /etc/letsencrypt/live/${DOMAIN}/privkey.pem"
postconf -e "smtpd_tls_security_level = may"
postconf -e "smtp_tls_security_level = may"
postconf -e "smtpd_tls_auth_only = yes"

# SPF, DKIM támogatás
postconf -e "smtpd_recipient_restrictions = permit_mynetworks, permit_sasl_authenticated, reject_unauth_destination"

systemctl restart postfix
echo "✅ Postfix konfigurálva és újraindítva"
echo ""

# 2. Nginx SSL konfiguráció
echo "🌐 Nginx SSL konfiguráció beállítása..."

cat > /etc/nginx/sites-available/${DOMAIN} << EOF
# HTTP -> HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

# HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN} www.${DOMAIN};

    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    
    # SSL beállítások
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

ln -sf /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
echo "✅ Nginx SSL konfigurálva"
echo ""

# 3. SSL tanúsítvány auto-renewal ellenőrzése
echo "🔄 SSL tanúsítvány auto-renewal ellenőrzése..."
if systemctl is-active --quiet certbot.timer; then
    echo "✅ Certbot timer aktív"
else
    systemctl enable certbot.timer
    systemctl start certbot.timer
    echo "✅ Certbot timer engedélyezve"
fi

echo ""
echo "✅ Email és SSL beállítások kész!"
echo ""
echo "Email: ${EMAIL}"
echo "Domain: ${DOMAIN}"
echo "SSL: https://${DOMAIN}"

