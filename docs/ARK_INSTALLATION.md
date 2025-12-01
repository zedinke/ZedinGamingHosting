# ARK: Survival Ascended Telepítési Útmutató

Ez a dokumentum leírja az ARK: Survival Ascended szerver telepítését és a fájlstruktúrát a rendszerben.

## 📁 Fájlstruktúra

### 1. Shared Server Files (Játékfájlok)

**Egy felhasználónak egy szervergépen egy shared mappa van.**

```
/opt/ark-shared/{userId}-{machineId}/
├── ShooterGame/
│   ├── Binaries/
│   │   └── Linux/
│   │       └── ShooterGameServer  (bináris fájl)
│   └── Content/
└── instances/
    └── {serverId}/  (egyedi szerver instance-ok)
        └── ShooterGame/
            └── Saved/
                ├── Config/
                │   └── LinuxServer/
                │       ├── GameUserSettings.ini
                │       └── Game.ini
                └── SavedArks/
```

**Példa:**
- Felhasználó ID: `user123`
- Szervergép ID: `machine456`
- Shared path: `/opt/ark-shared/user123-machine456/`

### 2. Server Instances (Szerver Instance-ok)

Minden szerver instance a shared mappán belül van:

```
/opt/ark-shared/{userId}-{machineId}/instances/{serverId}/
└── ShooterGame/
    └── Saved/
        ├── Config/
        │   └── LinuxServer/
        │       ├── GameUserSettings.ini  (szerver konfiguráció)
        │       └── Game.ini
        └── SavedArks/  (szerver mentések)
```

### 3. Cluster Mappa (Manager Szervergépen)

A cluster mappa a **manager szervergépen** (weboldal szerverén) van, és tartalmazza a cluster mentéseket.

```
/opt/ark-cluster/{clusterId}/
└── (cluster mentések - több szerver között megosztva)
```

**Fontos:** A cluster mappa lehet NFS vagy lokális, attól függően, hogy a szerverek ugyanazon a gépen vannak-e vagy különböző gépeken.

## 🔧 Telepítési Folyamat

### 1. Shared Files Telepítése

Amikor egy felhasználó **első alkalommal** hoz létre ARK szervert egy adott szervergépen:

1. Létrejön a shared mappa: `/opt/ark-shared/{userId}-{machineId}/`
2. SteamCMD letölti az ARK: Survival Ascended szerver fájlokat
3. A bináris fájl: `ShooterGame/Binaries/Linux/ShooterGameServer`

**SteamCMD parancs:**
```bash
/opt/steamcmd/steamcmd.sh +force_install_dir /opt/ark-shared/{userId}-{machineId} +login anonymous +app_update 2430930 validate +quit
```

**App ID:** 2430930 (ARK: Survival Ascended Dedicated Server)

### 2. Server Instance Létrehozása

Amikor egy új szerver instance jön létre:

1. Létrejön az instance mappa: `/opt/ark-shared/{userId}-{machineId}/instances/{serverId}/`
2. Létrejönnek a konfigurációs fájlok:
   - `GameUserSettings.ini` - szerver beállítások
   - `Game.ini` - játék beállítások
3. A szerver a shared binárist használja, de saját konfigurációval

### 3. Cluster Beállítása

Ha a szerver egy cluster-hez tartozik:

1. A cluster mappa a manager szervergépen van: `/opt/ark-cluster/{clusterId}/`
2. A szerver konfigurációban beállítjuk:
   - `ClusterDirOverride=/mnt/ark-cluster/{clusterId}` (ha NFS)
   - `ClusterId={clusterId}`
3. A szerverek közötti kommunikáció a cluster mappán keresztül történik

## 🌐 Több Szervergép Használata

**Példa:** 4 különböző szervergépen 7 szerver

```
Szervergép 1 (machine1):
  /opt/ark-shared/user123-machine1/
    └── instances/
        ├── server1/
        └── server2/

Szervergép 2 (machine2):
  /opt/ark-shared/user123-machine2/
    └── instances/
        ├── server3/
        └── server4/

Szervergép 3 (machine3):
  /opt/ark-shared/user123-machine3/
    └── instances/
        ├── server5/
        └── server6/

Szervergép 4 (machine4):
  /opt/ark-shared/user123-machine4/
    └── instances/
        └── server7/

Manager Szervergép (weboldal):
  /opt/ark-cluster/cluster123/  (mind a 7 szerver ezt használja)
```

**Fontos:**
- Minden szervergépen külön shared mappa van ugyanannak a felhasználónak
- A cluster mappa csak a manager szervergépen van
- A szerverek NFS-n vagy más módon hozzáférnek a cluster mappához

## 📋 SteamCMD Használata

A telepítés a hivatalos SteamCMD dokumentációt követi:
- Dokumentáció: https://developer.valvesoftware.com/wiki/SteamCMD

### Fontos Szabályok:

1. **`force_install_dir` MINDIG a `login` előtt kell használni**
   ```bash
   steamcmd.sh +force_install_dir <path> +login anonymous +app_update <appid> validate +quit
   ```

2. **Anonymous login:** Az ARK szerverek anonim bejelentkezéssel letölthetők (nem kell Steam fiók)

3. **Validate:** A `validate` opció biztosítja, hogy minden fájl helyesen legyen letöltve

4. **Retry logika:** A telepítés 3-szor próbálkozik, ha elsőre nem sikerül

## 🔍 Ellenőrzések

### Shared Files Ellenőrzése

```bash
# Ellenőrizzük, hogy a shared fájlok telepítve vannak-e
test -f /opt/ark-shared/{userId}-{machineId}/ShooterGame/Binaries/Linux/ShooterGameServer
```

### Server Instance Ellenőrzése

```bash
# Ellenőrizzük, hogy az instance mappa létezik-e
test -d /opt/ark-shared/{userId}-{machineId}/instances/{serverId}
```

### Cluster Mappa Ellenőrzése

```bash
# Ellenőrizzük, hogy a cluster mappa létezik-e (manager szervergépen)
test -d /opt/ark-cluster/{clusterId}
```

## 🛠️ Hibaelhárítás

### Telepítés Sikertelen

1. **Ellenőrizd a SteamCMD telepítését:**
   ```bash
   test -f /opt/steamcmd/steamcmd.sh
   ```

2. **Ellenőrizd az internetkapcsolatot:**
   ```bash
   ping steamcdn-a.akamaihd.net
   ```

3. **Ellenőrizd a lemezterületet:**
   ```bash
   df -h /opt/ark-shared
   ```

4. **Nézd meg a telepítési logot:**
   ```bash
   cat /opt/ark-shared/{userId}-{machineId}/install.log
   ```

### Bináris Fájl Hiányzik

Ha a telepítés lefut, de a bináris fájl hiányzik:

1. Ellenőrizd, hogy a SteamCMD sikeresen lefutott-e
2. Nézd meg a SteamCMD kimenetét
3. Próbáld meg újra a telepítést

### Cluster Mappa Nem Elérhető

Ha a cluster mappa nem elérhető:

1. Ellenőrizd, hogy a cluster mappa létezik-e a manager szervergépen
2. Ellenőrizd az NFS mount-ot (ha NFS-t használsz)
3. Ellenőrizd a jogosultságokat

## 📚 További Információk

- [SteamCMD Hivatalos Dokumentáció](https://developer.valvesoftware.com/wiki/SteamCMD)
- [ARK: Survival Ascended Szerver Dokumentáció](https://ark.wiki.gg/wiki/Dedicated_Server_Setup)

