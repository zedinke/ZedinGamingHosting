#!/bin/bash

# Roundcube webmail beállítása

set -e

DOMAIN="zedgaminghosting.hu"
WEBMAIL_DIR="/var/www/webmail"
DB_NAME="roundcube"
DB_USER="roundcube"
DB_PASS="Roundcube2024!"

echo "📧 Roundcube Webmail Beállítása"
echo "==============================="
echo ""

# 1. Roundcube konfiguráció
echo "⚙️  Roundcube konfiguráció beállítása..."

cd $WEBMAIL_DIR

# config.inc.php létrehozása
cat > config/config.inc.php << EOF
<?php

\$config = array();

// Adatbázis beállítások
\$config['db_dsnw'] = 'mysql://${DB_USER}:${DB_PASS}@localhost/${DB_NAME}';

// IMAP beállítások
\$config['default_host'] = 'localhost';
\$config['default_port'] = 143;
\$config['imap_conn_options'] = array(
    'ssl' => array('verify_peer' => false, 'verify_peer_name' => false),
);
\$config['imap_timeout'] = 15;

// SMTP beállítások
\$config['smtp_server'] = 'localhost';
\$config['smtp_port'] = 587;
\$config['smtp_user'] = '%u';
\$config['smtp_pass'] = '%p';
\$config['smtp_conn_options'] = array(
    'ssl' => array('verify_peer' => false, 'verify_peer_name' => false),
);

// Alkalmazás beállítások
\$config['des_key'] = '$(openssl rand -base64 24 | tr -d '\n')';
\$config['product_name'] = 'ZedinGamingHosting Webmail';
\$config['skin'] = 'elastic';
\$config['plugins'] = array('archive', 'zipdownload', 'managesieve');

// Biztonsági beállítások
\$config['use_https'] = true;
\$config['force_https'] = true;
\$config['session_lifetime'] = 10;
\$config['ip_check'] = false;

// Nyelv
\$config['language'] = 'hu_HU';

// Timezone
\$config['timezone'] = 'Europe/Budapest';

// Log beállítások
\$config['log_dir'] = 'logs/';
\$config['temp_dir'] = 'temp/';
\$config['enable_installer'] = false;

EOF

chown www-data:www-data config/config.inc.php
chmod 640 config/config.inc.php

echo "✅ Roundcube konfigurálva"
echo ""

# 2. Jogosultságok beállítása
echo "🔐 Jogosultságok beállítása..."
chown -R www-data:www-data $WEBMAIL_DIR
chmod -R 755 $WEBMAIL_DIR
chmod -R 777 $WEBMAIL_DIR/temp
chmod -R 777 $WEBMAIL_DIR/logs

echo "✅ Jogosultságok beállítva"
echo ""

echo "✅ Roundcube beállítás kész!"
echo ""
echo "Webmail elérhető: https://${DOMAIN}/webmail"

