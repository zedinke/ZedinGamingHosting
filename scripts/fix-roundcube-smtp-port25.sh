#!/bin/bash

# Roundcube SMTP port módosítása 25-re

cd /usr/share/roundcube/config

# SMTP port módosítása 25-re
sed -i "s/\$config['smtp_port'] = 587;/\$config['smtp_port'] = 25;/" config.inc.php

echo "✅ SMTP port módosítva 25-re"
grep smtp_port config.inc.php
