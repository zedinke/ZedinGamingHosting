#!/bin/bash

# Roundcube username filter javítása

cd /usr/share/roundcube/config

# Config fájl javítása - username filter hozzáadása
cat >> config.inc.php << 'EOF'

// Felhasználónév domain rész eltávolítása
$config['login_username_filter'] = function($username) {
    if (strpos($username, '@') !== false) {
        return substr($username, 0, strpos($username, '@'));
    }
    return $username;
};
EOF

echo "✅ Username filter hozzáadva"
tail -8 config.inc.php

