# Google Drive API Beállítás Útmutató

Ez az útmutató bemutatja, hogyan állítsd be a Google Drive API-t a template rendszerhez.

## 📋 Szükséges Lépések

### 1. Google Cloud Console Projekt Létrehozása

**Fontos**: Ha elérted a projekt limitet, akkor:

**Opció A: Projekt limit növelés kérése**
1. A Google Cloud Console-ban kattints a **"Request increase"** gombra
2. Töltsd ki a kérvényt (általában 1-2 nap alatt jóváhagyják)
3. Várj a jóváhagyásra, majd hozz létre új projektet

**Opció B: Meglévő projekt használata (Ajánlott)**
1. Menj a [Google Cloud Console](https://console.cloud.google.com/)-ra
2. Jelentkezz be a Google fiókoddal
3. Válassz egy meglévő projektet:
   - Kattints a projekt választóra (felső menü)
   - Válassz egy meglévő projektet a listából
   - **Nincs szükség új projekt létrehozására!**

**Opció C: Régi projektek törlése**
1. Menj a **"Manage Resources"** oldalra
2. Töröld vagy ütemezd a törlését a nem használt projekteknek
3. Várj 30 napot, vagy kérj azonnali törlést

**Új projekt létrehozása (ha van hely):**
1. Menj a [Google Cloud Console](https://console.cloud.google.com/)-ra
2. Jelentkezz be a Google fiókoddal
3. Hozz létre egy új projektet vagy válassz egy meglévőt:
   - Kattints a projekt választóra (felső menü)
   - Kattints az **"Új projekt"** gombra
   - Add meg a projekt nevét: `ZedinGamingHosting` (vagy tetszőleges)
   - Kattints a **"Létrehozás"** gombra

### 2. Google Drive API Engedélyezése

1. A projektben menj a **"API-k és szolgáltatások"** > **"Könyvtár"** menüpontra
2. Keress rá: **"Google Drive API"**
3. Kattints a **"Google Drive API"**-ra
4. Kattints az **"Engedélyezés"** gombra

### 3. API Kulcs Létrehozása

1. Menj a **"API-k és szolgáltatások"** > **"Hitelesítő adatok"** menüpontra
2. Kattints a **"+ Hitelesítő adatok létrehozása"** gombra
3. Válaszd az **"API kulcs"** opciót
4. Másold ki a generált API kulcsot (pl: `AIzaSyB...`)
5. **Fontos**: Kattints a **"Korlátozás"** gombra a biztonság érdekében:
   - **API korlátozások**: Válaszd a **"Google Drive API"**-t
   - **Alkalmazás korlátozások**: Opcionális, de ajánlott (pl. IP cím korlátozás)

### 4. Google Drive Mappa Létrehozása és Megosztás

1. Menj a [Google Drive](https://drive.google.com/)-ra
2. Hozz létre egy új mappát: **"Game Server Templates"** (vagy tetszőleges név)
3. Kattints jobb gombbal a mappára > **"Megosztás"**
4. Állítsd be a megosztást:
   - **Hozzáférés**: **"Bárki, aki rendelkezik a linkkel"** > **"Megtekintő"**
   - Másold ki a mappa URL-jét (pl: `https://drive.google.com/drive/folders/1ABC...`)
5. A mappa ID-t a URL-ből nyerheted ki:
   - Példa URL: `https://drive.google.com/drive/folders/1ABC123xyz456`
   - Mappa ID: `1ABC123xyz456` (az URL utolsó része a `/folders/` után)

### 5. .env Fájl Frissítése

Add hozzá a következő sorokat a `.env` fájlhoz:

```env
# ============================================
# GOOGLE DRIVE API (Template rendszer)
# ============================================
GOOGLE_DRIVE_API_KEY=AIzaSyB... # Az API kulcs, amit a Google Cloud Console-ból kaptál
GOOGLE_DRIVE_FOLDER_ID=1ABC123xyz456 # A mappa ID, amit a Google Drive URL-ből nyertél ki
```

### 6. Template Fájlok Feltöltése

A template fájlokat manuálisan kell feltölteni a Google Drive mappába:

1. Menj a létrehozott Google Drive mappába
2. Töltsd fel a template fájlokat:
   - `7days2die-template-v1.0.tar.gz`
   - `ark-ascended-template-v1.0.tar.gz`
   - `ark-evolved-template-v1.0.tar.gz`
   - `rust-template-v1.0.tar.gz`
   - stb.

3. **Fontos**: A fájlok neve pontosan egyezzen meg a template definícióban lévő `fileName`-mel:
   - `lib/game-templates/models/templates.ts` fájlban található

### 7. Template File ID Frissítése

Miután feltöltötted a fájlokat, frissítsd a template definíciókat a fájl ID-kkal:

1. A Google Drive-ban kattints jobb gombbal a feltöltött fájlra
2. Válaszd a **"Link másolása"** opciót
3. A linkből nyerd ki a fájl ID-t:
   - Példa link: `https://drive.google.com/file/d/1XYZ789abc123/view?usp=sharing`
   - Fájl ID: `1XYZ789abc123` (a `/d/` és `/view` közötti rész)

4. Frissítsd a `lib/game-templates/models/templates.ts` fájlban a `fileId` mezőt:

```typescript
gdrive: {
  fileId: '1XYZ789abc123', // A Google Drive fájl ID
  fileName: '7days2die-template-v1.0.tar.gz',
  sizeGb: 20,
},
```

## ✅ Ellenőrzés

### API Kulcs Tesztelése

Teszteld az API kulcsot egy egyszerű HTTP kéréssel:

```bash
curl "https://www.googleapis.com/drive/v3/files?q=name='7days2die-template-v1.0.tar.gz'&key=YOUR_API_KEY"
```

Ha helyes, választ kapsz a fájlokról.

### Mappa Hozzáférés Tesztelése

```bash
curl "https://www.googleapis.com/drive/v3/files?q='FOLDER_ID'+in+parents&key=YOUR_API_KEY"
```

Cseréld ki:
- `FOLDER_ID` - a Google Drive mappa ID
- `YOUR_API_KEY` - az API kulcs

## 🔒 Biztonsági Ajánlások

1. **API Kulcs Korlátozása**: 
   - Korlátozd az API kulcsot csak a Google Drive API-ra
   - Opcionálisan IP cím korlátozást is beállíthatsz

2. **Mappa Megosztás**:
   - Ne oszd meg a mappát "Szerkesztő" jogosultsággal
   - "Megtekintő" jogosultság elég a letöltéshez

3. **Service Account (Opcionális, fejlettebb)**:
   - Ha nagyobb biztonságra van szükség, használj Service Account-ot
   - Ez OAuth2 autentikációt igényel

## 📝 Jelenlegi Template Fájlok

A következő template fájlokra van szükség:

- `7days2die-template-v1.0.tar.gz` - 7 Days to Die
- `ark-ascended-template-v1.0.tar.gz` - ARK Survival Ascended
- `ark-evolved-template-v1.0.tar.gz` - ARK Survival Evolved
- `rust-template-v1.0.tar.gz` - Rust

**Megjegyzés**: A template fájlokat a `scripts/build-7days-template.sh` script segítségével hozhatod létre, majd manuálisan töltheted fel a Google Drive-ra.

## 🚀 Következő Lépések

1. ✅ Google Cloud Console projekt létrehozása
2. ✅ Google Drive API engedélyezése
3. ✅ API kulcs létrehozása
4. ✅ Google Drive mappa létrehozása és megosztása
5. ✅ `.env` fájl frissítése
6. ⏳ Template fájlok build-elése (`scripts/build-7days-template.sh`)
7. ⏳ Template fájlok feltöltése Google Drive-ra
8. ⏳ Template definíciók frissítése a fájl ID-kkal

## ❓ Hibaelhárítás

### "GOOGLE_DRIVE_API_KEY nincs beállítva" figyelmeztetés

- Ellenőrizd, hogy a `.env` fájlban szerepel-e a `GOOGLE_DRIVE_API_KEY`
- Indítsd újra az alkalmazást a változások érvényesítéséhez

### "Template fileId is not set" hiba

- Frissítsd a `lib/game-templates/models/templates.ts` fájlban a `fileId` mezőket
- Ellenőrizd, hogy a fájlok feltöltve vannak-e a Google Drive mappába

### "Google Drive API error: 403" hiba

- Ellenőrizd, hogy a Google Drive API engedélyezve van-e
- Ellenőrizd, hogy az API kulcs korlátozásai megfelelőek-e
- Ellenőrizd, hogy a mappa megosztva van-e

### "Google Drive API error: 404" hiba

- Ellenőrizd, hogy a fájl ID helyes-e
- Ellenőrizd, hogy a fájl létezik-e a Google Drive-on
- Ellenőrizd, hogy a mappa ID helyes-e

