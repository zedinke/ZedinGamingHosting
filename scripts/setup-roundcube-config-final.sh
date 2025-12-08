#!/bin/bash

# Roundcube config teljes beállítása

cd /usr/share/roundcube/config

DES_KEY=$(openssl rand -base64 24 | tr -d '\n')

cat > config.inc.php << EOF
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

chown www-data:www-data config.inc.php
chmod 644 config.inc.php

echo "✅ Config létrehozva"
php -l config.inc.php
echo ""
echo "=== Config ellenőrzése ==="
grep -E 'smtp' config.inc.php

