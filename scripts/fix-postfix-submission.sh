#!/bin/bash

# Postfix submission port javítása (auth nélkül, localhost)

# Eltávolítjuk a régi submission bejegyzést
sed -i '/^submission/,/^$/d' /etc/postfix/master.cf

# Hozzáadjuk az új submission bejegyzést
cat >> /etc/postfix/master.cf << 'EOF'

submission inet n       -       y       -       -       smtpd
  -o syslog_name=postfix/submission
  -o smtpd_tls_security_level=may
  -o smtpd_sasl_auth_enable=no
  -o smtpd_client_restrictions=permit_mynetworks,reject
  -o smtpd_recipient_restrictions=permit_mynetworks,reject_unauth_destination
  -o smtpd_relay_restrictions=permit_mynetworks,reject
  -o milter_macro_daemon_name=ORIGINATING
EOF

echo "✅ Submission hozzáadva (auth nélkül)"
echo ""
echo "=== Submission beállítások ==="
grep -A 10 '^submission' /etc/postfix/master.cf

