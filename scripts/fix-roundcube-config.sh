#!/bin/bash

# Roundcube konfiguráció javítása

cd /etc/roundcube

DES_KEY=$(openssl rand -base64 24 | tr -d '\n')

cat > config.inc.php << EOF
<?php
\$config = array();
\$config['default_host'] = 'localhost';
\$config['default_port'] = 143;
\$config['smtp_server'] = 'localhost';
\$config['smtp_port'] = 587;
\$config['smtp_user'] = '%u';
\$config['smtp_pass'] = '%p';
\$config['des_key'] = '${DES_KEY}';
\$config['product_name'] = 'ZedinGamingHosting Webmail';
\$config['plugins'] = array('archive', 'zipdownload');
\$config['enable_installer'] = false;
EOF

chmod 644 config.inc.php
echo "✅ Roundcube konfiguráció javítva"

