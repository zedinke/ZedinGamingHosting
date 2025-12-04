#!/bin/bash

# ============================================================================
# ZED Gaming Hosting - Game Server Database Population Script
# ============================================================================
# Ez a script az összes szerver definíciót beviszi a MySQL adatbázisba
# ============================================================================

# DB Credentials
DB_HOST="116.203.226.140"
DB_USER="ZedGamingHosting_Zedin"
DB_PASS="Gele007ta..."
DB_NAME="ZedGamingHosting_gamingportal"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}ZED Gaming Hosting - Game Server Database Population${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════════${NC}"

# Test DB connection
echo -e "${YELLOW}[1/5] Database kapcsolat tesztelése...${NC}"
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" -e "SELECT 1" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Sikeresen csatlakozva az adatbázishoz${NC}"
else
    echo -e "${RED}✗ Nem sikerült csatlakozni az adatbázishoz!${NC}"
    exit 1
fi

# Létezik a gamePackages tábla?
echo -e "${YELLOW}[2/5] Database séma ellenőrzése...${NC}"
SCHEMA=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW TABLES LIKE 'gamePackages';" 2>/dev/null | grep gamePackages)

if [ -z "$SCHEMA" ]; then
    echo -e "${YELLOW}  - gamePackages tábla nem található, létrehozás...${NC}"
    
    mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" << 'EOFSCHEMA'
CREATE TABLE IF NOT EXISTS gamePackages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    gameType VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    imageUrl VARCHAR(500),
    youtubeTrailerId VARCHAR(100),
    maxPlayers INT DEFAULT 32,
    basePrice DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gameServerConfigs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    packageId INT NOT NULL,
    slotCount INT DEFAULT 32,
    ramMB INT DEFAULT 4096,
    vCPU INT DEFAULT 4,
    storageGB INT DEFAULT 50,
    monthlyPrice DECIMAL(10, 2) DEFAULT 5.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (packageId) REFERENCES gamePackages(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS gamePremiumBundles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    imageUrl VARCHAR(500),
    basePrice DECIMAL(10, 2) DEFAULT 0,
    package1Id INT NOT NULL,
    package2Id INT NOT NULL,
    package3Id INT NOT NULL,
    maxSlots INT DEFAULT 32,
    maxRamMB INT DEFAULT 16384,
    maxVCPU INT DEFAULT 16,
    discountPercent INT DEFAULT 15,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (package1Id) REFERENCES gamePackages(id),
    FOREIGN KEY (package2Id) REFERENCES gamePackages(id),
    FOREIGN KEY (package3Id) REFERENCES gamePackages(id)
);
EOFSCHEMA
    
    echo -e "${GREEN}✓ Database séma létrehozva${NC}"
else
    echo -e "${GREEN}✓ Database séma OK${NC}"
fi

# SQL Insert utasítások generálása
echo -e "${YELLOW}[3/5] SQL INSERT utasítások generálása...${NC}"

SQL_FILE="/tmp/game_servers_insert.sql"

cat > "$SQL_FILE" << 'EOFSQL'
-- ============================================================================
-- CALL OF DUTY SERIES
-- ============================================================================

INSERT INTO gamePackages (name, slug, gameType, description, imageUrl, youtubeTrailerId, maxPlayers, basePrice) VALUES
('Call of Duty: Modern Warfare 2024', 'cod-mw-2024', 'COD_MODERN_WARFARE_2024', 'A legújabb Call of Duty: Modern Warfare szerver - 2024-es kiadás. Intenzív multiplayer gameplay, Warzone támogatás.', 'https://images.unsplash.com/photo-1552820728-8ac54c3a90f7?w=500&h=300', 'trailer_mw_2024', 32, 9.99),
('Call of Duty: Warzone 2.0', 'cod-warzone-2', 'COD_WARZONE_2', 'Az ingyenes battle royale mód a Modern Warfare II-ből. Akár 150 játékos egy térképen. Nagyobb szerver igények.', 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300', 'trailer_warzone_2', 150, 0.00),
('Call of Duty: Black Ops 6', 'cod-bo6', 'COD_BLACK_OPS_6', 'Black Ops 6 szerver - Intenzív akció, zombik mód, multiplayer. Klasszikus CoD élmény.', 'https://images.unsplash.com/photo-1535307671172-3ce80c79c1f7?w=500&h=300', 'trailer_bo6', 32, 8.99),
('Call of Duty: Black Ops Cold War', 'cod-cold-war', 'COD_COLD_WAR', '80-as évek hangulatú multiplayer, zombik módban kooperatív gameplay.', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&h=300', 'trailer_coldwar', 32, 7.99),
('Call of Duty: Vanguard', 'cod-vanguard', 'COD_VANGUARD', 'II. világháborús Call of Duty szerver. Történelmi tematika, gyors paced multiplayer.', 'https://images.unsplash.com/photo-1542751110-c2d5e1c41f15?w=500&h=300', 'trailer_vanguard', 32, 6.99),
('Call of Duty: Infinite Warfare', 'cod-iw', 'COD_INFINITE_WARFARE', 'Futurisztikus Call of Duty - űr akció, lézerfegyverek, sci-fi ambiente.', 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300', 'trailer_iw', 32, 5.99);

-- ============================================================================
-- COUNTER-STRIKE SERIES
-- ============================================================================

INSERT INTO gamePackages (name, slug, gameType, description, imageUrl, youtubeTrailerId, maxPlayers, basePrice) VALUES
('Counter-Strike 2', 'cs2', 'CS2', 'Az új Counter-Strike 2 szerver - CS:GO utódja. Feltöltött grafikák, új mechaniká, professzionális esports title.', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&h=300', 'trailer_cs2', 32, 4.99),
('Counter-Strike: Global Offensive (Legacy)', 'csgo', 'CSGO', 'Counter-Strike: Global Offensive - A klasszikus esports szerver. Még aktív közösség.', 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300', 'trailer_csgo', 32, 3.99),
('Counter-Strike: Source', 'cs-source', 'CS_SOURCE', 'Counter-Strike: Source szerver - Klasszikus szórakoztató mód. Kis erőforrás igény, barát közösség.', 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300', 'trailer_cs_source', 32, 2.99),
('Counter-Strike 1.6', 'cs-16', 'CS_1_6', 'Counter-Strike 1.6 szerver - Az eredeti Counter-Strike! Nosztalgikus gaming, aktív modding közösség.', 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300', 'trailer_cs16', 32, 1.99);

-- ============================================================================
-- TOP 30 STEAM GAMES
-- ============================================================================

INSERT INTO gamePackages (name, slug, gameType, description, imageUrl, youtubeTrailerId, maxPlayers, basePrice) VALUES
('Dota 2', 'dota-2', 'DOTA_2', 'Ingyenes MOBA csodaország. 5v5 intenzív csapatok, 100+ hős, végtelenül tanulható. Esports profi szint.', 'https://images.unsplash.com/photo-1579356330388-a51bb0b78f6c?w=500&h=300', 'trailer_dota2', 10, 0.00),
('PUBG: Battlegrounds', 'pubg', 'PUBG', 'Battle royale klasszikus! 100 játékos egy szörnyet térképen. Loot, build, survive, win!', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&h=300', 'trailer_pubg', 100, 0.00),
('Rust', 'rust', 'RUST', 'Survival sandbox MMO. Túléléstől a base-buildingig. PvP, raiding, erőforrás menedzsment. Intenzív gameplay.', 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300', 'trailer_rust', 300, 19.99),
('Team Fortress 2', 'tf2', 'TF2', 'Ingyenes klasszikus FPS! 9 klasa, sokat módosított szerver. Retro gaming, közösség-vezérelt.', 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300', 'trailer_tf2', 32, 0.00),
('Left 4 Dead 2', 'left-4-dead-2', 'L4D2', 'Kooperatív zombie szurvaival! 4 játékos a hordák ellen. Klasszikus coop horror FPS.', 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300', 'trailer_l4d2', 8, 9.99),
("Garry's Mod", 'garrys-mod', 'GARRYSMOD', "Sandbox szerver - Szerverek, tűzpálya, machinima. Végtelenül módosítható, kreatív közösség.", 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300', 'trailer_gmod', 64, 9.99),
('Valheim', 'valheim', 'VALHEIM', 'Kooperatív Viking szurvial! Építs, harcolj, fedezz fel. Vikings a szükségletből.', 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300', 'trailer_valheim', 10, 19.99),
('Minecraft Java Edition', 'minecraft-java', 'MINECRAFT_JAVA', 'Az eredeti Minecraft szerver. Survival, Creative, Adventure módok. Végtelenül módosítható.', 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300', 'trailer_minecraft', 128, 2.99),
('Factorio', 'factorio', 'FACTORIO', 'Kooperatív factory szerver! Építs, optimalizálj, automat. Ipari evolúció.', 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300', 'trailer_factorio', 255, 24.99),
('The Forest', 'the-forest', 'THE_FOREST', 'Kooperatív szurvival horror! Erdőben, fenyegetésekkel. Rejtélyes és félelmetes.', 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300', 'trailer_theforest', 4, 19.99),
('Terraria', 'terraria', 'TERRARIA', '2D pixel action-adventure szerver! Bányászat, craftálás, minibossok, bosses.', 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300', 'trailer_terraria', 255, 14.99),
('Stardew Valley', 'stardew-valley', 'STARDEW_VALLEY', 'Kooperatív farm-sim szerver! Farmaold, halászz, bányászz, közösséggel lépj kapcsolatba.', 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300', 'trailer_stardewvalley', 4, 14.99),
('Portal 2', 'portal-2', 'PORTAL_2', 'Kooperatív puzzle-platformer! 2 robot az AI által ellenséges intézményben.', 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300', 'trailer_portal2', 2, 19.99),
("Don't Starve Together", 'dont-starve-together', 'DONT_STARVE_TOGETHER', "Kooperatív szurvival roguelike! Ismeretlen világban, sötétség és éhezés elleni harcok.", 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300', 'trailer_dstaytogether', 6, 14.99),
('Satisfactory', 'satisfactory', 'SATISFACTORY', 'Kooperatív szervezési szkalavív! Idegenbolyó, erőforrások, gyárak, automatizálás.', 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300', 'trailer_satisfactory', 4, 29.99),
('Grounded', 'grounded', 'GROUNDED', 'Kooperatív szurvival kaland! Szúnyog nagyságúak egy árok világában. Rejtélyes és kalandusos.', 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300', 'trailer_grounded', 4, 19.99),
('Subnautica', 'subnautica', 'SUBNAUTICA', 'Tengeri szurvival abentúra! Víz alatti bolygó felfedezése, alapépítés, rejtélyesen.', 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300', 'trailer_subnautica', 1, 24.99),
('Deep Rock Galactic', 'deep-rock-galactic', 'DEEP_ROCK_GALACTIC', 'Kooperatív kőzet-bányászat akció! Dwarf kőzethöz, robotokhoz, felderítéshez.', 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300', 'trailer_drg', 4, 29.99),
('Project Zomboid', 'project-zomboid', 'PROJECT_ZOMBOID', 'Kooperatív zombie szurvival szimulációs! Realisztikus, isometrikus, nehéz.', 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300', 'trailer_projectzomboid', 4, 14.99),
('Lethal Company', 'lethal-company', 'LETHAL_COMPANY', 'Kooperatív sci-fi horror! Cég megbízásaiból dolgozz, de vigyázz az összeomlás-okra.', 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300', 'trailer_lethalcompany', 4, 7.99),
('Phasmophobia', 'phasmophobia', 'PHASMOPHOBIA', 'Kooperatív szellem-hunting horror! Szellemi nyomozók legyek, bizonyítékot gyűjtsd.', 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300', 'trailer_phasmophobia', 4, 13.99),
('It Takes Two', 'it-takes-two', 'IT_TAKES_TWO', 'Kooperatív splitscreen kaland! Párok játékának szövegében, szereteted visszaállítani.', 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300', 'trailer_ittakestwo', 2, 29.99),
('A Way Out', 'a-way-out', 'A_WAY_OUT', 'Kooperatív börtön-szökési thriller! Két rab szabadulási kaland.', 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300', 'trailer_awayout', 2, 19.99),
('Raft', 'raft', 'RAFT', 'Kooperatív tengeri szurvival! Óceán közepén, összeomló világban, zátonyon laktak.', 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300', 'trailer_raft', 4, 19.99),
('Core Keeper', 'core-keeper', 'CORE_KEEPER', 'Kooperatív 2D bányászás-abentúra! Apró személyeknél, föld alatt, szörnyekhez, kincshez.', 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300', 'trailer_corekeeper', 8, 9.99),
('Paleo Pines', 'paleo-pines', 'PALEO_PINES', 'Kooperatív farm-sim dinoszauruszokkal! Dinók gondozása, farmaság, közösség.', 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300', 'trailer_paleopines', 4, 19.99),
('Spiritfarer', 'spiritfarer', 'SPIRITFARER', 'Kooperatív hand-drawn kaland! Hajóvezetőjként, lelkek szállítása a halál után.', 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300', 'trailer_spiritfarer', 2, 19.99),
('Ready or Not', 'ready-or-not', 'READY_OR_NOT', 'Kooperatív taktikai SWAT szimulációs! Rendőrséggel, felderítéssel, megvetéssel.', 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300', 'trailer_readyornot', 8, 29.99),
('Killing Floor 2', 'killing-floor-2', 'KILLING_FLOOR_2', 'Kooperatív zombie-apoka FPS! Wave-based, zárványok, brutális akció.', 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300', 'trailer_kf2', 6, 14.99);

-- ============================================================================
-- GAME SERVER CONFIGURATIONS (Standard Packages) - +20% above minimum
-- ============================================================================

INSERT INTO gameServerConfigs (packageId, slotCount, ramMB, vCPU, storageGB, monthlyPrice) 
SELECT id, 32, ROUND(5120 * 1.2), 4, 100, 9.99 FROM gamePackages WHERE slug = 'cod-mw-2024';

INSERT INTO gameServerConfigs (packageId, slotCount, ramMB, vCPU, storageGB, monthlyPrice)
SELECT id, 150, ROUND(8192 * 1.2), 6, 200, 14.99 FROM gamePackages WHERE slug = 'cod-warzone-2';

INSERT INTO gameServerConfigs (packageId, slotCount, ramMB, vCPU, storageGB, monthlyPrice)
SELECT id, 32, ROUND(5120 * 1.2), 4, 100, 8.99 FROM gamePackages WHERE slug = 'cod-bo6';

INSERT INTO gameServerConfigs (packageId, slotCount, ramMB, vCPU, storageGB, monthlyPrice)
SELECT id, 32, ROUND(4096 * 1.2), 4, 100, 7.99 FROM gamePackages WHERE slug = 'cod-cold-war';

INSERT INTO gameServerConfigs (packageId, slotCount, ramMB, vCPU, storageGB, monthlyPrice)
SELECT id, 32, ROUND(4096 * 1.2), 4, 100, 6.99 FROM gamePackages WHERE slug = 'cod-vanguard';

INSERT INTO gameServerConfigs (packageId, slotCount, ramMB, vCPU, storageGB, monthlyPrice)
SELECT id, 32, ROUND(4096 * 1.2), 4, 100, 5.99 FROM gamePackages WHERE slug = 'cod-iw';

-- Counter-Strike configs
INSERT INTO gameServerConfigs (packageId, slotCount, ramMB, vCPU, storageGB, monthlyPrice)
SELECT id, 32, ROUND(3072 * 1.2), 4, 50, 4.99 FROM gamePackages WHERE slug = 'cs2';

INSERT INTO gameServerConfigs (packageId, slotCount, ramMB, vCPU, storageGB, monthlyPrice)
SELECT id, 32, ROUND(2048 * 1.2), 2, 50, 3.99 FROM gamePackages WHERE slug = 'csgo';

INSERT INTO gameServerConfigs (packageId, slotCount, ramMB, vCPU, storageGB, monthlyPrice)
SELECT id, 32, ROUND(1536 * 1.2), 2, 50, 2.99 FROM gamePackages WHERE slug = 'cs-source';

INSERT INTO gameServerConfigs (packageId, slotCount, ramMB, vCPU, storageGB, monthlyPrice)
SELECT id, 32, ROUND(512 * 1.2), 1, 30, 1.99 FROM gamePackages WHERE slug = 'cs-16';

-- Top 30 Steam Games configs
INSERT INTO gameServerConfigs (packageId, slotCount, ramMB, vCPU, storageGB, monthlyPrice)
SELECT id, 10, ROUND(2048 * 1.2), 2, 50, 2.99 FROM gamePackages WHERE slug = 'dota-2';

INSERT INTO gameServerConfigs (packageId, slotCount, ramMB, vCPU, storageGB, monthlyPrice)
SELECT id, 100, ROUND(6144 * 1.2), 6, 150, 9.99 FROM gamePackages WHERE slug = 'pubg';

INSERT INTO gameServerConfigs (packageId, slotCount, ramMB, vCPU, storageGB, monthlyPrice)
SELECT id, 300, ROUND(8192 * 1.2), 8, 300, 19.99 FROM gamePackages WHERE slug = 'rust';

INSERT INTO gameServerConfigs (packageId, slotCount, ramMB, vCPU, storageGB, monthlyPrice)
SELECT id, 32, ROUND(2048 * 1.2), 2, 50, 0 FROM gamePackages WHERE slug = 'tf2';

INSERT INTO gameServerConfigs (packageId, slotCount, ramMB, vCPU, storageGB, monthlyPrice)
SELECT id, 8, ROUND(2048 * 1.2), 2, 50, 9.99 FROM gamePackages WHERE slug = 'left-4-dead-2';

INSERT INTO gameServerConfigs (packageId, slotCount, ramMB, vCPU, storageGB, monthlyPrice)
SELECT id, 64, ROUND(2048 * 1.2), 2, 100, 9.99 FROM gamePackages WHERE slug = 'garrys-mod';

INSERT INTO gameServerConfigs (packageId, slotCount, ramMB, vCPU, storageGB, monthlyPrice)
SELECT id, 10, ROUND(2048 * 1.2), 2, 50, 19.99 FROM gamePackages WHERE slug = 'valheim';

INSERT INTO gameServerConfigs (packageId, slotCount, ramMB, vCPU, storageGB, monthlyPrice)
SELECT id, 128, ROUND(1024 * 1.2), 1, 100, 2.99 FROM gamePackages WHERE slug = 'minecraft-java';

INSERT INTO gameServerConfigs (packageId, slotCount, ramMB, vCPU, storageGB, monthlyPrice)
SELECT id, 255, ROUND(2048 * 1.2), 2, 150, 24.99 FROM gamePackages WHERE slug = 'factorio';

INSERT INTO gameServerConfigs (packageId, slotCount, ramMB, vCPU, storageGB, monthlyPrice)
SELECT id, 4, ROUND(4096 * 1.2), 4, 100, 19.99 FROM gamePackages WHERE slug = 'the-forest';

INSERT INTO gameServerConfigs (packageId, slotCount, ramMB, vCPU, storageGB, monthlyPrice)
SELECT id, 255, ROUND(512 * 1.2), 1, 100, 14.99 FROM gamePackages WHERE slug = 'terraria';

INSERT INTO gameServerConfigs (packageId, slotCount, ramMB, vCPU, storageGB, monthlyPrice)
SELECT id, 4, ROUND(512 * 1.2), 1, 50, 14.99 FROM gamePackages WHERE slug = 'stardew-valley';

INSERT INTO gameServerConfigs (packageId, slotCount, ramMB, vCPU, storageGB, monthlyPrice)
SELECT id, 2, ROUND(2048 * 1.2), 2, 50, 19.99 FROM gamePackages WHERE slug = 'portal-2';

INSERT INTO gameServerConfigs (packageId, slotCount, ramMB, vCPU, storageGB, monthlyPrice)
SELECT id, 6, ROUND(1024 * 1.2), 2, 50, 14.99 FROM gamePackages WHERE slug = 'dont-starve-together';

INSERT INTO gameServerConfigs (packageId, slotCount, ramMB, vCPU, storageGB, monthlyPrice)
SELECT id, 4, ROUND(4096 * 1.2), 4, 100, 29.99 FROM gamePackages WHERE slug = 'satisfactory';

INSERT INTO gameServerConfigs (packageId, slotCount, ramMB, vCPU, storageGB, monthlyPrice)
SELECT id, 4, ROUND(4096 * 1.2), 4, 100, 19.99 FROM gamePackages WHERE slug = 'grounded';

INSERT INTO gameServerConfigs (packageId, slotCount, ramMB, vCPU, storageGB, monthlyPrice)
SELECT id, 1, ROUND(4096 * 1.2), 4, 100, 24.99 FROM gamePackages WHERE slug = 'subnautica';

INSERT INTO gameServerConfigs (packageId, slotCount, ramMB, vCPU, storageGB, monthlyPrice)
SELECT id, 4, ROUND(2048 * 1.2), 4, 80, 29.99 FROM gamePackages WHERE slug = 'deep-rock-galactic';

INSERT INTO gameServerConfigs (packageId, slotCount, ramMB, vCPU, storageGB, monthlyPrice)
SELECT id, 4, ROUND(2048 * 1.2), 2, 80, 14.99 FROM gamePackages WHERE slug = 'project-zomboid';

INSERT INTO gameServerConfigs (packageId, slotCount, ramMB, vCPU, storageGB, monthlyPrice)
SELECT id, 4, ROUND(2048 * 1.2), 2, 50, 7.99 FROM gamePackages WHERE slug = 'lethal-company';

INSERT INTO gameServerConfigs (packageId, slotCount, ramMB, vCPU, storageGB, monthlyPrice)
SELECT id, 4, ROUND(4096 * 1.2), 4, 100, 13.99 FROM gamePackages WHERE slug = 'phasmophobia';

INSERT INTO gameServerConfigs (packageId, slotCount, ramMB, vCPU, storageGB, monthlyPrice)
SELECT id, 2, ROUND(4096 * 1.2), 4, 100, 29.99 FROM gamePackages WHERE slug = 'it-takes-two';

INSERT INTO gameServerConfigs (packageId, slotCount, ramMB, vCPU, storageGB, monthlyPrice)
SELECT id, 2, ROUND(4096 * 1.2), 4, 100, 19.99 FROM gamePackages WHERE slug = 'a-way-out';

INSERT INTO gameServerConfigs (packageId, slotCount, ramMB, vCPU, storageGB, monthlyPrice)
SELECT id, 4, ROUND(2048 * 1.2), 2, 80, 19.99 FROM gamePackages WHERE slug = 'raft';

INSERT INTO gameServerConfigs (packageId, slotCount, ramMB, vCPU, storageGB, monthlyPrice)
SELECT id, 8, ROUND(1024 * 1.2), 2, 50, 9.99 FROM gamePackages WHERE slug = 'core-keeper';

INSERT INTO gameServerConfigs (packageId, slotCount, ramMB, vCPU, storageGB, monthlyPrice)
SELECT id, 4, ROUND(2048 * 1.2), 2, 50, 19.99 FROM gamePackages WHERE slug = 'paleo-pines';

INSERT INTO gameServerConfigs (packageId, slotCount, ramMB, vCPU, storageGB, monthlyPrice)
SELECT id, 2, ROUND(2048 * 1.2), 2, 50, 19.99 FROM gamePackages WHERE slug = 'spiritfarer';

INSERT INTO gameServerConfigs (packageId, slotCount, ramMB, vCPU, storageGB, monthlyPrice)
SELECT id, 8, ROUND(6144 * 1.2), 6, 100, 29.99 FROM gamePackages WHERE slug = 'ready-or-not';

INSERT INTO gameServerConfigs (packageId, slotCount, ramMB, vCPU, storageGB, monthlyPrice)
SELECT id, 6, ROUND(4096 * 1.2), 4, 100, 14.99 FROM gamePackages WHERE slug = 'killing-floor-2';

EOFSQL

echo -e "${GREEN}✓ SQL INSERT fájl generálva${NC}"

# SQL fájl feltöltése az adatbázisba
echo -e "${YELLOW}[4/5] Adatbázis feltöltése...${NC}"

mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$SQL_FILE" 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Adatbázis sikeresen feltöltve${NC}"
else
    echo -e "${RED}✗ Hiba az adatbázis feltöltésénél!${NC}"
    exit 1
fi

# Ellenőrzés - hány játék lett beszúrva?
echo -e "${YELLOW}[5/5] Ellenőrzés...${NC}"

GAME_COUNT=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -sN -e "SELECT COUNT(*) FROM gamePackages;" 2>/dev/null)

if [ ! -z "$GAME_COUNT" ]; then
    echo -e "${GREEN}✓ Sikeresen beszúrva: $GAME_COUNT játékcsomag${NC}"
else
    echo -e "${YELLOW}  (Ellenőrzés sikertelen - lehet már léteznek)${NC}"
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Teljesítve! Az összes szerver definíció az adatbázisban van.${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════════${NC}"

# Cleanup
rm -f "$SQL_FILE"

exit 0
