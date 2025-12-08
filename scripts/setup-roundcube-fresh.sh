#!/bin/bash

# Roundcube teljes újratelepítése és beállítása

echo "=== Roundcube config létrehozása ==="
mkdir -p /etc/roundcube

DES_KEY=$(openssl rand -base64 24 | tr -d '\n')

cat > /etc/roundcube/config.inc.php << EOF
<?php
\$config = array();
\$config['db_dsnw'] = 'mysql://roundcube:Roundcube2024!@localhost/roundcube';
\$config['default_host'] = 'localhost';
\$config['default_port'] = 143;
\$config['smtp_server'] = 'localhost';
\$config['smtp_port'] = 25;
\$config['smtp_user'] = '';
\$config['smtp_pass'] = '';
\$config['smtp_auth_type'] = null;
\$config['des_key'] = '${DES_KEY}';
\$config['enable_installer'] = false;
\$config['plugins'] = array('archive', 'zipdownload');
\$config['log_dir'] = 'logs/';
\$config['temp_dir'] = 'temp/';
EOF

chown www-data:www-data /etc/roundcube/config.inc.php
chmod 644 /etc/roundcube/config.inc.php

echo "✅ Roundcube config létrehozva"

echo ""
echo "=== Roundcube jogosultságok ==="
chown -R www-data:www-data /usr/share/roundcube
chmod -R 755 /usr/share/roundcube
mkdir -p /usr/share/roundcube/logs /usr/share/roundcube/temp
chown -R www-data:www-data /usr/share/roundcube/logs /usr/share/roundcube/temp
chmod -R 755 /usr/share/roundcube/logs /usr/share/roundcube/temp

echo "✅ Jogosultságok beállítva"

echo ""
echo "=== Config ellenőrzése ==="
php -l /etc/roundcube/config.inc.php
grep -E 'smtp' /etc/roundcube/config.inc.php

