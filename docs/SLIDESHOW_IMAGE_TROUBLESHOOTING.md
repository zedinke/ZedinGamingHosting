# Slideshow Kép Megjelenítési Problémák Megoldása

## Probléma
A slideshow képek nem jelennek meg se az admin menüben, se a főoldalon.

## Lehetséges Okok

### 1. Fájlok nem léteznek
A feltöltött képek a `public/uploads/slideshow/` mappában vannak tárolva. Ha a fájlok nem léteznek, a képek nem jelennek meg.

**Ellenőrzés:**
```bash
# Ellenőrizd, hogy a mappa létezik-e
ls -la public/uploads/slideshow/

# Ha nem létezik, hozd létre
mkdir -p public/uploads/slideshow
chmod 755 public/uploads/slideshow
```

### 2. Next.js Standalone Build
A Next.js `standalone` build módban a `public` mappa nem másolódik át automatikusan. A fájlokat manuálisan kell másolni.

**Megoldás:**
```bash
# Build után másold át a public mappát
cp -r public .next/standalone/public
```

Vagy módosítsd a `package.json`-t, hogy automatikusan másolja:
```json
{
  "scripts": {
    "build": "next build && cp -r public .next/standalone/public"
  }
}
```

### 3. Fájl jogosultságok
A fájloknak olvashatóaknak kell lenniük a web szerver számára.

**Megoldás:**
```bash
chmod -R 755 public/uploads
```

### 4. Relatív elérési út probléma
A képek relatív elérési úttal vannak tárolva (`/uploads/slideshow/image.jpg`). Ha a Next.js nem találja a fájlokat, nem jelennek meg.

**Ellenőrzés:**
- Nyisd meg a böngésző DevTools-t (F12)
- Nézd meg a Console-t, hogy vannak-e hibaüzenetek
- Nézd meg a Network fület, hogy a képek betöltésre kerülnek-e

### 5. Debug Logolás
A komponensek most debug logolást tartalmaznak. Ellenőrizd a böngésző konzolját és a szerver logokat:

**Böngésző konzol:**
- `SlideshowManagement - slides:` - admin menüben
- `Image loaded successfully:` - sikeres betöltés
- `Image load error:` - hiba esetén

**Szerver log:**
- `AdminSlideshowPage - slides found:` - hány slide van

## Gyors Megoldás

1. **Ellenőrizd a fájlokat:**
```bash
cd /home/ZedGamingHosting/web/zedgaminghosting.hu/public_html
ls -la public/uploads/slideshow/
```

2. **Ha nincsenek fájlok, tölts fel újra:**
- Menj az admin menübe: `/hu/admin/cms/slideshow`
- Kattints az "Új Slide" gombra
- Tölts fel egy képet

3. **Ha vannak fájlok, de nem jelennek meg:**
- Ellenőrizd a fájl jogosultságokat: `chmod -R 755 public/uploads`
- Ellenőrizd a Next.js build-et: `npm run build`
- Restart PM2: `pm2 restart zedingaming`

4. **Standalone build esetén:**
```bash
# Build után másold át a public mappát
cp -r public .next/standalone/public

# Vagy módosítsd a PM2 start script-et, hogy automatikusan másolja
```

## Hosszú Távú Megoldás

1. **Cloud Storage használata:**
   - AWS S3, Cloudinary, vagy más cloud storage
   - Abszolút URL-ek használata

2. **CDN használata:**
   - Statikus fájlok CDN-en keresztül
   - Gyorsabb betöltés

3. **Next.js Image Optimization:**
   - `next/image` komponens használata
   - Automatikus optimalizálás

