#!/usr/bin/env python3

import re

config_file = '/usr/share/roundcube/config/config.inc.php'

with open(config_file, 'r') as f:
    content = f.read()

# SMTP port módosítása 587-re
content = re.sub(r"\$config\['smtp_port'\] = \d+;", "$config['smtp_port'] = 587;", content)

with open(config_file, 'w') as f:
    f.write(content)

print('✅ SMTP port módosítva 587-re')

