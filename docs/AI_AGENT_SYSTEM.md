# AI+Ügynök Rendszer Dokumentáció

## Áttekintés

Ez a dokumentáció leírja az AI+ügynök rendszer implementációját, amely segít a fejlesztésben, tesztelésben, hibakeresésben és javításban mind a központi gépen, mind a szerver gépeken.

## Architektúra

### Komponensek

1. **AI Development Assistant** (központi gépen)
   - Kód elemzés és review
   - Tesztek generálása
   - Hibakeresés logokból
   - Automatikus javítások javaslása

2. **AI Server Agent** (szerver gépeken)
   - Rendszer monitoring elemzése
   - Proaktív hibakeresés
   - Konfiguráció optimalizálás
   - Prediktív karbantartás

3. **Admin Chat Felület**
   - Interaktív chat az admin panelben
   - Valós idejű streaming válaszok
   - Konverzációk mentése

## Erőforrás Optimalizálás

### Központi Gép (CX33)
- **Specifikáció**: 4 vCPU, 8GB RAM, 80GB Disk
- **Ajánlott modell**: `phi3:mini` (~2.3GB RAM)
- **Környezeti változó**: `AI_DEV_MODEL=phi3:mini`

### Szerver Gép
- **Specifikáció**: 32 mag, 256GB RAM, 2TB NVMe, 4TB HDD
- **Ajánlott modell**: `llama3.2:3b` vagy `phi3:mini` (sebesség miatt)
- **Környezeti változó**: `AI_SERVER_MODEL=llama3.2:3b`

## Adatbázis Séma

### AIAnalysis
- Kód és rendszer elemzések tárolása
- Típusok: `code`, `system`, `performance`, `error`
- Eredmények JSON formátumban

### AITask
- AI feladatok végrehajtása
- Típusok: `analyze`, `test`, `fix`, `optimize`, `generate`, `review`
- Státusz követés

### AIChatConversation & AIChatMessage
- Admin chat konverzációk
- Üzenetek mentése
- Metadata (modell, tokenek)

## API Endpoints

### Admin AI Chat
- `POST /api/admin/ai/chat` - Üzenet küldése
- `GET /api/admin/ai/chat` - Konverzációk listázása
- `GET /api/admin/ai/chat?conversationId=...` - Konverzáció lekérése

### AI Analyze
- `POST /api/admin/ai/analyze` - Kód elemzés, teszt generálás, hibakeresés
  - `type`: `analyze`, `test`, `bugs`, `fixes`, `review`

## Használat

### Admin Chat

1. Navigálj az **Admin Panel → AI Chat** menüpontra
2. Írj be egy kérdést vagy kérést
3. Az AI válaszol streaming módban
4. Korábbi konverzációk a bal oldali sidebar-ban

### Kód Elemzés

```typescript
// API hívás
const response = await fetch('/api/admin/ai/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'analyze',
    filePath: '/path/to/file.ts',
  }),
});
```

### Teszt Generálás

```typescript
const response = await fetch('/api/admin/ai/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'test',
    filePath: '/path/to/file.ts',
  }),
});
```

### Hibakeresés Logokból

```typescript
const response = await fetch('/api/admin/ai/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'bugs',
    logContent: 'error log content...',
    context: 'additional context',
  }),
});
```

## Funkciók

### AI Development Assistant

1. **analyzeCode()** - Kód elemzés
   - Hibák keresése
   - Biztonsági problémák
   - Teljesítmény problémák
   - Best practice megsértések

2. **generateTests()** - Tesztek generálása
   - Unit tesztek
   - Teszt lefedettség becslés

3. **findBugsFromLogs()** - Hibakeresés logokból
   - Log elemzés
   - Hiba pattern recognition
   - Javaslatok

4. **suggestFixes()** - Javítás javaslatok
   - Automatikus javítások
   - Kód változtatások

5. **reviewCode()** - Kód review
   - Részletes review
   - Pontszám (0-10)
   - Javaslatok

### AI Server Agent

1. **analyzeSystem()** - Rendszer elemzés
   - Metrikák elemzése
   - Problémák azonosítása
   - Javaslatok

2. **optimizeConfig()** - Konfiguráció optimalizálás
   - Optimalizált konfiguráció
   - Várható javulás

3. **predictMaintenance()** - Prediktív karbantartás
   - Lehetséges problémák előrejelzése
   - Időkeret becslés

