#!/bin/bash

# Roundcube installer config javítása

cd /usr/share/roundcube/config

# Config fájl javítása
sed -i "s/\$config\['enable_installer' = false;/\$config['enable_installer'] = false;/" config.inc.php

echo "✅ Config javítva"
grep enable_installer config.inc.php

