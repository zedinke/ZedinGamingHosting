# Git Pull Hiba Megoldása

Ha a következő hibát kapod:
```
error: The following untracked working tree files would be overwritten by merge:
        package-lock.json
Please move or remove them before you merge.
```

## Megoldás

### 1. Opció: Fájl eltávolítása (ajánlott)
```bash
rm package-lock.json
git pull origin main
npm install
```

### 2. Opció: Fájl mentése és eltávolítása
```bash
mv package-lock.json package-lock.json.backup
git pull origin main
npm install
```

### 3. Opció: Force pull (ha biztos vagy benne, hogy a remote verzió a helyes)
```bash
git fetch origin main
git reset --hard origin/main
npm install
```

## Miután a pull sikeres volt

1. **Prisma migráció futtatása:**
```bash
npm run db:generate
npm run db:push
```

2. **Build futtatása:**
```bash
npm run build
```

3. **Újraindítás** (ha PM2-t használsz):
```bash
pm2 restart zedin-gaming-hosting
```

## Megjegyzés

A `package-lock.json` fájl automatikusan újragenerálódik az `npm install` parancs futtatásakor, ezért biztonságos az eltávolítása.

