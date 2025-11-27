# Systemd Service-ek Kezelése

Ez a dokumentum bemutatja, hogyan lehet megnézni és kezelni a játék szerverekhez létrehozott systemd service-eket.

## 📋 Service-ek Listázása

### Összes Service Listázása

```bash
# Összes aktív service listázása
systemctl list-units --type=service --state=running

# Összes service (aktív és inaktív is)
systemctl list-units --type=service --all

# Csak a játék szerver service-ek (server- prefix-szel)
systemctl list-units --type=service | grep server-

# Rövidebb formátum
systemctl list-units --type=service --no-pager
```

### Játék Szerver Service-ek Keresése

```bash
# Összes server- prefix-szel kezdődő service
systemctl list-units --type=service | grep "^server-"

# Egy adott szerver service-ének keresése (pl. server-cmihrfe3m0001afyuzsjijhaz)
systemctl status server-cmihrfe3m0001afyuzsjijhaz

# Service fájlok helye
ls -la /etc/systemd/system/server-*.service

# Vagy
systemctl list-unit-files | grep server-
```

### Service Fájlok Helye

A játék szerver service fájlok a következő helyen találhatók:

```bash
# Service fájlok
/etc/systemd/system/server-*.service

# Példa: egy adott service fájl megtekintése
cat /etc/systemd/system/server-cmihrfe3m0001afyuzsjijhaz.service
```

## 🔍 Részletes Információk

### Egy Service Státusza

```bash
# Részletes státusz információ
systemctl status server-cmihrfe3m0001afyuzsjijhaz

# Rövidebb státusz
systemctl is-active server-cmihrfe3m0001afyuzsjijhaz
systemctl is-enabled server-cmihrfe3m0001afyuzsjijhaz
```

### Service Logok Megtekintése

```bash
# Utolsó 50 sor log
journalctl -u server-cmihrfe3m0001afyuzsjijhaz -n 50

# Valós idejű log követés
journalctl -u server-cmihrfe3m0001afyuzsjijhaz -f

# Ma létrehozott logok
journalctl -u server-cmihrfe3m0001afyuzsjijhaz --since today

# Utolsó 1 óra logjai
journalctl -u server-cmihrfe3m0001afyuzsjijhaz --since "1 hour ago"

# Hibák keresése
journalctl -u server-cmihrfe3m0001afyuzsjijhaz -p err
```

## 🎮 Gyakorlati Példák

### Összes Játék Szerver Service Listázása

```bash
# Aktív játék szerver service-ek
systemctl list-units --type=service --state=running | grep "^server-"

# Összes játék szerver service (aktív és inaktív)
systemctl list-units --type=service --all | grep "^server-"

# Csak a service nevek
systemctl list-units --type=service --all --no-legend | grep "^server-" | awk '{print $1}'
```

### Service-ek Számlálása

```bash
# Hány játék szerver service van összesen
systemctl list-units --type=service --all | grep "^server-" | wc -l

# Hány aktív játék szerver service van
systemctl list-units --type=service --state=running | grep "^server-" | wc -l
```

### Service-ek Automatikus Indítása

```bash
# Mely service-ek indítódnak automatikusan (enabled)
systemctl list-unit-files | grep server- | grep enabled

# Mely service-ek NEM indítódnak automatikusan (disabled)
systemctl list-unit-files | grep server- | grep disabled
```

## 🛠️ Service Kezelés

### Service Indítása/Leállítása

```bash
# Service indítása
sudo systemctl start server-cmihrfe3m0001afyuzsjijhaz

# Service leállítása
sudo systemctl stop server-cmihrfe3m0001afyuzsjijhaz

# Service újraindítása
sudo systemctl restart server-cmihrfe3m0001afyuzsjijhaz

# Service újratöltése (konfiguráció újratöltése)
sudo systemctl reload server-cmihrfe3m0001afyuzsjijhaz
```

### Automatikus Indítás Be/Kikapcsolása

```bash
# Automatikus indítás bekapcsolása (szerver újraindítás után is elindul)
sudo systemctl enable server-cmihrfe3m0001afyuzsjijhaz

# Automatikus indítás kikapcsolása
sudo systemctl disable server-cmihrfe3m0001afyuzsjijhaz
```

### Service Törlése

```bash
# Service leállítása és törlése
sudo systemctl stop server-cmihrfe3m0001afyuzsjijhaz
sudo systemctl disable server-cmihrfe3m0001afyuzsjijhaz
sudo rm /etc/systemd/system/server-cmihrfe3m0001afyuzsjijhaz.service
sudo systemctl daemon-reload
```

## 📊 Hasznos Parancsok Összefoglalása

```bash
# Összes játék szerver service listázása
systemctl list-units --type=service --all | grep "^server-"

# Egy service státusza
systemctl status server-{serverId}

# Service logok
journalctl -u server-{serverId} -f

# Service indítása
sudo systemctl start server-{serverId}

# Service leállítása
sudo systemctl stop server-{serverId}

# Service újraindítása
sudo systemctl restart server-{serverId}

# Automatikus indítás bekapcsolása
sudo systemctl enable server-{serverId}

# Automatikus indítás kikapcsolása
sudo systemctl disable server-{serverId}
```

## 🔧 Systemd Daemon Újratöltése

Ha módosítasz service fájlokat, mindig újra kell tölteni a systemd daemon-t:

```bash
sudo systemctl daemon-reload
```

## 📝 Service Fájl Szerkezete

Egy tipikus játék szerver service fájl így néz ki:

```ini
[Unit]
Description=Game Server cmihrfe3m0001afyuzsjijhaz (SATISFACTORY)
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/servers/cmihrfe3m0001afyuzsjijhaz
ExecStart=/opt/servers/cmihrfe3m0001afyuzsjijhaz/FactoryGame/Binaries/Linux/FactoryGameServer -log -unattended -ServerQueryPort=15777 -BeaconPort=15000 -Port=7777
Restart=always
RestartSec=10
MemoryMax=4G

[Install]
WantedBy=multi-user.target
```

## 🚨 Hibaelhárítás

### Service Nem Indul

```bash
# Részletes státusz
systemctl status server-{serverId}

# Logok ellenőrzése
journalctl -u server-{serverId} -n 100

# Service fájl ellenőrzése
cat /etc/systemd/system/server-{serverId}.service

# Syntax ellenőrzés
systemctl daemon-reload
systemctl status server-{serverId}
```

### Service Folyamatosan Újraindul

```bash
# Logok ellenőrzése (gyakran hibák miatt újraindul)
journalctl -u server-{serverId} -n 100 | grep -i error

# RestartSec beállítás ellenőrzése
grep RestartSec /etc/systemd/system/server-{serverId}.service
```

## 📚 További Hasznos Parancsok

```bash
# Összes service típus listázása
systemctl list-units --type=service

# Csak a failed service-ek
systemctl list-units --type=service --state=failed

# Service-ek betöltési ideje
systemd-analyze blame | grep server-

# Systemd teljesítmény elemzés
systemd-analyze
```

