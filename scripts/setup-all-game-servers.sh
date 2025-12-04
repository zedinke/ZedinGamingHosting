#!/bin/bash

# ============================================================================
# ZED Gaming Hosting - COMPLETE GAME SERVER DATABASE & SETUP ORCHESTRATOR
# ============================================================================
# Ez a master script futtatja az összes szükséges telepítést
# ============================================================================

set -e  # Exit on error

# Konfigurálás
DB_HOST="116.203.226.140"
DB_USER="ZedGamingHosting_Zedin"
DB_PASS="Gele007ta..."
DB_NAME="ZedGamingHosting_gamingportal"

# Színek
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Szintek
STEP=0
TOTAL_STEPS=5

# ===========================================================================
# FUNCTIONS
# ===========================================================================

print_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
}

print_step() {
    STEP=$((STEP + 1))
    echo ""
    echo -e "${YELLOW}[${STEP}/${TOTAL_STEPS}] $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# ===========================================================================
# MAIN EXECUTION
# ===========================================================================

print_header "ZED GAMING HOSTING - GAME SERVER SETUP"
print_info "Master orchestrator script - Game package database population"
print_info "Database: $DB_NAME on $DB_HOST"

# Step 1: Database connection test
print_step "Adatbázis-kapcsolat tesztelése"

if ! mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" -e "SELECT 1" > /dev/null 2>&1; then
    print_error "Nem sikerült csatlakozni az adatbázishoz!"
    exit 1
fi

print_success "Adatbázis-kapcsolat OK"

# Step 2: Check if tables exist, create if needed
print_step "Database séma ellenőrzése és létrehozása"

# Create tables if they don't exist
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" << 'EOFSCHEMA' 2>/dev/null

-- Create gamePackages table
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create gameServerConfigs table
CREATE TABLE IF NOT EXISTS gameServerConfigs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    packageId INT NOT NULL,
    slotCount INT DEFAULT 32,
    ramMB INT DEFAULT 4096,
    vCPU INT DEFAULT 4,
    storageGB INT DEFAULT 50,
    monthlyPrice DECIMAL(10, 2) DEFAULT 5.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (packageId) REFERENCES gamePackages(id) ON DELETE CASCADE,
    UNIQUE KEY unique_package_config (packageId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create gamePremiumBundles table
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (package1Id) REFERENCES gamePackages(id),
    FOREIGN KEY (package2Id) REFERENCES gamePackages(id),
    FOREIGN KEY (package3Id) REFERENCES gamePackages(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create gameInstallationLog table (tracking)
CREATE TABLE IF NOT EXISTS gameInstallationLog (
    id INT PRIMARY KEY AUTO_INCREMENT,
    packageId INT,
    serverId VARCHAR(255),
    status VARCHAR(50),
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (packageId) REFERENCES gamePackages(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

EOFSCHEMA

if [ $? -eq 0 ]; then
    print_success "Database séma OK"
else
    print_error "Database séma létrehozása sikertelen!"
    exit 1
fi

# Step 3: Populate game packages
print_step "Szerver csomagok feltöltése (30+ játék)"

GAMES_SQL=$(cat << 'EOFSQL'

-- ============================================================================
-- CALL OF DUTY SERIES
-- ============================================================================

INSERT IGNORE INTO gamePackages (name, slug, gameType, description, imageUrl, youtubeTrailerId, maxPlayers, basePrice) VALUES
('Call of Duty: Modern Warfare 2024', 'cod-mw-2024', 'COD_MODERN_WARFARE_2024', 'A legújabb Call of Duty: Modern Warfare szerver - 2024-es kiadás. Intenzív multiplayer gameplay, Warzone támogatás.', 'https://images.unsplash.com/photo-1552820728-8ac54c3a90f7?w=500&h=300', 'trailer_mw_2024', 32, 9.99),
('Call of Duty: Warzone 2.0', 'cod-warzone-2', 'COD_WARZONE_2', 'Az ingyenes battle royale mód a Modern Warfare II-ből. Akár 150 játékos egy térképen. Nagyobb szerver igények.', 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300', 'trailer_warzone_2', 150, 0.00),
('Call of Duty: Black Ops 6', 'cod-bo6', 'COD_BLACK_OPS_6', 'Black Ops 6 szerver - Intenzív akció, zombik mód, multiplayer. Klasszikus CoD élmény.', 'https://images.unsplash.com/photo-1535307671172-3ce80c79c1f7?w=500&h=300', 'trailer_bo6', 32, 8.99),
('Call of Duty: Black Ops Cold War', 'cod-cold-war', 'COD_COLD_WAR', '80-as évek hangulatú multiplayer, zombik módban kooperatív gameplay.', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&h=300', 'trailer_coldwar', 32, 7.99),
('Call of Duty: Vanguard', 'cod-vanguard', 'COD_VANGUARD', 'II. világháborús Call of Duty szerver. Történelmi tematika, gyors paced multiplayer.', 'https://images.unsplash.com/photo-1542751110-c2d5e1c41f15?w=500&h=300', 'trailer_vanguard', 32, 6.99),
('Call of Duty: Infinite Warfare', 'cod-iw', 'COD_INFINITE_WARFARE', 'Futurisztikus Call of Duty - űr akció, lézerfegyverek, sci-fi ambiente.', 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300', 'trailer_iw', 32, 5.99);

-- ============================================================================
-- COUNTER-STRIKE SERIES
-- ============================================================================

INSERT IGNORE INTO gamePackages (name, slug, gameType, description, imageUrl, youtubeTrailerId, maxPlayers, basePrice) VALUES
('Counter-Strike 2', 'cs2', 'CS2', 'Az új Counter-Strike 2 szerver - CS:GO utódja. Feltöltött grafikák, új mechaniká, professzionális esports title.', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&h=300', 'trailer_cs2', 32, 4.99),
('Counter-Strike: Global Offensive (Legacy)', 'csgo', 'CSGO', 'Counter-Strike: Global Offensive - A klasszikus esports szerver. Még aktív közösség.', 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300', 'trailer_csgo', 32, 3.99),
('Counter-Strike: Source', 'cs-source', 'CS_SOURCE', 'Counter-Strike: Source szerver - Klasszikus szórakoztató mód. Kis erőforrás igény, barát közösség.', 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300', 'trailer_cs_source', 32, 2.99),
('Counter-Strike 1.6', 'cs-16', 'CS_1_6', 'Counter-Strike 1.6 szerver - Az eredeti Counter-Strike! Nosztalgikus gaming, aktív modding közösség.', 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300', 'trailer_cs16', 32, 1.99);

-- ============================================================================
-- TOP 30 STEAM GAMES
-- ============================================================================

INSERT IGNORE INTO gamePackages (name, slug, gameType, description, imageUrl, youtubeTrailerId, maxPlayers, basePrice) VALUES
('Dota 2', 'dota-2', 'DOTA_2', 'Ingyenes MOBA csodaország. 5v5 intenzív csapatok, 100+ hős, végtelenül tanulható. Esports profi szint.', 'https://images.unsplash.com/photo-1579356330388-a51bb0b78f6c?w=500&h=300', 'trailer_dota2', 10, 0.00),
('PUBG: Battlegrounds', 'pubg', 'PUBG', 'Battle royale klasszikus! 100 játékos egy szörnyet térképen. Loot, build, survive, win!', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&h=300', 'trailer_pubg', 100, 0.00),
('Rust', 'rust', 'RUST', 'Survival sandbox MMO. Túléléstől a base-buildingig. PvP, raiding, erőforrás menedzsment. Intenzív gameplay.', 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300', 'trailer_rust', 300, 19.99),
('Team Fortress 2', 'tf2', 'TF2', 'Ingyenes klasszikus FPS! 9 klasa, sokat módosított szerver. Retro gaming, közösség-vezérelt.', 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300', 'trailer_tf2', 32, 0.00),
('Left 4 Dead 2', 'left-4-dead-2', 'L4D2', 'Kooperatív zombie szurvaival! 4 játékos a hordák ellen. Klasszikus coop horror FPS.', 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300', 'trailer_l4d2', 8, 9.99),
("Garry's Mod", 'garrys-mod', 'GARRYSMOD', "Sandbox szerver - Szerverek, tűzpálya, machinima. Végtelenül módosítható, kreatív közösség.", 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300', 'trailer_gmod', 64, 9.99),
('Valheim', 'valheim', 'VALHEIM', 'Kooperatív Viking szurvival! Építs, harcolj, fedezz fel. Vikings a szükségletből.', 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300', 'trailer_valheim', 10, 19.99),
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

EOFSQL
)

echo "$GAMES_SQL" | mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" 2>/dev/null

GAME_COUNT=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -sN -e "SELECT COUNT(*) FROM gamePackages;" 2>/dev/null)
print_success "Szerver csomagok feltöltve: $GAME_COUNT játék"

# Step 4: Populate server configurations
print_step "Szerver konfigurációk feltöltése (+20% erőforrások)"

CONFIG_SQL=$(cat << 'EOFSQL'

-- Call of Duty configs
INSERT IGNORE INTO gameServerConfigs (packageId, slotCount, ramMB, vCPU, storageGB, monthlyPrice)
SELECT id, 32, ROUND(5120 * 1.2), 4, 100, 9.99 FROM gamePackages WHERE slug = 'cod-mw-2024'
UNION ALL
SELECT id, 150, ROUND(8192 * 1.2), 6, 200, 14.99 FROM gamePackages WHERE slug = 'cod-warzone-2'
UNION ALL
SELECT id, 32, ROUND(5120 * 1.2), 4, 100, 8.99 FROM gamePackages WHERE slug = 'cod-bo6'
UNION ALL
SELECT id, 32, ROUND(4096 * 1.2), 4, 100, 7.99 FROM gamePackages WHERE slug = 'cod-cold-war'
UNION ALL
SELECT id, 32, ROUND(4096 * 1.2), 4, 100, 6.99 FROM gamePackages WHERE slug = 'cod-vanguard'
UNION ALL
SELECT id, 32, ROUND(4096 * 1.2), 4, 100, 5.99 FROM gamePackages WHERE slug = 'cod-iw'
UNION ALL
SELECT id, 32, ROUND(3072 * 1.2), 4, 50, 4.99 FROM gamePackages WHERE slug = 'cs2'
UNION ALL
SELECT id, 32, ROUND(2048 * 1.2), 2, 50, 3.99 FROM gamePackages WHERE slug = 'csgo'
UNION ALL
SELECT id, 32, ROUND(1536 * 1.2), 2, 50, 2.99 FROM gamePackages WHERE slug = 'cs-source'
UNION ALL
SELECT id, 32, ROUND(512 * 1.2), 1, 30, 1.99 FROM gamePackages WHERE slug = 'cs-16'
UNION ALL
SELECT id, 10, ROUND(2048 * 1.2), 2, 50, 2.99 FROM gamePackages WHERE slug = 'dota-2'
UNION ALL
SELECT id, 100, ROUND(6144 * 1.2), 6, 150, 9.99 FROM gamePackages WHERE slug = 'pubg'
UNION ALL
SELECT id, 300, ROUND(8192 * 1.2), 8, 300, 19.99 FROM gamePackages WHERE slug = 'rust'
UNION ALL
SELECT id, 32, ROUND(2048 * 1.2), 2, 50, 0 FROM gamePackages WHERE slug = 'tf2'
UNION ALL
SELECT id, 8, ROUND(2048 * 1.2), 2, 50, 9.99 FROM gamePackages WHERE slug = 'left-4-dead-2'
UNION ALL
SELECT id, 64, ROUND(2048 * 1.2), 2, 100, 9.99 FROM gamePackages WHERE slug = 'garrys-mod'
UNION ALL
SELECT id, 10, ROUND(2048 * 1.2), 2, 50, 19.99 FROM gamePackages WHERE slug = 'valheim'
UNION ALL
SELECT id, 128, ROUND(1024 * 1.2), 1, 100, 2.99 FROM gamePackages WHERE slug = 'minecraft-java'
UNION ALL
SELECT id, 255, ROUND(2048 * 1.2), 2, 150, 24.99 FROM gamePackages WHERE slug = 'factorio'
UNION ALL
SELECT id, 4, ROUND(4096 * 1.2), 4, 100, 19.99 FROM gamePackages WHERE slug = 'the-forest'
UNION ALL
SELECT id, 255, ROUND(512 * 1.2), 1, 100, 14.99 FROM gamePackages WHERE slug = 'terraria'
UNION ALL
SELECT id, 4, ROUND(512 * 1.2), 1, 50, 14.99 FROM gamePackages WHERE slug = 'stardew-valley'
UNION ALL
SELECT id, 2, ROUND(2048 * 1.2), 2, 50, 19.99 FROM gamePackages WHERE slug = 'portal-2'
UNION ALL
SELECT id, 6, ROUND(1024 * 1.2), 2, 50, 14.99 FROM gamePackages WHERE slug = 'dont-starve-together'
UNION ALL
SELECT id, 4, ROUND(4096 * 1.2), 4, 100, 29.99 FROM gamePackages WHERE slug = 'satisfactory'
UNION ALL
SELECT id, 4, ROUND(4096 * 1.2), 4, 100, 19.99 FROM gamePackages WHERE slug = 'grounded'
UNION ALL
SELECT id, 1, ROUND(4096 * 1.2), 4, 100, 24.99 FROM gamePackages WHERE slug = 'subnautica'
UNION ALL
SELECT id, 4, ROUND(2048 * 1.2), 4, 80, 29.99 FROM gamePackages WHERE slug = 'deep-rock-galactic'
UNION ALL
SELECT id, 4, ROUND(2048 * 1.2), 2, 80, 14.99 FROM gamePackages WHERE slug = 'project-zomboid'
UNION ALL
SELECT id, 4, ROUND(2048 * 1.2), 2, 50, 7.99 FROM gamePackages WHERE slug = 'lethal-company'
UNION ALL
SELECT id, 4, ROUND(4096 * 1.2), 4, 100, 13.99 FROM gamePackages WHERE slug = 'phasmophobia'
UNION ALL
SELECT id, 2, ROUND(4096 * 1.2), 4, 100, 29.99 FROM gamePackages WHERE slug = 'it-takes-two'
UNION ALL
SELECT id, 2, ROUND(4096 * 1.2), 4, 100, 19.99 FROM gamePackages WHERE slug = 'a-way-out'
UNION ALL
SELECT id, 4, ROUND(2048 * 1.2), 2, 80, 19.99 FROM gamePackages WHERE slug = 'raft'
UNION ALL
SELECT id, 8, ROUND(1024 * 1.2), 2, 50, 9.99 FROM gamePackages WHERE slug = 'core-keeper'
UNION ALL
SELECT id, 4, ROUND(2048 * 1.2), 2, 50, 19.99 FROM gamePackages WHERE slug = 'paleo-pines'
UNION ALL
SELECT id, 2, ROUND(2048 * 1.2), 2, 50, 19.99 FROM gamePackages WHERE slug = 'spiritfarer'
UNION ALL
SELECT id, 8, ROUND(6144 * 1.2), 6, 100, 29.99 FROM gamePackages WHERE slug = 'ready-or-not'
UNION ALL
SELECT id, 6, ROUND(4096 * 1.2), 4, 100, 14.99 FROM gamePackages WHERE slug = 'killing-floor-2';

EOFSQL
)

echo "$CONFIG_SQL" | mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" 2>/dev/null
print_success "Szerver konfigurációk feltöltve"

# Step 5: Populate premium bundles
print_step "Premium 3-játékos csomagok feltöltése"

BUNDLES_SQL=$(cat << 'EOFSQL'

-- Premium bundles
INSERT IGNORE INTO gamePremiumBundles 
  (name, slug, description, imageUrl, basePrice, package1Id, package2Id, package3Id, maxSlots, maxRamMB, maxVCPU, discountPercent)
SELECT 
  'Ultimate FPS Bundle',
  'ultimate-fps-bundle',
  'Az extremális FPS élmény: Call of Duty Modern Warfare 2024 + Counter-Strike 2 + Warzone 2.0. Három különböző FPS stílusban játssz ugyanis egy szervercsomagban! Támogatott: 32-150 játékos, szuperior infrastruktúra.',
  'https://images.unsplash.com/photo-1552820728-8ac54c3a90f7?w=500&h=300',
  34.99,
  gp1.id,
  gp2.id,
  gp3.id,
  150,
  ROUND(8192 * 1.2),
  8,
  15
FROM gamePackages gp1, gamePackages gp2, gamePackages gp3
WHERE gp1.slug = 'cod-mw-2024' 
  AND gp2.slug = 'cs2'
  AND gp3.slug = 'cod-warzone-2'
UNION ALL
SELECT
  'Esports Legends Bundle',
  'esports-legends-bundle',
  'A Counter-Strike család: CS2 (újat) + CS:GO (klasszikus) + CS:Source (retro). Három generáció egy szerveren! Esports szerver infrastruktúra, világszínvonalú latency.',
  'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&h=300',
  12.99,
  gp1.id,
  gp2.id,
  gp3.id,
  32,
  ROUND(3072 * 1.2),
  4,
  12
FROM gamePackages gp1, gamePackages gp2, gamePackages gp3
WHERE gp1.slug = 'cs2'
  AND gp2.slug = 'csgo'
  AND gp3.slug = 'cs-source'
UNION ALL
SELECT
  'Survival Kings Bundle',
  'survival-kings-bundle',
  'A megölésen túl: Rust (PvP szanszka) + Valheim (Viking szurvival) + The Forest (horror szurvival). Három különböző szurvival élmény egy csomag, maximum 300 játékos támogatás!',
  'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
  54.99,
  gp1.id,
  gp2.id,
  gp3.id,
  300,
  ROUND(8192 * 1.2),
  8,
  18
FROM gamePackages gp1, gamePackages gp2, gamePackages gp3
WHERE gp1.slug = 'rust'
  AND gp2.slug = 'valheim'
  AND gp3.slug = 'the-forest'
UNION ALL
SELECT
  'Coop Party Bundle',
  'coop-party-bundle',
  'Barátok együtt: Portal 2 (puzzle kaland) + It Takes Two (páros dramd) + A Way Out (szökési thriller). Három perfekt co-op játék egy szervercsomagban. Ideal pároknak és baráti csapatoknak!',
  'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
  64.99,
  gp1.id,
  gp2.id,
  gp3.id,
  4,
  ROUND(4096 * 1.2),
  4,
  20
FROM gamePackages gp1, gamePackages gp2, gamePackages gp3
WHERE gp1.slug = 'portal-2'
  AND gp2.slug = 'it-takes-two'
  AND gp3.slug = 'a-way-out'
UNION ALL
SELECT
  'Horror Legends Bundle',
  'horror-legends-bundle',
  'Félelmetett éjszakák: Phasmophobia (szellem-hunting) + Lethal Company (sci-fi horror) + The Forest (erdei borzalom). Három félelmetes kaland egy csomag. Ideális horror rajongóknak!',
  'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
  39.99,
  gp1.id,
  gp2.id,
  gp3.id,
  4,
  ROUND(4096 * 1.2),
  4,
  15
FROM gamePackages gp1, gamePackages gp2, gamePackages gp3
WHERE gp1.slug = 'phasmophobia'
  AND gp2.slug = 'lethal-company'
  AND gp3.slug = 'the-forest'
UNION ALL
SELECT
  'Tactical Squad Bundle',
  'tactical-squad-bundle',
  'Taktikai erővel: Ready or Not (SWAT szimuláció) + Deep Rock Galactic (kooperatív bányászat) + Killing Floor 2 (zombie apokalipszis). Szakosított szerveren, csapat-alapú gameplay!',
  'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
  69.99,
  gp1.id,
  gp2.id,
  gp3.id,
  8,
  ROUND(6144 * 1.2),
  6,
  18
FROM gamePackages gp1, gamePackages gp2, gamePackages gp3
WHERE gp1.slug = 'ready-or-not'
  AND gp2.slug = 'deep-rock-galactic'
  AND gp3.slug = 'killing-floor-2'
UNION ALL
SELECT
  'Sandbox Builder Bundle',
  'sandbox-builder-bundle',
  'Kreativitás korlátlanul: Satisfactory (gyáripari evolúció) + Factorio (factory szimuláció) + Minecraft Java (végtelenül módosítható). Építő blokk szerzők számára!',
  'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
  49.99,
  gp1.id,
  gp2.id,
  gp3.id,
  255,
  ROUND(4096 * 1.2),
  4,
  16
FROM gamePackages gp1, gamePackages gp2, gamePackages gp3
WHERE gp1.slug = 'satisfactory'
  AND gp2.slug = 'factorio'
  AND gp3.slug = 'minecraft-java'
UNION ALL
SELECT
  'MOBA & Team Bundle',
  'moba-team-bundle',
  'Csapatok összeállítása: PUBG (battle royale) + Dota 2 (MOBA csodaország) + Team Fortress 2 (retro csapat FPS). 100+ játékos támogatás, kompetitív szint!',
  'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
  34.99,
  gp1.id,
  gp2.id,
  gp3.id,
  100,
  ROUND(6144 * 1.2),
  6,
  15
FROM gamePackages gp1, gamePackages gp2, gamePackages gp3
WHERE gp1.slug = 'pubg'
  AND gp2.slug = 'dota-2'
  AND gp3.slug = 'tf2'
UNION ALL
SELECT
  'Indie Classics Bundle',
  'indie-classics-bundle',
  'Indie gyöngyszemek: Terraria (pixel bányászat) + Core Keeper (2D kaland) + Stardew Valley (farm szimuláció). Olcsó, de értékes szerzők számára!',
  'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
  39.99,
  gp1.id,
  gp2.id,
  gp3.id,
  255,
  ROUND(1024 * 1.2),
  2,
  20
FROM gamePackages gp1, gamePackages gp2, gamePackages gp3
WHERE gp1.slug = 'terraria'
  AND gp2.slug = 'core-keeper'
  AND gp3.slug = 'stardew-valley'
UNION ALL
SELECT
  'Adventure Seekers Bundle',
  'adventure-seekers-bundle',
  'Felfedezés vár: Subnautica (tengeri kifejtés) + Project Zomboid (zombie szurvival) + Grounded (szúnyog világban). Kalandorok és feltárók számára készítve!',
  'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
  54.99,
  gp1.id,
  gp2.id,
  gp3.id,
  4,
  ROUND(4096 * 1.2),
  4,
  16
FROM gamePackages gp1, gamePackages gp2, gamePackages gp3
WHERE gp1.slug = 'subnautica'
  AND gp2.slug = 'project-zomboid'
  AND gp3.slug = 'grounded'
UNION ALL
SELECT
  'Call of Duty Bundle',
  'call-of-duty-bundle',
  'Call of Duty gyűjtemény: Modern Warfare 2024 + Black Ops 6 + Black Ops Cold War. Három Call of Duty generáció egy szervercsomagban. Katonai FPS fájdalmazók számára!',
  'https://images.unsplash.com/photo-1552820728-8ac54c3a90f7?w=500&h=300',
  29.99,
  gp1.id,
  gp2.id,
  gp3.id,
  32,
  ROUND(5120 * 1.2),
  4,
  12
FROM gamePackages gp1, gamePackages gp2, gamePackages gp3
WHERE gp1.slug = 'cod-mw-2024'
  AND gp2.slug = 'cod-bo6'
  AND gp3.slug = 'cod-cold-war'
UNION ALL
SELECT
  'Coop Adventure Bundle',
  'coop-adventure-bundle',
  'Kooperatív barát nyaralás: Don\'t Starve Together (szurvival) + Raft (tengeri kaland) + Left 4 Dead 2 (zombie horror). Csapatjáték a barátokkal!',
  'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
  39.99,
  gp1.id,
  gp2.id,
  gp3.id,
  8,
  ROUND(2048 * 1.2),
  2,
  14
FROM gamePackages gp1, gamePackages gp2, gamePackages gp3
WHERE gp1.slug = 'dont-starve-together'
  AND gp2.slug = 'raft'
  AND gp3.slug = 'left-4-dead-2';

EOFSQL
)

echo "$BUNDLES_SQL" | mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" 2>/dev/null
print_success "Premium csomagok feltöltve"

# Final summary
echo ""
print_header "SUMMARY - ADATBÁZIS FELTÖLTVE"

TOTAL_GAMES=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -sN -e "SELECT COUNT(*) FROM gamePackages;" 2>/dev/null)
TOTAL_CONFIGS=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -sN -e "SELECT COUNT(*) FROM gameServerConfigs;" 2>/dev/null)
TOTAL_BUNDLES=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -sN -e "SELECT COUNT(*) FROM gamePremiumBundles;" 2>/dev/null)

print_info "Game Packages:     $TOTAL_GAMES"
print_info "Server Configs:    $TOTAL_CONFIGS"
print_info "Premium Bundles:   $TOTAL_BUNDLES"

echo ""
print_success "✓ Összes szerver definíció feltöltve az adatbázisba!"
print_success "✓ Kész a játékszerver könyvtár kifejlesztésére!"
print_success "✓ Admin panelben már megjeleníthető az összes szerver!"

echo ""
print_header "TELEPÍTÉSI SZÜKSÉGLETEK"

print_info "Telepítési parancsok: lib/games/installation-commands.ts"
print_info "Szerver definiciók:  lib/games/server-definitions.ts"
print_info "Database schema OK"

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN} ✓ Setup teljesítve!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════════════${NC}"

exit 0
