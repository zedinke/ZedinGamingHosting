# Game Server Agent

Ez az agent alkalmazás a szerver gépeken fut, és kezeli a game szervereket.

## Funkciók

- Docker container kezelés
- Systemd service kezelés
- Szerver indítás/leállítás/újraindítás
- Erőforrás monitoring (CPU, RAM, Disk, Network)
- Fájlkezelés
- Konzol hozzáférés
- Backup készítés
- Port kezelés

## Telepítés

### Előfeltételek

- Node.js 20+ vagy Python 3.10+
- Docker (ha Docker-t használunk)
- Systemd (ha systemd-t használunk)
- SSH hozzáférés

### Node.js Verzió

```bash
# Klónozás
git clone https://github.com/zedinke/ZedinGamingHosting.git
cd ZedinGamingHosting/agent

# Függőségek telepítése
npm install

# Környezeti változók beállítása
cp .env.example .env
# Szerkeszd a .env fájlt

# Agent indítása
npm start
```

### Python Verzió

```bash
# Klónozás
git clone https://github.com/zedinke/ZedinGamingHosting.git
cd ZedinGamingHosting/agent

# Virtual environment létrehozása
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Függőségek telepítése
pip install -r requirements.txt

# Környezeti változók beállítása
cp .env.example .env
# Szerkeszd a .env fájlt

# Agent indítása
python agent.py
```

## Konfiguráció

### .env Fájl

```env
# Manager API URL
MANAGER_URL=https://your-domain.com/api/agent

# Agent ID (egyedi azonosító)
AGENT_ID=agent-12345

# API Key (a manager generálja)
API_KEY=your-api-key-here

# Szerver könyvtár
SERVER_DIR=/opt/servers

# Backup könyvtár
BACKUP_DIR=/opt/backups

# Docker socket (ha Docker-t használunk)
DOCKER_SOCKET=/var/run/docker.sock

# Systemd service prefix (ha systemd-t használunk)
SYSTEMD_PREFIX=server-
```

## API Endpoints

Az agent a következő API-kat hívja meg a manager-en:

- `POST /api/agent/register` - Agent regisztráció
- `POST /api/agent/heartbeat` - Heartbeat küldés
- `GET /api/agent/tasks` - Feladatok lekérdezése
- `POST /api/agent/tasks/{id}/complete` - Feladat befejezése
- `POST /api/agent/tasks/{id}/fail` - Feladat sikertelenség

## Feladatok

Az agent a következő feladatokat tudja végrehajtani:

- `PROVISION` - Szerver létrehozása
- `START` - Szerver indítása
- `STOP` - Szerver leállítása
- `RESTART` - Szerver újraindítása
- `UPDATE` - Szerver frissítése
- `BACKUP` - Backup készítése
- `DELETE` - Szerver törlése

## Monitoring

Az agent 5 percenként küldi az erőforrás használatot:

- CPU használat (%)
- RAM használat (MB)
- Disk használat (MB)
- Network bejövő/kimenő (MB)
- Játékosok száma
- Uptime

## Biztonság

- API key autentikáció
- HTTPS kommunikáció
- SSH kulcs alapú fájlkezelés
- Docker/systemd jogosultságok

## Fejlesztés

### Node.js

```bash
npm run dev
```

### Python

```bash
python agent.py --dev
```

## Dokumentáció

Részletes dokumentáció: [Agent Architektúra](../docs/AGENT_ARCHITECTURE.md)

