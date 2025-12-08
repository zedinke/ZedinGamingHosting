#!/bin/bash

# Dovecot és Postfix beállítása email fogadáshoz és küldéshez

set -e

DOMAIN="zedgaminghosting.hu"

echo "📧 Dovecot és Postfix beállítása"
echo "================================="
echo ""

# 1. Postfix beállítások
echo "📤 Postfix beállítása..."

# Postfix main.cf frissítése
postconf -e "myhostname = ${DOMAIN}"
postconf -e "mydomain = ${DOMAIN}"
postconf -e "myorigin = \$mydomain"
postconf -e "mydestination = \$myhostname, localhost.\$mydomain, \$mydomain, localhost"
postconf -e "home_mailbox = Maildir/"

# Virtual domains (ha kell)
postconf -e "virtual_mailbox_domains = ${DOMAIN}"
postconf -e "virtual_mailbox_base = /var/mail"
postconf -e "virtual_mailbox_maps = hash:/etc/postfix/virtual_mailbox_maps"
postconf -e "virtual_minimum_uid = 100"
postconf -e "virtual_uid_maps = static:5000"
postconf -e "virtual_gid_maps = static:5000"

# TLS beállítások
postconf -e "smtpd_tls_cert_file = /etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
postconf -e "smtpd_tls_key_file = /etc/letsencrypt/live/${DOMAIN}/privkey.pem"
postconf -e "smtpd_tls_security_level = may"
postconf -e "smtp_tls_security_level = may"

systemctl restart postfix
echo "✅ Postfix beállítva"
echo ""

# 2. Dovecot beállítások
echo "📥 Dovecot beállítása..."

# Dovecot konfiguráció
cat > /etc/dovecot/conf.d/10-mail.conf << 'EOF'
mail_location = maildir:~/Maildir
namespace inbox {
  inbox = yes
}
EOF

cat > /etc/dovecot/conf.d/10-auth.conf << 'EOF'
disable_plaintext_auth = no
auth_mechanisms = plain login
!include auth-system.conf.ext
EOF

# SSL beállítások
cat > /etc/dovecot/conf.d/10-ssl.conf << EOF
ssl = required
ssl_cert = </etc/letsencrypt/live/${DOMAIN}/fullchain.pem
ssl_key = </etc/letsencrypt/live/${DOMAIN}/privkey.pem
EOF

systemctl restart dovecot
echo "✅ Dovecot beállítva"
echo ""

# 3. Email felhasználó létrehozása (példa)
echo "👤 Email felhasználó létrehozása..."
if ! id "mailuser" &>/dev/null; then
    useradd -r -m -s /bin/bash -d /var/mail/mailuser mailuser
    echo "✅ mailuser létrehozva"
    echo "⚠️  Állíts be jelszót: passwd mailuser"
else
    echo "✅ mailuser már létezik"
fi

echo ""
echo "✅ Email szerver beállítva!"
echo ""
echo "IMAP: localhost:143 (STARTTLS)"
echo "SMTP: localhost:587 (STARTTLS)"
echo "Webmail: https://${DOMAIN}/webmail"

