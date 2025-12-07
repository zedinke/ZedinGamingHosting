# Sons of the Forest - Docker+Wine Telepítés

## ✅ HELYESBÍTÉS - Most már működik!

### Probléma Megoldása

**Eredeti hiba**: Rossz AppID használata
- ❌ 1326470 - Ez a JÁTÉK (client), nem szerver
- ✅ 2465200 - Ez a DEDIKÁLT SZERVER (ingyenes, működik)

**Technikai kihívás**: Nincs Linux verzió
- Endnight Games csak Windows szervert adott ki
- Debian 12-n Wine vagy Docker szükséges
- Docker + Wine megoldás = stabil, izolált környezet

---

## 📦 Telepítés Módszere

### Docker-alapú Megközelítés

```bash
# 1. Docker ellenőrzés/telepítés
docker --version || curl -fsSL https://get.docker.com | sh

# 2. Szerver telepítés (automatikus)
# Az installer script futtatja:
docker run --rm \
  -v /opt/servers/{serverId}:/data \
  cm2network/steamcmd:wine \
  +@sSteamCmdForcePlatformType windows \
  +force_install_dir /data \
  +login anonymous \
  +app_update 2465200 validate \
  +quit

# 3. Server indítás Docker containerben
docker run -d \
  --name sotf-server-{serverId} \
  --restart unless-stopped \
  -v /opt/servers/{serverId}:/server \
  -p 8766:8766/udp \
  -p 27016:27016/udp \
  -p 9700:9700/udp \
  cm2network/steamcmd:wine \
  wine /server/SonsOfTheForestDS.exe -batchmode -nographics
```

---

## 🎮 Szerver Információk

### Helyes AppID
- **AppID**: 2465200
- **Név**: Sons of the Forest Dedicated Server
- **Platform**: Windows (Wine emuláció szükséges)
- **Licenc**: Ingyenes
- **SteamCMD**: Anonymous login működik ✅

### Portok
| Port | Típus | Leírás |
|------|-------|--------|
| 8766 | UDP | Game Port (alapértelmezett) |
| 27016 | UDP | Query Port (Steam query) |
| 9700 | UDP | Blob Sync Port |

### Követelmények
- Docker 20.10+
- Wine (Docker image-ben)
- 4 GB RAM minimum
- 4 GB tárhely (szerver fájlok)

---

## 📁 Fájlstruktúra

```
/opt/servers/{serverId}/
├── SonsOfTheForestDS.exe          # Főprogram (Windows binary)
├── dedicatedserver.cfg            # Szerver konfiguráció
├── start-server.sh                # Indító script
├── stop-server.sh                 # Leállító script
├── userdata/                      # Játékos mentések
│   └── Multiplayer/
│       └── 0000000001/            # Szerver világ
└── logs/                          # Logfájlok
```

---

## ⚙️ Konfiguráció

### dedicatedserver.cfg
```json
{
  "IpAddress": "0.0.0.0",
  "GamePort": 8766,
  "QueryPort": 27016,
  "BlobSyncPort": 9700,
  "ServerName": "Sons of the Forest Server",
  "MaxPlayers": 8,
  "Password": "",
  "LanOnly": false,
  "SkipNetworkAccessibilityTest": false,
  "GameMode": "Normal",
  "GameSettings": {},
  "CustomGameModeSettings": {}
}
```

### Game Modes
- `Normal` - Normál túlélés
- `Hard` - Nehéz mód
- `Peaceful` - Békés (nincs ellenség)
- `Custom` - Egyedi beállítások

---

## 🚀 Kezelési Parancsok

### Indítás/Leállítás
```bash
# Indítás
bash /opt/servers/{serverId}/start-server.sh

# Leállítás
bash /opt/servers/{serverId}/stop-server.sh

# Újraindítás
bash /opt/servers/{serverId}/stop-server.sh && \
  sleep 2 && \
  bash /opt/servers/{serverId}/start-server.sh

# Státusz
docker ps -f name=sotf-server-{serverId}

# Logok
docker logs sotf-server-{serverId} --tail 100 -f
```

### Docker Parancsok
```bash
# Container belépés
docker exec -it sotf-server-{serverId} /bin/bash

# Resource használat
docker stats sotf-server-{serverId}

# Container újraindítás
docker restart sotf-server-{serverId}
```

---

## 🐛 Hibaelhárítás

### 1. Container nem indul
```bash
# Ellenőrizd a logokat
docker logs sotf-server-{serverId}

# Portok foglaltsága
netstat -tulpn | grep -E '8766|27016|9700'

# Container újraépítés
docker stop sotf-server-{serverId}
docker rm sotf-server-{serverId}
bash /opt/servers/{serverId}/start-server.sh
```

### 2. Wine hibák
```bash
# Frissebb image használata
docker pull cm2network/steamcmd:wine

# Alternatív Wine image
docker pull tianon/wine
```

### 3. Szerver nem látható
- Ellenőrizd firewall szabályokat: `ufw status`
- Nyisd meg a portokat: `ufw allow 8766/udp`
- Ellenőrizd router port forwardingot

### 4. Performance problémák
```bash
# CPU/RAM limit beállítás
docker update sotf-server-{serverId} \
  --cpus="2.0" \
  --memory="4g"

# Resource monitoring
docker stats sotf-server-{serverId}
```

---

## 📊 Teljesítmény

### Erőforrásigény (8 játékos)
- **CPU**: 2-4 core (Wine overhead miatt)
- **RAM**: 3-4 GB
- **Tárhely**: 4-6 GB
- **Hálózat**: 1-5 Mbps upload

### Docker Overhead
Wine emulációval ~20-30% extra CPU használat várható, de a konténerizáció izolált környezetet biztosít.

---

## 🔄 Frissítés

```bash
# Szerver leállítás
docker stop sotf-server-{serverId}

# Frissítés SteamCMD-vel
docker run --rm \
  -v /opt/servers/{serverId}:/data \
  cm2network/steamcmd:wine \
  +@sSteamCmdForcePlatformType windows \
  +force_install_dir /data \
  +login anonymous \
  +app_update 2465200 validate \
  +quit

# Újraindítás
docker start sotf-server-{serverId}
```

---

## 📝 Megjegyzések

### Miért Docker?
1. **Izoláció**: Minden szerver saját konténerben fut
2. **Wine verzió**: Konzisztens Wine környezet
3. **Egyszerű kezelés**: Start/stop egyszerűsített
4. **Skálázhatóság**: Könnyű több szerver kezelése
5. **Biztonság**: Konténer sandbox

### Alternatívák
- **Bare Wine**: Működik, de bonyolultabb kezelés
- **Proton**: Steam Play kompatibilitási réteg
- **VM**: Túl sok overhead

---

## ✅ Ellenőrzési Lista

- [x] Docker telepítve
- [x] Helyes AppID: 2465200
- [x] Wine support (cm2network/steamcmd:wine image)
- [x] Portok megnyitva (8766, 27016, 9700)
- [x] Konfiguráció létrehozva
- [x] Start/stop scriptek működnek
- [x] Container automatikus újraindítás beállítva

---

## 📞 Támogatás

**Dokumentáció**: [Endnight Games Wiki](https://endnightgames.com/)
**Steam**: [SteamDB AppID 2465200](https://steamdb.info/app/2465200/)
**Docker Image**: [cm2network/steamcmd](https://hub.docker.com/r/cm2network/steamcmd)

**ZedGaming Support**:
- Email: support@zedgaminghosting.hu
- Discord: https://discord.gg/zedgaming

---

**Státusz**: ✅ MŰKÖDIK (Docker + Wine)
**Utolsó frissítés**: 2025-12-07
