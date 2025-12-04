#!/bin/bash

# ============================================================================
# ZED Gaming Hosting - Premium Game Bundle Database Insertion
# ============================================================================
# Ez a script a 3-játékos premium csomagokat hozza létre az adatbázisban
# ============================================================================

DB_HOST="116.203.226.140"
DB_USER="ZedGamingHosting_Zedin"
DB_PASS="Gele007ta..."
DB_NAME="ZedGamingHosting_gamingportal"

echo "═══════════════════════════════════════════════════════════════════"
echo "Premium Game Bundle Creation"
echo "═══════════════════════════════════════════════════════════════════"

SQL_FILE="/tmp/premium_bundles_insert.sql"

cat > "$SQL_FILE" << 'EOFSQL'

-- ============================================================================
-- PREMIUM GAME BUNDLES - 3 GAME COMBINATIONS
-- ============================================================================

-- 1. ULTIMATE FPS BUNDLE
-- Tartalmaz: MW2024 (5120MB RAM), CS2 (3072MB), Warzone 2 (8192MB) 
-- Max requires: 8192MB RAM = 9830.4MB with 20% = 9830.4MB (use 10240MB)

INSERT INTO gamePremiumBundles 
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
  AND gp3.slug = 'cod-warzone-2';

-- 2. ESPORTS LEGENDS BUNDLE
-- Tartalmaz: CS2, CS:GO, CS:Source
-- Max requires: 3072MB, 2048MB, 1536MB = 3072MB -> 3686.4MB (use 3840MB)

INSERT INTO gamePremiumBundles
  (name, slug, description, imageUrl, basePrice, package1Id, package2Id, package3Id, maxSlots, maxRamMB, maxVCPU, discountPercent)
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
  AND gp3.slug = 'cs-source';

-- 3. SURVIVAL KINGS BUNDLE
-- Tartalmaz: Rust (8192MB), Valheim (2048MB), The Forest (4096MB)
-- Max requires: 8192MB = 9830.4MB (use 10240MB)

INSERT INTO gamePremiumBundles
  (name, slug, description, imageUrl, basePrice, package1Id, package2Id, package3Id, maxSlots, maxRamMB, maxVCPU, discountPercent)
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
  AND gp3.slug = 'the-forest';

-- 4. COOP PARTY BUNDLE
-- Tartalmaz: Portal 2 (2048MB), It Takes Two (4096MB), A Way Out (4096MB)
-- Max requires: 4096MB = 4915.2MB (use 5120MB)

INSERT INTO gamePremiumBundles
  (name, slug, description, imageUrl, basePrice, package1Id, package2Id, package3Id, maxSlots, maxRamMB, maxVCPU, discountPercent)
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
  AND gp3.slug = 'a-way-out';

-- 5. HORROR LEGENDS BUNDLE
-- Tartalmaz: Phasmophobia (4096MB), Lethal Company (2048MB), The Forest (4096MB)
-- Max requires: 4096MB = 4915.2MB (use 5120MB)

INSERT INTO gamePremiumBundles
  (name, slug, description, imageUrl, basePrice, package1Id, package2Id, package3Id, maxSlots, maxRamMB, maxVCPU, discountPercent)
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
  AND gp3.slug = 'the-forest';

-- 6. TACTICAL SQUAD BUNDLE
-- Tartalmaz: Ready or Not (6144MB), Deep Rock Galactic (2048MB), Killing Floor 2 (4096MB)
-- Max requires: 6144MB = 7372.8MB (use 7680MB)

INSERT INTO gamePremiumBundles
  (name, slug, description, imageUrl, basePrice, package1Id, package2Id, package3Id, maxSlots, maxRamMB, maxVCPU, discountPercent)
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
  AND gp3.slug = 'killing-floor-2';

-- 7. SANDBOX BUILDER BUNDLE
-- Tartalmaz: Satisfactory (4096MB), Factorio (2048MB), Minecraft Java (1024MB)
-- Max requires: 4096MB = 4915.2MB (use 5120MB)

