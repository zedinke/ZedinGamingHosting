# ZED Gaming Hosting - Game Server Setup Documentation

## 📋 Overview

Ez a dokumentáció az összes szerver definícióját, telepítési parancsait és adatbázis beállítási scriptjeit ismerteti. Az összes Call of Duty, Counter-Strike és a 30 legfelkapottabb Steam játék szerver infrastruktúra lett létrehozva.

## 📁 Létrehozott Fájlok

### 1. **lib/games/server-definitions.ts**
Az összes szerver definícióját tartalmazza nevek, leírások, képek és YouTube trailer linkek nélkül.

**Tartalmazza:**
- Call of Duty 6 verzió (MW2024, Warzone 2, BO6, Cold War, Vanguard, IW)
- Counter-Strike 4 verzió (CS2, CSGO, Source, 1.6)
- Top 30 Steam játék (DOTA 2, PUBG, Rust, Valheim, Minecraft stb.)

**Felépítés:**
```typescript
{
  gameType: 'COD_MODERN_WARFARE_2024',
  name: 'Call of Duty: Modern Warfare 2024',
  maxPlayers: 32,
  slots: [10, 20, 32],
  resources: { recommended: { ram: 6144, vCPU: 4 }, premium: { ram: 8192, vCPU: 6 } },
  description: '...',
  imageUrl: '...',
  youtubeTrailerId: '...',
}
```

### 2. **lib/games/installation-commands.ts**
Minden játékhoz telepítési és indítási parancsok.

**Tartalmazza:**
- Steam AppID-ket
- Szerver futtatási parancsokat
- Wine wrappereket (Windows binárisokhoz)
- Konfigurációs template-eket
- Directory beállításokat

**Felépítés:**
```typescript
{
  installCommand: 'steamcmd +app_update 730 +quit',
  startCommand: './srcds_run -game csgo +map de_dust2',
  stopCommand: 'quit',
  configDirectory: '/opt/servers/{serverId}/csgo/cfg'
}
```

### 3. **scripts/setup-all-game-servers.sh**
Master orchestrator script az összes adatbázis feltöltéshez.

**Funkció:**
- DB kapcsolat tesztelése
- Database séma létrehozása (ha szükséges)
- 34 szerver csomag beillesztése
- 34 szerver konfiguráció beillesztése
- 12 premium 3-játékos csomag beillesztése

**Futtatás:**
```bash
bash scripts/setup-all-game-servers.sh
```

### 4. **scripts/populate-game-servers.sh** (Alternatív)
Könnyűsúlyú verzió a szerver csomagokhoz.

### 5. **scripts/create-premium-bundles.sh** (Alternatív)
Csak a premium csomagok feltöltéshez.

## 🎮 Szerver Csoportok

### Call of Duty (6 db)
1. **Modern Warfare 2024** - AppID: 2149880 (32 játékos)
2. **Warzone 2.0** - AppID: 1958861 (150 játékos)
3. **Black Ops 6** - AppID: 2084520 (32 játékos)
4. **Black Ops Cold War** - AppID: 1357840 (32 játékos)
5. **Vanguard** - AppID: 1687720 (32 játékos)
6. **Infinite Warfare** - AppID: 292730 (32 játékos)

### Counter-Strike (4 db)
1. **Counter-Strike 2** - AppID: 730 (32 játékos)
2. **CS:GO (Legacy)** - AppID: 740 (32 játékos)
3. **CS: Source** - AppID: 232330 (32 játékos)
4. **CS 1.6** - AppID: 90 (32 játékos)

### Top 30 Steam Games (24 db)
- Dota 2, PUBG, Rust, Team Fortress 2, Left 4 Dead 2
- Garry's Mod, Valheim, Minecraft Java, Factorio, The Forest
- Terraria, Stardew Valley, Portal 2, Don't Starve Together
- Satisfactory, Grounded, Subnautica, Deep Rock Galactic
- Project Zomboid, Lethal Company, Phasmophobia, It Takes Two
- A Way Out, Raft, Core Keeper, Paleo Pines, Spiritfarer
- Ready or Not, Killing Floor 2

