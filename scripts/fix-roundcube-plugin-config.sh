#!/bin/bash

# Roundcube plugin config frissítése

cd /usr/share/roundcube/config

# Plugins frissítése
sed -i "s/\$config['plugins'] = array('archive', 'zipdownload');/\$config['plugins'] = array('archive', 'zipdownload', 'username_filter');/" config.inc.php

echo "✅ Plugin hozzáadva a config-hoz"
grep plugins config.inc.php

