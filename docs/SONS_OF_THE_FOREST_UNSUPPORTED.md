# Sons of the Forest - Telepítési Hiba Megoldása

## Probléma

A Sons of the Forest dedikált szerver **nem telepíthető** a `ZedGamingHosting` platformon.

### Hibaüzenetek
```
ERROR! Failed to install app '1326470' (Missing configuration)
ERROR! Failed to install app '1326470' (No subscription)
Exit code: 8 (SteamCMD hiba)
```

### Közvetlen Ok

**Valve még nem publikálta** a Sons of the Forest dedikált szerver csomagját a SteamCMD-n keresztüli nyilvános telepítéshez.

- **AppID**: 1326470 (Sons of the Forest Dedicated Server)
- **Hozzáférés típus**: Tiltott névtelen bejelentkezéshez
- **Szükséges**: Szerverlicenc vagy kiemelt hozzáférés
- **Elérhető**: Jelenleg nem, csak harmadik fél hosztok (G-Portal, Nitrado, stb.)

---

## Megoldási Lehetőségek

### 1️⃣ **AJÁNLOTT: Más Játék Kiválasztása** (Ingyenes)

Teljes támogatással rendelkező alternatívák:

| Játék | AppID | Támogatás | Játékosok |
|-------|-------|-----------|-----------|
| **Rust** | 258550 | ✅ Teljes | 1-250+ |
| **ARK: Survival Evolved** | 376030 | ✅ Teljes | 1-70 |
| **Valheim** | 896660 | ✅ Teljes | 1-10 |
| **Minecraft** | N/A | ✅ Teljes | 1-100+ |
| **CSGO 2** | 730 | ✅ Teljes | 10-64 |
| **Garry's Mod** | 4000 | ✅ Teljes | 1-64 |
| **The Forest** | 242760 | ✅ Teljes | 1-4 |
| **ARK 2** | 2399830 | ✅ Teljes | 1-100 |

### 2️⃣ **Harmadik Fél Hosztok** (Fizetős)

Ha kifejezetten Sons of the Forest szerverre van szüksége:

#### **G-Portal.com** (Ajánlott)
- Ár: ~€5-15/hó
- Támogatás: 24/7 magyar ügyfélszolgálat
- Előny: Könnyű beállítás, profi menedzsment

#### **Nitrado.net**
- Ár: ~€5-10/hó
- Támogatás: 24/7
- Előny: Több régió, DDoS védelem

#### **Auf.net**
- Ár: ~€4-8/hó
- Támogatás: Közösségi
- Előny: Alacsony ár, német szerver

### 3️⃣ **Hosszú Távú Megoldás** (Jövő)

Ha Zed Gaming később szeretné támogatni a Sons of the Forest-et:
- Szükséges: Valve-vel való üzletfejlesztési megállapodás
- Feltételek: Kiemelt szerver licenc beszerzése
- Költség: Nagy (100€+/év)
- Lehetőség: Jelenleg nem elérhető kisebb hosztok számára

---

## Technikai Háttér

### Miért nem működik?

1. **SteamCMD Korlátozás**
   - Sons of the Forest szerver AppID: 1326470
   - Bejelentkezés szint: Szuperelevált (nem névtelen)
   - Konfiguráció: Nincs

2. **Steam Tanúsítási Hiba**
   ```
   Missing configuration = Szervercsomagok nincsenek konfigurálva
   No subscription = Nincs megfelelő licenc
   Exit code 8 = Végzetes SteamCMD hiba
   ```

3. **Installer Script Válasz**
   ```bash
   # /lib/games/installers/sons-of-the-forest.ts
   # Közvetlenül kilép a telepítés előtt
   # Informáló üzeneteket nyomtat ki
   # exit 1 - Sikertelen telepítés
   ```

---

## Felhasználói Teendők

### Egy Sons of the Forest Szerver Leszerzésének Módjai

#### **A. Saját Szerver Bérlés (G-Portal)**
1. Menj a https://www.g-portal.com/ oldalra
2. Keress rá: "Sons of the Forest"
3. Válassz szerver konfigurációt (8-16 játékos)
4. Fizetsd meg (~€7/hó)
5. Azonnal használható

#### **B. Zed Gaming - Más Játék Választása**
1. Menj a https://zedgaminghosting.hu/games oldalra
2. Válassz egy támogatott játékot
3. Kattints "Szerver Bérlés" gombra
4. Teljesen ugyanaz a felület, azonnal működik

#### **C. Saját PC/Szerverről Futtatás**
1. Vásárolj egy dedikált szervert
2. Telepítsd a Sons of the Forest játékot (Steam)
3. Futtasd a szerver alkalmazást
4. Port forward + DynDNS szükséges

---

## Támogatás

Bármilyen kérdés esetén forduljon az alábbi csatornákon keresztül:

- **E-mail**: support@zedgaminghosting.hu
- **Discord**: https://discord.gg/zedgaming
- **Dokumentáció**: https://zedgaminghosting.hu/docs
- **Támogatott játékok**: https://zedgaminghosting.hu/games

---

## Frissítés Előzmények

| Dátum | Módosítás |
|-------|-----------|
| 2025-12-07 | Kezdeti dokumentáció - Sons of the Forest nem támogatott |
| TBD | Valve megoldás, ha nyilvánosan elérhető lesz |

---

## Kapcsolódó Hibák

- **AppID 1326470**: Sons of the Forest Dedicated Server
- **Exit Code 8**: SteamCMD fatális hiba
- **Missing Configuration**: Szervercsomagok nincsenek beállítva

**Ezt a dokumentációt a rendszer automatikusan generálta.**
