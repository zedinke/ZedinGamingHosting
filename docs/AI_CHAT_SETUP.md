# AI Chat Rendszer Beállítás

Ez a dokumentum leírja, hogyan kell beállítani a helyben futó AI chat rendszert a platformon.

## Áttekintés

A rendszer egy helyben futó LLM-et (Large Language Model) használ az Ollama segítségével, hogy magyar nyelvű, hostingra specializált válaszokat adjon a felhasználóknak.

## Funkciók

- ✅ Jobb oldali slide-in chat panel
- ✅ Lebegő chat gomb minden oldalon (csak bejelentkezett felhasználóknak)
- ✅ Konverzációk mentése az adatbázisban
- ✅ Magyar nyelvű válaszok
- ✅ Hostingra specializált AI
- ✅ **AUTOMATIKUS TELEPÍTÉS ÉS BEÁLLÍTÁS** - Nincs szükség manuális beállításra!

## Automatikus Telepítés

A rendszer **automatikusan** telepíti és beállítja az Ollama-t:

### Docker Compose használatával (Ajánlott)

Ha Docker Compose-t használsz, az Ollama automatikusan elindul:

```bash
docker-compose up -d
```

Az Ollama container automatikusan:
- ✅ Elindul
- ✅ Letölti a szükséges modellt
- ✅ Elérhető lesz az alkalmazás számára

### PM2 vagy Standalone használatával

Ha PM2-vel vagy standalone módban futtatod, a rendszer automatikusan:

1. **Telepítéskor** (`npm install`): Automatikusan beállítja az Ollama-t
2. **Indításkor** (`npm start`): Ellenőrzi és beállítja, ha szükséges
3. **Chat használatkor**: Automatikusan letölti a modellt, ha hiányzik

**Nincs szükség manuális beállításra!**

## Manuális Telepítés (Opcionális)

Ha manuálisan szeretnéd beállítani:

### Linux (Ubuntu/Debian)

```bash
# Ollama telepítése
curl -fsSL https://ollama.com/install.sh | sh

# Szolgáltatás indítása
sudo systemctl start ollama
sudo systemctl enable ollama
```

### Windows

1. Töltsd le az Ollama-t: https://ollama.com/download
2. Telepítsd és indítsd el az alkalmazást

### macOS

```bash
# Homebrew használatával
brew install ollama

# Vagy töltsd le a hivatalos telepítőt: https://ollama.com/download
```

## Modell Letöltése

A rendszer alapértelmezetten a `llama3` modellt használja. Magyar nyelvű modellek letöltése:

```bash
# Alapértelmezett modell (angol, de magyarul is tud válaszolni)
ollama pull llama3

# Vagy magyar modell (ha elérhető)
ollama pull magyar-llama3

# További opciók:
ollama pull mistral
ollama pull llama2
```

## Környezeti Változók (Opcionális)

Az alapértelmezett beállítások automatikusan működnek. Ha testre szeretnéd szabni, add hozzá a `.env` fájlhoz:

```env
# Ollama konfiguráció (opcionális)
OLLAMA_URL=http://localhost:11434  # Docker Compose esetén: http://ollama:11434
OLLAMA_MODEL=llama3  # Választható: llama3, mistral, llama2, stb.
```

**Megjegyzés**: 
- Docker Compose esetén az `OLLAMA_URL` automatikusan be van állítva
- Ha nem adod meg, az alapértelmezett értékeket használja

## Adatbázis Migráció

A chat funkcióhoz új adatbázis táblák szükségesek. Ez automatikusan megtörténik a `npm run db:push` vagy `npm install` során.

Ha manuálisan szeretnéd futtatni:

```bash
# Prisma client generálása
npm run db:generate

# Adatbázis migráció
npm run db:push
```

## Tesztelés

1. **Docker Compose esetén**: `docker-compose up -d`
2. **PM2/Standalone esetén**: `npm start` (automatikusan beállítja)
3. Bejelentkezz a platformra
4. Kattints a jobb alsó sarokban lévő chat gombra
5. Írj be egy kérdést, például: "Hogyan állítsak be egy Minecraft szervert?"

**Megjegyzés**: Az első használatkor a rendszer automatikusan letölti a modellt, ha még nincs letöltve. Ez eltarthat néhány percig.

## Hibaelhárítás

### Ollama nem elérhető

```bash
# Ellenőrizd, hogy fut-e
curl http://localhost:11434/api/tags

# Ha nem fut, indítsd el
ollama serve
```

### Modell nem található

```bash
# Listázd a letöltött modelleket
ollama list

# Ha nincs modell, töltsd le
ollama pull llama3
```

### API hiba a chat-ben

- Ellenőrizd a `.env` fájlban az `OLLAMA_URL` és `OLLAMA_MODEL` értékeket
- Nézd meg a konzol logokat a böngészőben (F12)
- Ellenőrizd a szerver logokat

## Fejlesztett Funkciók ✅

### RAG (Retrieval Augmented Generation) ✅

A rendszer automatikusan használja a FAQ adatbázist a válaszok generálásához. Releváns FAQ kérdések és válaszok automatikusan bekerülnek a kontextusba.

### Kontextus Bővítés ✅

A felhasználó szervereinek, előfizetéseinek és számláinak adatai automatikusan bekerülnek a kontextusba, így a válaszok személyre szabottak.

### Streaming Válaszok ✅

Valós idejű válaszgenerálás - a válaszok folyamatosan jelennek meg, ahogy az AI generálja őket.

### Játék Specifikus Dokumentáció ✅

A rendszer tartalmaz játék specifikus információkat (Minecraft, ARK, Rust, Valheim, Palworld, stb.), amelyeket automatikusan használ a válaszokban.

### Fejlett System Prompt ✅

Részletes, strukturált system prompt biztosítja a pontos és releváns válaszokat.

## Biztonság

- A chat csak bejelentkezett felhasználóknak elérhető
- Minden konverzáció a felhasználóhoz van kötve
- Az AI válaszok nem tartalmaznak érzékeny adatokat

## Teljesítmény

- Az Ollama helyben fut, így nincs külső API hívás
- A válaszok sebessége függ a modell méretétől és a hardver teljesítményétől
- Nagyobb modellek lassabbak, de pontosabbak

