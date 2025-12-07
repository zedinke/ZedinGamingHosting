# Játék Telepítők Ellenőrzési Jelentés

**Dátum:** 2025-12-07  
**Ellenőrzött fájlok:** 44 telepítő script

## Összefoglaló

A játék telepítők általában következetes struktúrát használnak, de **több telepítő hiányos** - nincs retry logika és sikeres telepítés ellenőrzése.

## Problémák Kategóriákba Szedve

### 1. ❌ Hiányzó Retry Logika és Sikeres Telepítés Ellenőrzése

A következő telepítők **NEM** használnak retry logikát és `INSTALL_SUCCESS` ellenőrzést:

- `apex-legends.ts`
- `team-fortress-2.ts`
- `death-stranding.ts`
- `ghost-of-tsushima.ts`
- `spider-man.ts`
- `god-of-war.ts`
- `the-last-of-us.ts`
- `horizon-zero-dawn.ts`
- `elden-ring.ts`
- `pubg-battlegrounds.ts`
- `call-of-duty-warzone.ts`
- `black-myth-wukong.ts`
- `helldivers-2.ts`
- `stardew-valley.ts`
- `war-thunder.ts`
- `left-4-dead.ts`
- `portal-2.ts`
- `dead-by-daylight.ts`
- `ready-or-not.ts`
- `counter-strike-source.ts`
- `day-of-defeat-source.ts`

**Összesen: 20 telepítő**

**Probléma:**
- Ha a SteamCMD hálózati problémák miatt sikertelen, a telepítés azonnal hibát jelez
- Nincs ellenőrzés, hogy a fájlok valóban letöltődtek-e
- Nincs újrapróbálkozás mechanizmus

**Javasolt megoldás:**
Hozzáadni retry logikát (3 próbálkozás) és fájl ellenőrzést, mint a többi telepítőben.

### 2. ✅ Jól Működő Telepítők

A következő telepítők **megfelelően** működnek retry logikával és ellenőrzésekkel:

- `sons-of-the-forest.ts` - Speciális: Windows platform + beta branch támogatás
- `rust.ts` - Részletes ellenőrzések
- `valheim.ts` - Steam runtime beállításokkal
- `palworld.ts`
- `enshrouded.ts`
- `conan-exiles.ts`
- `dayz.ts`
- `cs2.ts`
- `project-zomboid.ts`
- `v-rising.ts`
- `grounded.ts`
- `dont-starve-together.ts`
- `terraria.ts`
- `killing-floor-2.ts`
- `cod-infinite-warfare.ts`
- `cod-vanguard.ts`
- `cod-cold-war.ts`
- `cod-black-ops-6.ts`
- `cod-warzone-2.ts`
- `cod-modern-warfare-2024.ts`

**Összesen: 19 telepítő**

### 3. ⚠️ Speciális Telepítők

- `the-forest.ts` - Windows platform támogatás (Wine)
- `satisfactory.ts` - Felhasználó alapú telepítés (sfgames csoport)
- `seven-days-to-die.ts` - Komplex felhasználó alapú telepítés
- `minecraft.ts` - Nem SteamCMD alapú (külön implementáció)

## Javasolt Javítások

### Prioritás 1: Hiányzó Retry Logika Hozzáadása

Minden hiányos telepítőhöz hozzá kell adni:

1. **Retry logika** (3 próbálkozás)
2. **INSTALL_SUCCESS változó** ellenőrzés
3. **Fájl létezés ellenőrzés** a telepítés után
4. **Hibaüzenetek** ha a telepítés sikertelen

### Példa Javított Struktúra:

```bash
MAX_RETRIES=3
RETRY_COUNT=0
INSTALL_SUCCESS=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  echo "SteamCMD futtatása (próbálkozás $((RETRY_COUNT + 1))/$MAX_RETRIES)..."
  
  HOME="$STEAM_HOME" /opt/steamcmd/steamcmd.sh +force_install_dir "$SERVER_DIR" +login anonymous +app_update <APP_ID> validate +quit
  EXIT_CODE=$?
  
  sleep 5
  
  # Fájl ellenőrzés
  if [ -f "$SERVER_DIR/<expected_file>" ] || [ -d "$SERVER_DIR/<expected_dir>" ]; then
    INSTALL_SUCCESS=true
    break
  fi
  
  echo "SteamCMD exit code: $EXIT_CODE" >&2
  echo "Telepítés még nem teljes, újrapróbálkozás..." >&2
  RETRY_COUNT=$((RETRY_COUNT + 1))
  
  if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
    echo "Várakozás 15 másodpercet az újrapróbálkozás előtt..."
    sleep 15
  fi
done

if [ "$INSTALL_SUCCESS" != "true" ]; then
  echo "HIBA: Telepítés nem sikerült $MAX_RETRIES próbálkozás után" >&2
  exit 1
fi
```

## Konzisztencia Ellenőrzések

### ✅ Jó Gyakorlatok (amelyeket minden telepítő követ):

1. **SteamCMD ellenőrzés** - `/opt/steamcmd/steamcmd.sh` létezés ellenőrzése
2. **STEAM_HOME** - Ideiglenes könyvtár használata
3. **Cleanup** - `rm -rf "$STEAM_HOME"` a végén
4. **Jogosultságok** - Root tulajdon és 755 jogosultságok
5. **Könyvtár létrehozás** - `/opt/servers` és `$SERVER_DIR` létrehozása

### ⚠️ Változások:

- **Satisfactory** és **Seven Days to Die** - Felhasználó alapú telepítés (sfgames csoport)
- **The Forest** és **Sons of the Forest** - Windows platform támogatás
- **Rust** - Részletesebb ellenőrzések és debug információk

## Következő Lépések

1. ✅ Dokumentáció készítése (ez a fájl)
2. ⏳ Hiányos telepítők javítása (20 fájl)
3. ⏳ Tesztelés a javítások után
4. ⏳ Git commit és push

## Megjegyzések

- A legtöbb telepítő következetes struktúrát használ
- A hiányos telepítők valószínűleg korábbi verziók, amelyeket még nem frissítettek
- A javítások egyszerűek és konzisztensek lesznek a többi telepítővel

