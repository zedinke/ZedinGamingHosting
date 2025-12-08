#!/bin/bash

# Roundcube config teljes újraírása

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
$config['smtp_user'] = '%u';
$config['smtp_pass'] = '%p';
$config['des_key'] = '0ILQScqkiIbNvUPfGoTrRp8os5WJhbAh';
$config['product_name'] = 'ZedinGamingHosting Webmail';
$config['plugins'] = array('archive', 'zipdownload');
$config['enable_installer'] = false;
$config['log_dir'] = 'logs/';
$config['temp_dir'] = 'temp/';
$config['imap_conn_options'] = array(
    'ssl' => array('verify_peer' => false, 'verify_peer_name' => false),
);
$config['imap_force_caps'] = false;
$config['imap_force_lsub'] = false;

// Felhasználónév domain rész eltávolítása
$config['login_username_filter'] = function($username) {
    if (strpos($username, '@') !== false) {
        return substr($username, 0, strpos($username, '@'));
    }
    return $username;
};
EOF

chown www-data:www-data config.inc.php
chmod 644 config.inc.php

echo "✅ Config teljesen újraírva"
php -l config.inc.php