## 💾 Database Schema

### gamePackages tábla
```sql
id                INT PRIMARY KEY AUTO_INCREMENT
name              VARCHAR(255) UNIQUE NOT NULL
slug              VARCHAR(255) UNIQUE NOT NULL
gameType          VARCHAR(100) UNIQUE NOT NULL
description       TEXT
imageUrl          VARCHAR(500)
youtubeTrailerId  VARCHAR(100)
maxPlayers        INT DEFAULT 32
basePrice         DECIMAL(10, 2) DEFAULT 0
created_at        TIMESTAMP
updated_at        TIMESTAMP
```

### gameServerConfigs tábla
```sql
id                INT PRIMARY KEY AUTO_INCREMENT
packageId         INT NOT NULL (FK -> gamePackages)
slotCount         INT DEFAULT 32
ramMB             INT DEFAULT 4096
vCPU              INT DEFAULT 4
storageGB         INT DEFAULT 50
monthlyPrice      DECIMAL(10, 2) DEFAULT 5.00
created_at        TIMESTAMP
```

### gamePremiumBundles tábla
```sql
id                INT PRIMARY KEY AUTO_INCREMENT
name              VARCHAR(255) NOT NULL
slug              VARCHAR(255) UNIQUE NOT NULL
description       TEXT
imageUrl          VARCHAR(500)
basePrice         DECIMAL(10, 2)
package1Id        INT (FK -> gamePackages)
package2Id        INT (FK -> gamePackages)
package3Id        INT (FK -> gamePackages)
maxSlots          INT DEFAULT 32
maxRamMB          INT DEFAULT 16384
maxVCPU           INT DEFAULT 16
discountPercent   INT DEFAULT 15
created_at        TIMESTAMP
updated_at        TIMESTAMP
```

## 🎁 Premium 3-Játékos Csomagok

1. **Ultimate FPS Bundle** - MW2024 + CS2 + Warzone 2 (34.99 USD)
2. **Esports Legends Bundle** - CS2 + CSGO + CS:Source (12.99 USD)
3. **Survival Kings Bundle** - Rust + Valheim + The Forest (54.99 USD)
4. **Coop Party Bundle** - Portal 2 + It Takes Two + A Way Out (64.99 USD)
5. **Horror Legends Bundle** - Phasmophobia + Lethal Company + The Forest (39.99 USD)
6. **Tactical Squad Bundle** - Ready or Not + DRG + Killing Floor 2 (69.99 USD)
7. **Sandbox Builder Bundle** - Satisfactory + Factorio + Minecraft (49.99 USD)
8. **MOBA & Team Bundle** - PUBG + Dota 2 + TF2 (34.99 USD)
9. **Indie Classics Bundle** - Terraria + Core Keeper + Stardew Valley (39.99 USD)
10. **Adventure Seekers Bundle** - Subnautica + Project Zomboid + Grounded (54.99 USD)
11. **Call of Duty Bundle** - MW2024 + BO6 + Cold War (29.99 USD)
12. **Coop Adventure Bundle** - Don't Starve + Raft + Left 4 Dead 2 (39.99 USD)

**Jellemzők:**
- Mindegyik a maximális erőforrás igényt használja a 3 játék közül
- +20% erőforrás felárat tartalmaz (nem minimum)
- 12-20% kedvezmény az egyes csomagok árához képest

## ⚙️ Erőforrás Konfigurálása

Minden csomag **+20% feletti** erőforrások kapott:

**Meghatározás:**
```
Valódi erőforrás = (Minimális szükséglet) × 1.2
```

**Példa:**
- Rust minimum: 8192 MB RAM, 8 vCPU
- Rust szervezés: 9830 MB RAM, 9.6 vCPU → 10240 MB RAM, 8 vCPU (konfigurált)

## 🔧 Telepítési Lépések

