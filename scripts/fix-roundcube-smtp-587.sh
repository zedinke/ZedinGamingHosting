#!/bin/bash

# Roundcube SMTP config javítása (port 587)

cd /usr/share/roundcube/config

# SMTP port módosítása 587-re
sed -i "s/\$config['smtp_port'] = 25;/\$config['smtp_port'] = 587;/" config.inc.php

echo "✅ SMTP port módosítva 587-re"
echo ""
echo "=== Config ellenőrzése ==="
grep -E 'smtp_server|smtp_port|smtp_user|smtp_pass|smtp_auth' config.inc.php