4. **suggestAutoFix()** - Automatikus javítás javaslatok
   - Parancsok generálása
   - Rollback lehetőség

## Telepítés

### ✅ AUTOMATIKUS TELEPÍTÉS

Az AI rendszer **teljesen automatikusan** települ, nincs szükség manuális beavatkozásra!

#### Központi Gép

Az AI rendszer automatikusan települ:
- ✅ **Rendszer frissítéskor** (Admin Panel → Rendszer → Frissítés)
- ✅ **npm install során** (postinstall script)
- ✅ **Build után** (automatikus)

#### Szerver Gép

Az AI rendszer automatikusan települ:
- ✅ **Agent telepítéskor** (Admin Panel → Szerver Gépek → Install Agent)
- ✅ **Agent indításkor** (automatikus ellenőrzés)

**Nincs szükség manuális beavatkozásra!** 🎉

### Manuális Telepítés (Csak Ha Szükséges)

Ha valamiért az automatikus telepítés nem működik:

#### 1. Adatbázis Migráció

```bash
npx prisma generate
npx prisma db push
```

#### 2. Környezeti Változók (Opcionális)

```env
# Központi gép - könnyű modell
AI_DEV_MODEL=phi3:mini

# Szerver gép - nagyobb modell (opcionális)
AI_SERVER_MODEL=llama3.2:3b

# Ollama URL
OLLAMA_URL=http://localhost:11434
```

#### 3. Manuális Modell Letöltés (Csak Ha Szükséges)

```bash
# Központi gép
ollama pull phi3:mini

# Szerver gép (opcionális)
ollama pull llama3.2:3b
```

**Megjegyzés**: Az automatikus telepítés során a modellek automatikusan letöltődnek.

## Biztonság

- Admin jogosultság szükséges minden AI funkcióhoz
- Audit log minden AI műveletről
- Sandbox környezet a kód futtatáshoz (jövőbeli fejlesztés)
- Manuális jóváhagyás kritikus változtatásokhoz (jövőbeli fejlesztés)

## Teljesítmény

- Aszinkron feldolgozás
- Streaming válaszok a chat-ben
- Cache az ismétlődő elemzésekhez (jövőbeli fejlesztés)
- Rate limiting (jövőbeli fejlesztés)

## Jövőbeli Fejlesztések

- [ ] WebSocket integráció valós idejű kommunikációhoz
- [ ] Automatikus kód javítás (sandbox környezetben)
- [ ] Tanulás a múltbeli hibákból
- [ ] Pattern recognition fejlesztése
- [ ] Automatikus dokumentáció generálás
- [ ] Performance profiling
- [ ] Integráció CI/CD pipeline-ba

## Hibaelhárítás

### Ollama nem elérhető

```bash
# Ellenőrizd, hogy fut-e
curl http://localhost:11434/api/tags

# Ha nem fut, indítsd el
docker-compose up -d ollama
# vagy
ollama serve
```

### Modell nem található

```bash
# Listázd a modelleket
ollama list

# Töltsd le a modellt
ollama pull phi3:mini
```

### API hiba

- Ellenőrizd a `.env` fájlban az `OLLAMA_URL` és modell értékeket
- Nézd meg a konzol logokat
- Ellenőrizd a szerver logokat

## Példák

### Chat használat

```
Felhasználó: "Elemezd a lib/error-handler.ts fájlt"
AI: "Elemeztem a fájlt és találtam 3 javaslatot:
1. Error handling bővítése
2. Type safety javítása
3. Logging hozzáadása"
```

### Kód elemzés

```json
{
  "issues": [
    {
      "severity": "warning",
      "message": "Missing error handling",
      "location": "line 45",
      "suggestion": "Add try-catch block"
    }
  ],
  "suggestions": [
    {
      "type": "refactor",
      "message": "Extract error handling to separate function",
      "code": "..."
    }
  ],
  "confidence": 0.85
}
```

## Automatikus Telepítés Részletek

Lásd: [AI Automatikus Telepítés Dokumentáció](./AI_AUTO_INSTALL.md)

## Kapcsolódó Dokumentáció

- [AI Chat Setup](./AI_CHAT_SETUP.md)
- [AI Model Comparison](./AI_MODEL_COMPARISON.md)
- [Agent Architecture](./AGENT_ARCHITECTURE.md)
- [AI Automatikus Telepítés](./AI_AUTO_INSTALL.md)
- [AI Automatikus Kód Írás](./AI_AUTO_CODE.md)

