# Automatikus Kód Írás és Javítás Dokumentáció

## Áttekintés

Az AI rendszer most már képes automatikusan kódot írni és javítani, valamint internetes keresést végezni, ha szükséges információra van szüksége.

## Funkciók

### 1. Automatikus Kód Generálás

Az AI képes új kódot generálni prompt alapján.

**Példa használat:**
```
"Írj egy új API endpointot a felhasználók listázásához"
"Készíts egy új komponenst a dashboard számára"
"Generálj egy utility függvényt dátum formázásához"
```

**API hívás:**
```typescript
POST /api/admin/ai/code
{
  "action": "generate",
  "prompt": "Írj egy új API endpointot...",
  "filePath": "app/api/users/route.ts", // opcionális
  "context": "További kontextus...", // opcionális
  "useWebSearch": true // opcionális
}
```

### 2. Automatikus Kód Javítás

Az AI automatikusan javítja a problémákat a kódban.

**Példa használat:**
```
"Javítsd a lib/error-handler.ts fájlt"
"Javítsd ki az összes TypeScript hibát a components mappában"
```

**API hívás:**
```typescript
POST /api/admin/ai/code
{
  "action": "fix",
  "filePath": "lib/error-handler.ts",
  "issues": [
    { "message": "Missing error handling", "location": "line 45" }
  ],
  "useWebSearch": true // opcionális
}
```

### 3. Fájl Írása

Kód írása fájlba.

**API hívás:**
```typescript
POST /api/admin/ai/code
{
  "action": "write",
  "filePath": "lib/utils/date.ts",
  "code": "export function formatDate..."
}
```

### 4. Backup Visszaállítás

Visszaállítás backup-ból.

**API hívás:**
```typescript
POST /api/admin/ai/code
{
  "action": "restore",
  "backupPath": ".ai-backups/file.ts.2024-01-01.backup",
  "filePath": "lib/file.ts"
}
```

## Internetes Keresés

Az AI képes internetes keresést végezni, ha szükséges információra van szüksége.

### Támogatott Keresőmotorok

1. **DuckDuckGo** (alapértelmezett, ingyenes)
   - Nincs API kulcs szükséges
   - HTML scraping alapú

2. **Google Custom Search** (opcionális)
   - API kulcs szükséges
   - Jobb minőségű eredmények

### Környezeti Változók

```env
# Google Search API (opcionális)
GOOGLE_SEARCH_API_KEY=your-api-key
GOOGLE_SEARCH_ENGINE_ID=your-search-engine-id
```

### Használat

A chat-ben bekapcsolható a "Web keresés" checkbox, vagy az API-ban a `useWebSearch: true` paraméterrel.

## Biztonság

### Engedélyezett Könyvtárak

Csak a következő könyvtárakban lehet módosítani:
- `lib/`
- `app/`
- `components/`
- `scripts/`
- `prisma/`

### Tiltott Fájlok

Ezeket a fájlokat nem módosíthatja az AI:
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `next.config.js`
- `prisma/schema.prisma` (csak migrációval)

### Backup Rendszer

Minden módosítás előtt automatikus backup készül:
- Hely: `.ai-backups/`
- Formátum: `filename.timestamp.backup`
- Visszaállítás: `restore` action

## Chat Használat

### Példa Beszélgetések

**1. Kód generálás:**
```
Felhasználó: "Írj egy új API endpointot a szerverek listázásához"
AI: [Generálja a kódot és megkérdezi, hogy írja-e fájlba]
```

**2. Kód javítás:**
```
Felhasználó: "Javítsd a lib/error-handler.ts fájlt, van benne egy TypeScript hiba"
AI: [Elemezi, javítja, és készít backup-ot]
```

**3. Web keresés:**
```
Felhasználó: "Hogyan kell Next.js 14-ben Server Actions-t használni?" [Web keresés bekapcsolva]
AI: [Keres az interneten, és válaszol a találatok alapján]
```

## API Endpoints

### POST /api/admin/ai/code

Kód írás/javítás műveletek.

**Actions:**
- `generate` - Kód generálás
- `fix` - Automatikus javítás
- `write` - Fájl írása
- `restore` - Backup visszaállítás

### POST /api/admin/ai/chat

Chat üzenet küldése (most már web kereséssel is).

**Paraméterek:**
- `message` - Üzenet
- `conversationId` - Konverzáció ID (opcionális)
- `stream` - Streaming válasz (opcionális)
- `useWebSearch` - Web keresés használata (opcionális)

## Példa Munkafolyamat

### 1. Kód Generálás és Írása

```typescript
// 1. Kód generálása
const generateResponse = await fetch('/api/admin/ai/code', {
  method: 'POST',
  body: JSON.stringify({
    action: 'generate',
    prompt: 'Írj egy új API endpointot a felhasználók listázásához',
    useWebSearch: true,
  }),
});

const { result } = await generateResponse.json();
// result.code - generált kód
// result.filePath - ajánlott fájl elérési út

// 2. Fájl írása
const writeResponse = await fetch('/api/admin/ai/code', {
  method: 'POST',
  body: JSON.stringify({
    action: 'write',
    filePath: result.filePath,
    code: result.code,
  }),
});
```

### 2. Kód Javítás

```typescript
// 1. Kód elemzés
const analyzeResponse = await fetch('/api/admin/ai/analyze', {
  method: 'POST',
  body: JSON.stringify({
    type: 'analyze',
    filePath: 'lib/error-handler.ts',
  }),
});

const { result } = await analyzeResponse.json();
// result.issues - talált problémák

// 2. Automatikus javítás
const fixResponse = await fetch('/api/admin/ai/code', {
  method: 'POST',
  body: JSON.stringify({
    action: 'fix',
    filePath: 'lib/error-handler.ts',
    issues: result.issues,
    useWebSearch: true,
  }),
});

const { result: fixResult } = await fixResponse.json();
// fixResult.backupPath - backup elérési út
// fixResult.changes - változtatások listája
```

## Hibaelhárítás

### "Fájl módosítás nem engedélyezett"

- Ellenőrizd, hogy a fájl engedélyezett könyvtárban van-e
- Ellenőrizd, hogy a fájl nincs a tiltott listán

### "Ollama nem elérhető"

- Indítsd el az Ollama-t: `docker-compose up -d ollama`
- Ellenőrizd a modellt: `ollama list`

### Web keresés nem működik

- DuckDuckGo automatikusan működik
- Google Search API-hoz szükséges API kulcs

## Jövőbeli Fejlesztések

- [ ] Git commit automatikus készítése
- [ ] Code review automatikus kérése
- [ ] Több fájl egyidejű módosítása
- [ ] Batch műveletek
- [ ] Sandbox környezet kód futtatáshoz




