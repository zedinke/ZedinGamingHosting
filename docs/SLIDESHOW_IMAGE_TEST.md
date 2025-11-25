# Slideshow Képfeltöltés és Megjelenítés Tesztelési Dokumentáció

## Áttekintés

Ez a dokumentum leírja a slideshow képfeltöltési és képmegjelenítési funkciók tesztelését.

## Funkciók

### 1. Képfeltöltés (`/api/admin/upload/image`)

**Fájl:** `app/api/admin/upload/image/route.ts`

**Funkciók:**
- ✅ Admin jogosultság ellenőrzése
- ✅ Fájl típus validáció (csak image/*)
- ✅ Fájl méret validáció (max 10MB)
- ✅ Könyvtár létrehozása (`public/uploads/slideshow`)
- ✅ Jogosultságok beállítása (755 könyvtár, 644 fájl)
- ✅ Fájl mentés egyedi névvel (timestamp-randomString.extension)
- ✅ Fájl ellenőrzés (méret, olvashatóság)
- ✅ URL generálás (`/api/uploads/slideshow/{fileName}` és `/uploads/slideshow/{fileName}`)

**Visszatérési érték:**
```json
{
  "success": true,
  "url": "/api/uploads/slideshow/1234567890-abc123.jpg",
  "publicUrl": "/uploads/slideshow/1234567890-abc123.jpg",
  "fileName": "1234567890-abc123.jpg"
}
```

### 2. Képszolgáltatás (`/api/uploads/[...path]`)

**Fájl:** `app/api/uploads/[...path]/route.ts`

**Funkciók:**
- ✅ Path traversal védelem
- ✅ Fájl létezés ellenőrzés
- ✅ Content-Type automatikus meghatározás
- ✅ Cache-Control beállítások (1 év, immutable)
- ✅ Biztonságos fájl kiszolgálás

**Támogatott formátumok:**
- JPG/JPEG
- PNG
- GIF
- WebP
- SVG
- MP4 (videó)
- WebM (videó)

### 3. Slideshow Form (`SlideshowForm`)

**Fájl:** `components/admin/cms/SlideshowForm.tsx`

**Funkciók:**
- ✅ Képfeltöltés file input-tal
- ✅ Képfeltöltés "Feltöltés" gombbal
- ✅ URL manuális megadása
- ✅ Kép előnézet
- ✅ Form validáció (Zod schema)
- ✅ Media type választás (image/video)
- ✅ Automatikus form frissítés feltöltés után

**Feltöltési folyamat:**
1. Felhasználó kiválaszt egy képet
2. `handleImageUpload` hívódik
3. FormData létrehozása és POST kérés `/api/admin/upload/image`-hez
4. Válasz feldolgozása (`publicUrl` vagy `url` használata)
5. `imagePreview` frissítése
6. Form `image` mezőjének frissítése `setValue`-val
7. Toast értesítés (sikeres/sikertelen)

### 4. Slideshow Megjelenítés (`SlideshowSection`)

**Fájl:** `components/home/SlideshowSection.tsx`

**Funkciók:**
- ✅ Aktív slide-ok betöltése adatbázisból
- ✅ Fallback default képek, ha nincs slide
- ✅ Automatikus váltás (konfigurálható intervallum)
- ✅ Képek megjelenítése `<img>` tag-gel
- ✅ Videók megjelenítése `<video>` tag-gel
- ✅ Error handling (placeholder fallback)
- ✅ Lazy loading (első kép eager, többi lazy)
- ✅ Navigáció (nyilak, dots)

**Kép URL kezelés:**
- A komponens közvetlenül használja az `image` mező értékét
- Relatív URL-ek (`/uploads/...` vagy `/api/uploads/...`) automatikusan működnek
- Abszolút URL-ek (`https://...`) is támogatottak
- Error esetén placeholder kép jelenik meg

## Tesztelési Lépések

### 1. Képfeltöltés Tesztelése

#### Manuális Teszt:
1. Navigálj: `/{locale}/admin/cms/slideshow/new`
2. Válaszd ki a "Kép" media típust
3. Kattints a "Kép kiválasztása" gombra
4. Válassz egy képet (JPG, PNG, stb.)
5. Kattints a "Feltöltés" gombra
6. Ellenőrizd:
   - ✅ Toast üzenet: "Kép sikeresen feltöltve"
   - ✅ Kép előnézet megjelenik
   - ✅ Image URL mező automatikusan kitöltődik
   - ✅ Konzolban nincs hiba

#### API Teszt (curl):
```bash
curl -X POST http://localhost:3000/api/admin/upload/image \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -F "file=@test-image.jpg"
```

Várt válasz:
```json
{
  "success": true,
  "url": "/api/uploads/slideshow/1234567890-abc123.jpg",
  "publicUrl": "/uploads/slideshow/1234567890-abc123.jpg",
  "fileName": "1234567890-abc123.jpg"
}
```

### 2. Képszolgáltatás Tesztelése

#### Manuális Teszt:
1. Feltöltött kép URL-jét másold ki
2. Nyisd meg böngészőben: `http://localhost:3000/api/uploads/slideshow/{fileName}`
3. Ellenőrizd:
   - ✅ Kép megjelenik
   - ✅ Content-Type header helyes (`image/jpeg`, `image/png`, stb.)
   - ✅ Cache-Control header be van állítva

#### API Teszt (curl):
```bash
curl -I http://localhost:3000/api/uploads/slideshow/1234567890-abc123.jpg
```

Várt válasz:
```
HTTP/1.1 200 OK
Content-Type: image/jpeg
Cache-Control: public, max-age=31536000, immutable
```

### 3. Slideshow Megjelenítés Tesztelése

#### Manuális Teszt:
1. Hozz létre egy új slide-ot feltöltött képpel
2. Állítsd be: `isActive: true`, `locale: hu` vagy `en`
3. Navigálj a főoldalra: `/{locale}`
4. Ellenőrizd:
   - ✅ Slide megjelenik a slideshow-ban
   - ✅ Kép betöltődik és megjelenik
   - ✅ Automatikus váltás működik
   - ✅ Navigációs nyilak működnek
   - ✅ Dots indikátorok működnek
   - ✅ Konzolban nincs error

#### Konzol Ellenőrzés:
Nyisd meg a böngésző DevTools konzolját és keresd:
- ✅ "Slideshow image loaded successfully: {url}" üzenetek
- ❌ Nincs "Slideshow image load error" üzenet

### 4. URL Formátumok Tesztelése

#### Relatív URL-ek:
- `/uploads/slideshow/image.jpg` ✅
- `/api/uploads/slideshow/image.jpg` ✅

#### Abszolút URL-ek:
- `https://example.com/image.jpg` ✅
- `http://example.com/image.jpg` ✅

#### Érvénytelen URL-ek:
- `invalid-url` ❌ (validáció hibaüzenet)
- Üres string ❌ (validáció hibaüzenet)

## Ismert Problémák és Megoldások

### 1. Fájl nem mentődik

**Probléma:** A fájl nem kerül mentésre az `uploads` könyvtárba.

**Megoldások:**
1. Ellenőrizd a könyvtár jogosultságokat:
   ```bash
   chmod -R 755 public/uploads
   ```
2. Futtasd a fix scriptet:
   ```bash
   node scripts/fix-uploads-permissions.js
   ```
3. Ellenőrizd, hogy a `public/uploads/slideshow` könyvtár létezik-e

### 2. Kép nem jelenik meg

**Probléma:** A feltöltött kép nem jelenik meg a slideshow-ban.

**Megoldások:**
1. Ellenőrizd a kép URL-jét az adatbázisban
2. Teszteld közvetlenül a kép URL-jét böngészőben
3. Ellenőrizd a konzolban a hibaüzeneteket
4. Használd az API route-ot (`/api/uploads/...`) a public URL helyett

### 3. CORS vagy jogosultság hibák

**Probléma:** 403 vagy CORS hibák a kép betöltésekor.

**Megoldások:**
1. Ellenőrizd, hogy admin vagy-e bejelentkezve
2. Ellenőrizd a session token-t
3. Ellenőrizd a Next.js konfigurációt

## Automatizált Tesztelés

### Unit Tesztek (TODO)

```typescript
// tests/slideshow-upload.test.ts
describe('Slideshow Image Upload', () => {
  it('should upload image successfully', async () => {
    // Test implementation
  });
  
  it('should reject invalid file types', async () => {
    // Test implementation
  });
  
  it('should reject files larger than 10MB', async () => {
    // Test implementation
  });
});
```

### Integration Tesztek (TODO)

```typescript
// tests/slideshow-display.test.ts
describe('Slideshow Display', () => {
  it('should display uploaded images', async () => {
    // Test implementation
  });
  
  it('should handle image load errors gracefully', async () => {
    // Test implementation
  });
});
```

## Következő Lépések

1. ✅ Képfeltöltés API implementálva
2. ✅ Képszolgáltatás API implementálva
3. ✅ Slideshow form implementálva
4. ✅ Slideshow megjelenítés implementálva
5. ⏳ Automatizált tesztek írása
6. ⏳ Performance optimalizálás (image optimization)
7. ⏳ CDN integráció (opcionális)

## Kapcsolódó Fájlok

- `app/api/admin/upload/image/route.ts` - Képfeltöltés API
- `app/api/uploads/[...path]/route.ts` - Képszolgáltatás API
- `components/admin/cms/SlideshowForm.tsx` - Slideshow form
- `components/home/SlideshowSection.tsx` - Slideshow megjelenítés
- `app/[locale]/page.tsx` - Főoldal (slideshow használat)

