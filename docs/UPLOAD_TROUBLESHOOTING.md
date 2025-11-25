# Kép Feltöltés Hibaelhárítás

## Probléma
A képek nem kerülnek fel a szerverre, vagy nem jelennek meg.

## Ellenőrzési Lépések

### 1. Ellenőrizd a szerver logokat
```bash
pm2 logs zedingaming --lines 100 | grep -i upload
```

Keress rá ezekre a szavakra:
- `Upload info:`
- `File saved successfully:`
- `Error saving file`
- `Uploads directory`

### 2. Ellenőrizd a mappa létezését
```bash
cd /home/ZedGamingHosting/web/zedgaminghosting.hu/public_html
ls -la public/uploads/slideshow/
```

### 3. Ellenőrizd a jogosultságokat
```bash
chmod -R 755 public/uploads
chown -R www-data:www-data public/uploads  # vagy root:root, attól függően, hogy ki fut a Next.js-t
```

### 4. Teszteld a fájl írást
```bash
cd /home/ZedGamingHosting/web/zedgaminghosting.hu/public_html
echo "test" > public/uploads/slideshow/test.txt
ls -la public/uploads/slideshow/test.txt
rm public/uploads/slideshow/test.txt
```

### 5. Ellenőrizd a process.cwd() értékét
A Next.js standalone build-ben a `process.cwd()` a `.next/standalone` mappára mutat.
Az upload API-nak fel kell ismernie ezt és a projekt gyökerét kell használnia.

## Manuális Megoldás

Ha az automatikus feltöltés nem működik, manuálisan másold át a fájlokat:

1. **WinSCP-ben:**
   - Lokális: `E:\Zedin_Projects\ZedGamingHoting\public\uploads\slideshow\`
   - Távoli: `/home/ZedGamingHosting_zedin/public_html/public/uploads/slideshow/`
   - Húzd át a képeket

2. **SSH-n keresztül:**
   ```bash
   # Ha a fájlok lokálisan vannak
   scp /local/path/to/image.jpg root@116.203.226.140:/home/ZedGamingHosting_zedin/public_html/public/uploads/slideshow/
   ```

## Debug Információk

Az upload API most részletes logolást tartalmaz. Ellenőrizd a PM2 logokat:

```bash
pm2 logs zedingaming --lines 200
```

Keresd meg az "Upload info:" sorokat, amelyek megmutatják:
- `processCwd`: Hol fut a Next.js
- `baseDir`: Melyik könyvtárat használja
- `uploadsDir`: Hova próbálja menteni
- `uploadsDirExists`: Létezik-e a mappa

