# Build Hiba Javítási Útmutató

## Probléma
`TypeError: generate is not a function` hiba a Next.js build során.

## Megoldás

### 1. Töröld a lock fájlt és node_modules-t

```bash
cd /home/ZedGamingHosting/web/zedgaminghosting.hu/public_html
rm -f package-lock.json
rm -rf node_modules
```

### 2. Frissítsd a kódot

```bash
git pull origin main
```

### 3. Telepítsd újra a függőségeket

```bash
npm install
```

Ez telepíteni fogja a Next.js 14.2.15 verziót, ami javítja a hibát.

### 4. Töröld a cache-t

```bash
rm -rf .next
rm -rf node_modules/.cache
```

### 5. Build

```bash
npm run build
```

### 6. Újraindítás

```bash
pm2 restart zedingaming
```

## Alternatív: Manuális Next.js frissítés

Ha a fenti nem működik, próbáld meg manuálisan:

```bash
npm install next@14.2.15 --save
npm install eslint-config-next@14.2.15 --save-dev
npm install
npm run build
```

## További hibaelhárítás

Ha még mindig hibát kapsz:

1. Ellenőrizd a Next.js verziót:
   ```bash
   npm list next
   ```

2. Ha még mindig 14.0.4, próbáld meg:
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

3. Ha továbbra is probléma van, próbáld meg a legújabb Next.js verziót:
   ```bash
   npm install next@latest --save
   ```