INSERT INTO gamePremiumBundles
  (name, slug, description, imageUrl, basePrice, package1Id, package2Id, package3Id, maxSlots, maxRamMB, maxVCPU, discountPercent)
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
  AND gp3.slug = 'minecraft-java';

-- 8. MOBA & TEAM BUNDLE
-- Tartalmaz: PUBG (6144MB), Dota 2 (2048MB), Team Fortress 2 (2048MB)
-- Max requires: 6144MB = 7372.8MB (use 7680MB)

INSERT INTO gamePremiumBundles
  (name, slug, description, imageUrl, basePrice, package1Id, package2Id, package3Id, maxSlots, maxRamMB, maxVCPU, discountPercent)
SELECT
  'MOBA & Team Bundle',
  'moba-team-bundle',
  'Csapatok összeállítása: PUBG (battle royale) + Dota 2 (MOBA csodaország) + Team Fortress 2 (retro csapat FPS). 100+ játékos támogatás, kompetitív szin!',
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
  AND gp3.slug = 'tf2';

-- 9. INDIE CLASSICS BUNDLE
-- Tartalmaz: Terraria (512MB), Core Keeper (1024MB), Stardew Valley (512MB)
-- Max requires: 1024MB = 1228.8MB (use 1536MB)

INSERT INTO gamePremiumBundles
  (name, slug, description, imageUrl, basePrice, package1Id, package2Id, package3Id, maxSlots, maxRamMB, maxVCPU, discountPercent)
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
  AND gp3.slug = 'stardew-valley';

-- 10. ADVENTURE SEEKERS BUNDLE
-- Tartalmaz: Subnautica (4096MB), Project Zomboid (2048MB), Grounded (4096MB)
-- Max requires: 4096MB = 4915.2MB (use 5120MB)

INSERT INTO gamePremiumBundles
  (name, slug, description, imageUrl, basePrice, package1Id, package2Id, package3Id, maxSlots, maxRamMB, maxVCPU, discountPercent)
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
  AND gp3.slug = 'grounded';

-- 11. CALL OF DUTY BUNDLE
-- Tartalmaz: MW2024 (5120MB), BO6 (5120MB), Cold War (4096MB)
-- Max requires: 5120MB = 6144MB (use 6144MB)

INSERT INTO gamePremiumBundles
  (name, slug, description, imageUrl, basePrice, package1Id, package2Id, package3Id, maxSlots, maxRamMB, maxVCPU, discountPercent)
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
  AND gp3.slug = 'cod-cold-war';

-- 12. DON'T STARVE & COOPS BUNDLE
-- Tartalmaz: Don't Starve Together (1024MB), Raft (2048MB), Left 4 Dead 2 (2048MB)
-- Max requires: 2048MB = 2457.6MB (use 2560MB)

INSERT INTO gamePremiumBundles
  (name, slug, description, imageUrl, basePrice, package1Id, package2Id, package3Id, maxSlots, maxRamMB, maxVCPU, discountPercent)
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

echo "[1/3] Adatbázishoz csatlakozás..."
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" -e "SELECT 1" > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "Hiba: Nem sikerült csatlakozni az adatbázishoz!"
    exit 1
fi

echo "[2/3] Premium csomagok feltöltése..."
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$SQL_FILE" 2>&1

if [ $? -ne 0 ]; then
    echo "Hiba: Premium csomagok feltöltése sikertelen!"
    exit 1
fi

echo "[3/3] Ellenőrzés..."
BUNDLE_COUNT=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -sN -e "SELECT COUNT(*) FROM gamePremiumBundles;" 2>/dev/null)
echo "✓ Sikeresen beszúrva: $BUNDLE_COUNT premium csomag"

rm -f "$SQL_FILE"

echo "═══════════════════════════════════════════════════════════════════"
echo "✓ Teljesítve! Premium csomagok az adatbázisban."
echo "═══════════════════════════════════════════════════════════════════"

