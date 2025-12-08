#!/bin/bash

# Roundcube SMTP config teljes javítása (null értékek, nincs placeholder)

cd /usr/share/roundcube/config

cat > config.inc.php << 'EOF'
<?php
$config = array();
$config['db_dsnw'] = 'mysql://roundcube:Roundcube2024!@localhost/roundcube';
$config['default_host'] = 'localhost';
$config['default_port'] = 143;
$config['username_domain'] = '';
$config['imap_auth_type'] = 'LOGIN';
$config['smtp_server'] = 'localhost';
$config['smtp_port'] = 587;
$config['smtp_helo_host'] = 'localhost';
$config['smtp_timeout'] = 10;
$config['smtp_auth_type'] = null;
$config['smtp_user'] = null;
$config['smtp_pass'] = null;
$config['des_key'] = '0ILQScqkiIbNvUPfGoTrRp8os5WJhbAh';
$config['product_name'] = 'ZedinGamingHosting Webmail';
$config['plugins'] = array('archive', 'zipdownload', 'username_filter');
$config['enable_installer'] = false;
$config['log_dir'] = 'logs/';
$config['temp_dir'] = 'temp/';
$config['imap_conn_options'] = array(
    'ssl' => array('verify_peer' => false, 'verify_peer_name' => false),
);
$config['smtp_conn_options'] = array(
    'ssl' => array(
        'verify_peer' => false,
        'verify_peer_name' => false,
        'allow_self_signed' => true,
    ),
);
EOF

chown www-data:www-data config.inc.php
chmod 644 config.inc.php

echo "✅ Config teljesen újraírva (null értékek)"
php -l config.inc.php
echo ""
echo "=== Config ellenőrzése ==="
grep -E 'smtp' config.inc.php

