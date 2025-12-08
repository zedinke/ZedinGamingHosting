#!/bin/bash

# Roundcube teljes javítása

cd /usr/share/roundcube/config

# Config fájl teljes újraírása
cat > config.inc.php << 'EOF'
<?php
$config = array();
$config['db_dsnw'] = 'mysql://roundcube:Roundcube2024!@localhost/roundcube';
$config['default_host'] = 'localhost';
$config['default_port'] = 143;
$config['smtp_server'] = 'localhost';
$config['smtp_port'] = 587;
$config['smtp_user'] = '%u';
$config['smtp_pass'] = '%p';
$config['des_key'] = '0ILQScqkiIbNvUPfGoTrRp8os5WJhbAh';
$config['product_name'] = 'ZedinGamingHosting Webmail';
$config['plugins'] = array('archive', 'zipdownload');
$config['enable_installer'] = true;
$config['log_dir'] = 'logs/';
$config['temp_dir'] = 'temp/';
$config['debug_level'] = 1;
ini_set('display_errors', '1');
error_reporting(E_ALL);
EOF

chown www-data:www-data config.inc.php
chmod 644 config.inc.php

echo "✅ Roundcube config teljesen javítva"
echo ""
echo "Config tartalma:"
cat config.inc.php | head -10

