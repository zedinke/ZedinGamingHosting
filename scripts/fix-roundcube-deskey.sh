#!/bin/bash

# Roundcube DES key frissítése

cd /etc/roundcube

DES_KEY=$(openssl rand -base64 24 | tr -d '\n')

python3 << PYTHONEND
import re

with open('config.inc.php', 'r') as f:
    content = f.read()

# DES key frissítése
content = re.sub(
    r"\$config\['des_key'\] = '.*'",
    f"\$config['des_key'] = '{DES_KEY}'",
    content
)

with open('config.inc.php', 'w') as f:
    f.write(content)

print('✅ DES key frissítve')
PYTHONEND

echo ""
echo "✅ Roundcube konfiguráció kész!"

