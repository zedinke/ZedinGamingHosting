# Upload Fájlok Javítása Standalone Build-ben

## Probléma
A feltöltött képek nem jelennek meg, mert a Next.js standalone build-ben a fájlok nem a megfelelő helyre kerülnek.

## Ok
A Next.js standalone build-ben a `process.cwd()` a `.next/standalone` mappára mutat, nem a projekt gyökerére. Ezért a fájlok nem a megfelelő helyre kerülnek.

## Megoldás
Az upload API most már automatikusan detektálja, hogy standalone build-ben fut-e, és a fájlokat mindkét helyre menti:

1. **Standalone public mappa** (`.next/standalone/public/uploads/slideshow/`) - ahonnan a Next.js szolgálja ki
2. **Projekt gyökér public mappa** (`public/uploads/slideshow/`) - backup és közvetlen eléréshez

## Ellenőrzés

### 1. Ellenőrizd a fájlok helyét
```bash
# Standalone build-ben
ls -la .next/standalone/public/uploads/slideshow/

# Projekt gyökérben
ls -la public/uploads/slideshow/
```

### 2. Ellenőrizd a szerver logokat
A feltöltéskor a logokban látszani fog:
```
Upload info: {
  baseDir: '/path/to/.next/standalone',
  isStandalone: true,
  uploadsDir: '/path/to/.next/standalone/public/uploads/slideshow',
  uploadsDirExists: true,
  projectRootPublic: '/path/to/public/uploads/slideshow'
}
```

### 3. Ha a fájlok még mindig nem jelennek meg

**A. Ellenőrizd a Nginx konfigurációt:**
A Nginx-nek a `/uploads/` útvonalat közvetlenül a `public` mappából kell szolgálnia:

```nginx
# Public mappa (képek, stb.)
location /uploads {
    alias /home/ZedGamingHosting/web/zedgaminghosting.hu/public_html/public/uploads;
    expires 30d;
    add_header Cache-Control "public";
}
```

**B. Vagy a Next.js szolgálja ki:**
Ha a Next.js szolgálja ki a fájlokat, akkor a fájloknak a `.next/standalone/public/uploads/` mappában kellene lenniük.

**C. Szimbolikus link használata:**
Ha mindkét helyre szeretnéd, hogy elérhetők legyenek:

```bash
# Projekt gyökérben
cd /home/ZedGamingHosting/web/zedgaminghosting.hu/public_html
ln -s public/uploads/slideshow .next/standalone/public/uploads/slideshow
```

## Frissítés

A szerveren futtasd:

```bash
git pull origin main
npm run build
pm2 restart zedingaming
```

Most már a feltöltött fájlok mindkét helyre kerülnek, így biztosan elérhetők lesznek.

