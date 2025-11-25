# Manuális Frissítés - Részletes Útmutató

## Gyors Frissítés (Copy-Paste)

```bash
# 1. Navigálj a projekt könyvtárba
cd /home/ZedGamingHosting/web/zedgaminghosting.hu/public_html

# 2. Git pull (legújabb változások letöltése)
git pull origin main

# 3. Függőségek telepítése (ha változtak)
npm install

# 4. Prisma client generálása
npm run db:generate

# 5. Adatbázis séma frissítése (adatvesztés nélkül)
npm run db:push

# 6. Production build
npm run build

# 7. PM2 újraindítás
pm2 restart zedingaming
```

---

## Részletes Lépések

### 1. lépés: Navigálás a projekt könyvtárba

```bash
cd /home/ZedGamingHosting/web/zedgaminghosting.hu/public_html
```

### 2. lépés: Git Pull (változások letöltése)

```bash
# Először fetch (ellenőrzés)
git fetch origin main

# Status ellenőrzése
git status

# Pull (ha van új változás)
git pull origin main
```

**Ha merge conflict van:**
```bash
# Remote verzió használata (figyelmeztetés: helyi változások elvesznek!)
git reset --hard origin/main
```

### 3. lépés: Függőségek telepítése

```bash
# Új függőségek telepítése
npm install

# Vagy ha vannak konfliktusok:
npm install --legacy-peer-deps
```

### 4. lépés: Prisma Client generálása

```bash
# Prisma client újragenerálása
npm run db:generate
```

### 5. lépés: Adatbázis séma frissítése

```bash
# Adatbázis séma frissítése (adatvesztés nélkül)
npm run db:push
```

**Vagy migrációk használata (ajánlott production-ben):**
```bash
npm run db:migrate
```

### 6. lépés: Production Build

```bash
# Next.js production build
npm run build
```

**Ellenőrzés:**
```bash
# Nézd meg, hogy létrejött-e a .next mappa
ls -la .next

# Build ID ellenőrzése
cat .next/BUILD_ID
```

### 7. lépés: PM2 Újraindítás

```bash
# PM2 újraindítás
pm2 restart zedingaming

# Vagy ha nincs PM2, indítsd újra:
pm2 start npm --name "zedingaming" -- start
```

**PM2 állapot ellenőrzése:**
```bash
pm2 status
pm2 logs zedingaming --lines 50
```

---

## Teljes Frissítési Script (Copy-Paste)

```bash
#!/bin/bash

# Navigálás
cd /home/ZedGamingHosting/web/zedgaminghosting.hu/public_html

# Git pull
echo "→ Git változások letöltése..."
git fetch origin main
git pull origin main || git reset --hard origin/main

# Függőségek
echo "→ Függőségek telepítése..."
npm install --legacy-peer-deps

# Prisma
echo "→ Prisma client generálása..."
npm run db:generate

echo "→ Adatbázis séma frissítése..."
npm run db:push

# Build
echo "→ Production build..."
npm run build

# PM2 restart
echo "→ PM2 újraindítás..."
pm2 restart zedingaming

echo "✅ Frissítés kész!"
```

**Használat:**
```bash
# Mentsd el scriptként
nano update.sh
# Másold be a fenti scriptet
chmod +x update.sh
./update.sh
```

---

## Standalone Mód (ha output: 'standalone' van)

Ha a `next.config.js`-ben `output: 'standalone'` van beállítva:

```bash
# Build után
npm run build

# Standalone szerver indítása PM2-vel
pm2 restart zedingaming --update-env

# Vagy ha újra kell indítani:
pm2 delete zedingaming
pm2 start node --name "zedingaming" -- .next/standalone/server.js
```

---

## Ellenőrzés Frissítés Után

### 1. PM2 állapot

```bash
pm2 status
pm2 logs zedingaming --lines 20
```

### 2. Weboldal ellenőrzése

1. Nyisd meg: `https://zedgaminghosting.hu/hu`
2. Ellenőrizd, hogy betöltődik-e
3. Próbáld meg bejelentkezni

### 3. Logok ellenőrzése

```bash
# PM2 logok
pm2 logs zedingaming --lines 50

# Nginx logok (ha van hiba)
tail -f /var/log/nginx/zedgaminghosting.hu.error.log
```

---

## Gyakori Problémák

### Probléma 1: Git pull conflict

**Hiba:**
```
error: Your local changes to the following files would be overwritten by merge
```

**Megoldás:**
```bash
# Helyi változások elmentése
git stash

# Pull
git pull origin main

# Vagy remote verzió használata (figyelmeztetés!)
git reset --hard origin/main
```

### Probléma 2: npm install hiba

**Hiba:**
```
npm error code ERESOLVE
```

**Megoldás:**
```bash
npm install --legacy-peer-deps
```

### Probléma 3: Build hiba

**Hiba:**
```
Could not find a production build
```

**Megoldás:**
```bash
# Töröld a .next mappát
rm -rf .next

# Újra build
npm run build
```

### Probléma 4: PM2 nem indul

**Hiba:**
```
PM2 process not found
```

**Megoldás:**
```bash
# Újra indítás
pm2 start npm --name "zedingaming" -- start

# Vagy standalone módban:
pm2 start node --name "zedingaming" -- .next/standalone/server.js
```

---

## Biztonsági Mentés (Ajánlott)

Frissítés előtt készíts biztonsági másolatot:

```bash
# Adatbázis backup (ha MySQL)
mysqldump -u zedingaming_user -p zedingaming > backup_$(date +%Y%m%d_%H%M%S).sql

# Vagy ha PostgreSQL
pg_dump -U zedingaming_user zedingaming > backup_$(date +%Y%m%d_%H%M%S).sql

# Fájlok backup
cd /home/ZedGamingHosting/web/zedgaminghosting.hu/public_html
tar -czf ../backup_$(date +%Y%m%d_%H%M%S).tar.gz .
```

---

## Gyors Ellenőrzési Lista

- [ ] Navigáltam a projekt könyvtárba
- [ ] `git pull origin main` sikeres
- [ ] `npm install` sikeres
- [ ] `npm run db:generate` sikeres
- [ ] `npm run db:push` sikeres
- [ ] `npm run build` sikeres
- [ ] `.next` mappa létezik
- [ ] `pm2 restart zedingaming` sikeres
- [ ] Weboldal betöltődik
- [ ] Bejelentkezés működik

---

**Fontos:** Ha bármi hiba történik, nézd meg a logokat: `pm2 logs zedingaming` 🚀

