#!/bin/bash

# Adatbázis információk
DB_HOST="116.203.226.140"
DB_USER="ZedGamingHosting_Zedin"
DB_PASS="Gele007ta..."
DB_NAME="ZedGamingHosting_gamingportal"

# Csatlakozás az adatbázishoz és lekérés az existing game packages-ből
mysql -h $DB_HOST -u $DB_USER -p$DB_PASS $DB_NAME << EOF

-- Lemezre exportáljuk az összes game packagest és servereket
SELECT 'Existing GamePackages:' as info;
SELECT id, name, description, gameType, maxPlayers, recommendedRAM, recommendedVCPU, basePrice FROM GamePackage LIMIT 50;

SELECT 'Existing ServerConfigs:' as info;
SELECT id, gameType, name FROM ServerConfig LIMIT 50;

SELECT 'Existing Games:' as info;
SELECT id, name, description FROM Game LIMIT 50;

EOF
