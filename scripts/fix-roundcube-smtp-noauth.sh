#!/bin/bash

# Roundcube SMTP config javítása (auth nélkül localhost)

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
$config['smtp_port'] = 25;
$config['smtp_user'] = '';
$config['smtp_pass'] = '';
$config['des_key'] = '0ILQScqkiIbNvUPfGoTrRp8os5WJhbAh';
$config['product_name'] = 'ZedinGamingHosting Webmail';
$config['plugins'] = array('archive', 'zipdownload', 'username_filter');
$config['enable_installer'] = false;
$config['log_dir'] = 'logs/';
$config['temp_dir'] = 'temp/';
$config['imap_conn_options'] = array(
    'ssl' => array('verify_peer' => false, 'verify_peer_name' => false),
);
$config['imap_force_caps'] = false;
$config['imap_force_lsub'] = false;
$config['smtp_conn_options'] = array(
    'ssl' => array(
        'verify_peer' => false,
        'verify_peer_name' => false,
        'allow_self_signed' => true,
    ),
);
$config['smtp_timeout'] = 10;
$config['smtp_helo_host'] = 'localhost';
EOF

chown www-data:www-data config.inc.php
chmod 644 config.inc.php

echo "✅ Config teljesen újraírva (SMTP auth nélkül)"
php -l config.inc.php
echo ""
grep -E 'smtp_server|smtp_port|smtp_user|smtp_pass' config.inc.php

