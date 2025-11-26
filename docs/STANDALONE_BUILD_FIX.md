# Standalone Build Hiba Javítása

## Probléma
`Cannot find module` hibák a standalone build-ben, hiányzó route fájlok.

## Megoldás

### 1. Töröld a régi build fájlokat

```bash
cd /home/ZedGamingHosting/web/zedgaminghosting.hu/public_html
rm -rf .next
rm -rf node_modules/.cache
```

### 2. Tiszta build

```bash
npm run build
```

### 3. Ellenőrizd a standalone build-et

```bash
ls -la .next/standalone/.next/server/app/api/admin/cms/slideshow/settings/
```

Ha hiányzik a `route.js` fájl, akkor a build nem tartalmazza ezt a route-ot.

### 4. Ha továbbra is probléma van, próbáld meg:

```bash
# Töröld mindent
rm -rf .next node_modules/.cache

# Újra build tiszta környezetben
NODE_ENV=production npm run build
```

### 5. Újraindítás

```bash
pm2 restart zedingaming
```

## Alternatív: Nem standalone build

Ha a standalone build továbbra is problémás, próbáld meg átmenetileg kikapcsolni:

1. Szerkeszd a `next.config.js`-t:
   ```js
   // output: 'standalone', // Kommenteld ki
   ```

2. Build:
   ```bash
   npm run build
   ```

3. PM2 indítás:
   ```bash
   pm2 start npm --name "zedingaming" -- start
   ```

