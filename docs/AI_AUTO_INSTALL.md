# AI Rendszer Automatikus Telepítés Dokumentáció

## Áttekintés

Az AI rendszer **teljesen automatikusan** települ minden gépre, nincs szükség manuális beavatkozásra.

## Automatikus Telepítési Pontok

### 1. Központi Gép - Rendszer Frissítéskor

Amikor a rendszer frissítés történik (Admin Panel → Rendszer → Frissítés):

1. **Git pull** - Új kód letöltése
2. **npm install** - Függőségek telepítése
3. **DB migráció** - Adatbázis frissítés
4. **Build** - Production build
5. **AI rendszer telepítés** ✅ **AUTOMATIKUS**
   - Ollama ellenőrzés/telepítés
   - Modell letöltés (`phi3:mini` - központi géphez optimalizált)
   - AI Development Assistant fájlok ellenőrzése
6. **Restart** - Szolgáltatás újraindítás

**Nincs szükség manuális beavatkozásra!**

### 2. Szerver Gép - Agent Telepítéskor

Amikor új szerver gépre telepíted az agentet (Admin Panel → Szerver Gépek → Install Agent):

1. **Node.js telepítés** (ha nincs)
2. **Agent telepítés**
3. **SteamCMD telepítés**
4. **Systemd service létrehozás**
5. **AI rendszer telepítés** ✅ **AUTOMATIKUS**
   - Ollama telepítés (ha nincs)
   - Ollama service indítás
   - Modell letöltés (`llama3.2:3b` vagy `phi3:mini` - szerver géphez optimalizált)
6. **Agent indítás**

**Nincs szükség manuális beavatkozásra!**

### 3. NPM Install Során

Amikor `npm install` fut (központi gépen):

1. **Függőségek telepítése**
2. **Uploads könyvtárak létrehozása**
3. **Ollama beállítás**
4. **AI rendszer telepítés** ✅ **AUTOMATIKUS**

**Nincs szükség manuális beavatkozásra!**

### 4. Agent Indításkor

Amikor az agent elindul (szerver gépen):

1. **Agent regisztráció**
2. **Heartbeat küldés**
3. **AI rendszer telepítés** ✅ **AUTOMATIKUS** (háttérben, 10 másodperc után)

**Nincs szükség manuális beavatkozásra!**

## Telepítési Folyamat Részletei

### Központi Gép

```bash
# Automatikusan meghívódik:
node scripts/setup-ai-system.js
# Környezeti változó: AI_SERVER_MODE=false
# Modell: phi3:mini (könnyű, gyors)
```

**Telepített komponensek:**
- AI Development Assistant (`lib/ai/development-assistant.ts`)
- AI Code Writer (`lib/ai/code-writer.ts`)
- AI Web Search (`lib/ai/web-search.ts`)
- Admin Chat API (`app/api/admin/ai/chat/route.ts`)
- Admin Chat UI (`components/admin/AIChatPanel.tsx`)

### Szerver Gép

```bash
# Automatikusan meghívódik az agent telepítési scriptben:
# - Ollama telepítés
# - Ollama service indítás
# - Modell letöltés (llama3.2:3b vagy phi3:mini)
# Környezeti változó: AI_SERVER_MODE=true
```

**Telepített komponensek:**
- AI Server Agent (`lib/ai/server-agent.ts`)
- Ollama szolgáltatás
- AI modell (szerver géphez optimalizált)

## Modell Választás

### Központi Gép (4 vCPU, 8GB RAM)
- **Modell**: `phi3:mini`
- **Méret**: ~2.3GB RAM
- **Sebesség**: Gyors
- **Minőség**: Jó

### Szerver Gép (32 mag, 256GB RAM)
- **Modell**: `llama3.2:3b` (alapértelmezett) vagy `phi3:mini`
- **Méret**: ~2GB RAM (llama3.2:3b) vagy ~2.3GB RAM (phi3:mini)
- **Sebesség**: Gyors
- **Minőség**: Jó

## Környezeti Változók

Az automatikus telepítés a következő környezeti változókat használja:

```env
# Ollama URL
OLLAMA_URL=http://localhost:11434

# Központi gép modell
AI_DEV_MODEL=phi3:mini

# Szerver gép modell
AI_SERVER_MODEL=llama3.2:3b

# Automatikus környezet detektálás
AI_SERVER_MODE=false  # Központi gép
AI_SERVER_MODE=true   # Szerver gép
```

## Telepítési Script

A `scripts/setup-ai-system.js` script:

1. **Környezet detektálás** - Központi vagy szerver gép?
2. **Ollama ellenőrzés** - Elérhető-e?
3. **Ollama telepítés** - Ha nincs (csak Linux)
4. **Modell ellenőrzés** - Letöltve van-e?
5. **Modell letöltés** - Ha nincs
6. **Fájlok ellenőrzése** - AI komponensek megtalálhatók-e?

## Hibakezelés

### Ollama nem elérhető

- **Központi gép**: Figyelmeztetés, de a frissítés folytatódik
- **Szerver gép**: Figyelmeztetés, de az agent telepítés folytatódik
- **Megoldás**: Az AI funkciók később is működhetnek, amikor az Ollama elérhető lesz

### Modell letöltés hiba

- **Központi gép**: Figyelmeztetés, de a frissítés folytatódik
- **Szerver gép**: Figyelmeztetés, de az agent telepítés folytatódik
- **Megoldás**: A modell automatikusan letöltődik az első AI használatkor

### Fájlok hiányoznak

- **Központi gép**: Figyelmeztetés, de a frissítés folytatódik
- **Szerver gép**: Figyelmeztetés, de az agent telepítés folytatódik
- **Megoldás**: A fájlok a git pull során automatikusan települnek

## Ellenőrzés

### Központi Gép

```bash
# Ollama ellenőrzés
curl http://localhost:11434/api/tags

# Modell ellenőrzés
ollama list

# AI fájlok ellenőrzés
ls -la lib/ai/
ls -la app/api/admin/ai/
```

### Szerver Gép

```bash
# Ollama ellenőrzés
curl http://localhost:11434/api/tags

# Modell ellenőrzés
ollama list

# AI fájlok ellenőrzés (ha van hozzáférés)
ls -la /opt/game-server-agent/
```

## Manuális Telepítés (Ha Szükséges)

Ha valamiért az automatikus telepítés nem működik:

### Központi Gép

```bash
cd /path/to/project
node scripts/setup-ai-system.js
```

### Szerver Gép

```bash
# SSH-n keresztül
ssh user@server-machine
cd /opt/game-server-agent
export AI_SERVER_MODE=true
node ../../scripts/setup-ai-system.js
```

## Jövőbeli Fejlesztések

- [ ] Automatikus modell frissítés
- [ ] Modell verzió kezelés
- [ ] Telepítési státusz API
- [ ] Telepítési logok admin panelben

## Összefoglalás

✅ **Teljesen automatikus** - Nincs szükség manuális beavatkozásra
✅ **Rendszer frissítéskor** - Központi gépen automatikusan települ
✅ **Agent telepítéskor** - Szerver gépen automatikusan települ
✅ **NPM install során** - Központi gépen automatikusan települ
✅ **Agent indításkor** - Szerver gépen automatikusan települ
✅ **Hibakezelés** - Nem blokkolja a fő folyamatokat
✅ **Erőforrás optimalizált** - Megfelelő modell minden gépen

**Nincs szükség semmilyen manuális beavatkozásra!** 🎉