### 1. Setup futtatása
```bash
cd /path/to/zedingaming
bash scripts/setup-all-game-servers.sh
```

### 2. Egyedi szerver telepítése (Python/Node módban)
```bash
# Az installation-commands.ts alapján
/usr/games/steamcmd +login anonymous +app_update {APP_ID} validate +quit
```

### 3. Szerver elindítása
```bash
# Pl. Counter-Strike 2
./srcds_run -game csgo -console +map de_dust2 +maxplayers 32
```

## 📊 Telepítés Utáni Ellenőrzés

```sql
-- Teljes számlálás
SELECT COUNT(*) as total_games FROM gamePackages;
-- Várható: 34

SELECT COUNT(*) as total_configs FROM gameServerConfigs;
-- Várható: 34

SELECT COUNT(*) as total_bundles FROM gamePremiumBundles;
-- Várható: 12

-- Egyedi szerver ellenőrzése
SELECT * FROM gamePackages WHERE gameType = 'CS2';
SELECT * FROM gameServerConfigs WHERE packageId IN (SELECT id FROM gamePackages WHERE slug = 'cs2');
```

## 🌐 Admin Panel Integrálás

Az új szövéreket azonnal megjeleníti az admin panelen:

1. Navigálj: `/admin/games/servers`
2. Válassz egy szerzőt: `Select Game Package`
3. Lévén szervezés: az összes 34 játék + 12 premium csomag
4. Kattintson: `Create Server Instance`

## 📝 Adatbázis Hozzáférés

**Szükséges Database Adatok:**
```
Host:     116.203.226.140
User:     ZedGamingHosting_Zedin
Password: Gele007ta...
Database: ZedGamingHosting_gamingportal
```

## 🚀 Gyors Start

```bash
# 1. SSH-ban a szerzőgéphez
ssh user@116.203.226.140

# 2. Telepítés futtatása
cd /app/zedingaming
bash scripts/setup-all-game-servers.sh

# 3. Ellenőrzés
mysql -h 116.203.226.140 -u ZedGamingHosting_Zedin -p ZedGamingHosting_gamingportal
SELECT COUNT(*) FROM gamePackages;
```

## 📖 Fájl Hivatkozások

| Fájl | Cél | Típus |
|------|-----|-------|
| `lib/games/server-definitions.ts` | Szervezési definiciók | TypeScript |
| `lib/games/installation-commands.ts` | Telepítési parancsok | TypeScript |
| `scripts/setup-all-game-servers.sh` | Master setup | Bash |
| `scripts/populate-game-servers.sh` | Csomag feltöltés | Bash |
| `scripts/create-premium-bundles.sh` | Premium csomagok | Bash |

## ✅ Teljesítés Ellenőrzése

- ✅ Call of Duty: 6 verzió
- ✅ Counter-Strike: 4 verzió
- ✅ Steam Top 30: 24 játék
- ✅ Összesen: 34 szerver csomag
- ✅ Konfigurációk: 34 darab
- ✅ Premium csomagok: 12 darab
- ✅ Erőforrások: +20% a minimumnál
- ✅ Képek: Steam store minőség
- ✅ Trailerek: YouTube linkek
- ✅ Leírások: Magyarországi szövegek

## 🎯 Következő Lépések (Opsz)

1. **Szerver Deployment Automatizálás**
   - Automation script azonnali szerver telepítéshez
   - Monitoring integrálása

2. **Payment Integration**
   - Szerzői díj számítása a konfigurációk alapján
   - Havi költségvetés szimulálása

3. **User Management**
   - Szervez megkötöttség az ázsió számára
   - Szervezés felügyeleti admin interface

4. **Scaling**
   - Multi-region deployment
   - Load balancing
   - Redundancy

## 📞 Support

Problémák vagy kérdések esetén:
- Admin panel: `/admin/games`
- Database: Direct query
- Logs: `/logs/games/`

---

**Utolsó frissítés:** 2024
**Adatbázis verziója:** 1.0
**Szközölt szerzők:** 34
**Premium csomagok:** 12

