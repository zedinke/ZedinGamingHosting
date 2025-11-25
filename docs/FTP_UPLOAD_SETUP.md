# FTP Feltöltés Beállítása

Ez a dokumentum leírja, hogyan lehet FTP-n keresztül képeket feltölteni a slideshow-hoz.

## Automatikus Engedélyek Beállítása

Két módon állíthatod be az engedélyeket:

### 1. Bash Script (Linux/Mac)

```bash
bash scripts/set-uploads-permissions.sh
```

### 2. Node.js Script (Minden platform)

```bash
node scripts/fix-uploads-permissions.js
```

Mindkét script:
- Létrehozza az összes szükséges uploads mappát
- Beállítja a megfelelő engedélyeket (755 - rwxr-xr-x)
- Lehetővé teszi az FTP feltöltést

**Ha a feltöltés nem működik, próbáld meg futtatni a fix scriptet:**
```bash
node scripts/fix-uploads-permissions.js
```

## Manuális Engedélyek Beállítása

Ha a script nem működik, manuálisan is beállíthatod:

```bash
# Navigálj a projekt root könyvtárába
cd /path/to/your/project

# Hozd létre a mappákat (ha még nem léteznek)
mkdir -p public/uploads/slideshow
mkdir -p public/uploads/slideshow/videos
mkdir -p public/uploads/blog
mkdir -p public/uploads/team
mkdir -p public/uploads/games

# Állítsd be az engedélyeket (755 = rwxr-xr-x)
chmod -R 755 public/uploads
chmod 755 public
```

## FTP Feltöltés

1. Kapcsolódj FTP-vel a szerverhez
2. Navigálj a `public/uploads/slideshow/` mappába
3. Töltsd fel a képeket
4. A feltöltött képek URL-je: `/uploads/slideshow/filename.jpg`

## Webes Feltöltés

A webes felületen két módon tölthetsz fel képet:

1. **Automatikus feltöltés**: Válassz ki egy fájlt, és automatikusan feltöltődik
2. **Direkt feltöltés gomb**: Válassz ki egy fájlt, majd kattints a "Feltöltés" gombra

## Engedélyek Magyarázata

- **755 (rwxr-xr-x)**:
  - Owner (tulajdonos): olvasás, írás, végrehajtás
  - Group (csoport): olvasás, végrehajtás
  - Others (mások): olvasás, végrehajtás

Ez az engedély beállítás lehetővé teszi, hogy:
- A web szerver olvassa és szolgálja ki a fájlokat
- FTP-n keresztül feltölts fájlokat
- A Next.js alkalmazás írjon a mappába

## Hibaelhárítás

### "Permission denied" hiba

Ha "Permission denied" hibát kapsz:

1. Ellenőrizd, hogy a mappák léteznek-e
2. Futtasd le a permissions scriptet
3. Ellenőrizd, hogy a web szerver felhasználója (pl. www-data) hozzáfér-e a mappákhoz

### Fájlok nem jelennek meg

1. Ellenőrizd, hogy a fájlok a `public/uploads/slideshow/` mappába kerültek-e
2. Ellenőrizd a fájl engedélyeit: `ls -la public/uploads/slideshow/`
3. Győződj meg róla, hogy a fájlok olvashatók: `chmod 644 filename.jpg`

### FTP nem működik

1. Ellenőrizd az FTP szerver beállításait
2. Győződj meg róla, hogy az FTP felhasználó hozzáfér a `public/uploads` mappához
3. Próbáld meg újra futtatni a permissions scriptet

