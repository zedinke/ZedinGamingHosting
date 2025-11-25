# Frissítési Rendszer Hibakeresés

## Problémák és Megoldások

### 1. Progress fájl nem jön létre

**Tünetek:**
- A frissítés gombra kattintás után "Nincs aktív frissítés" marad
- A progress bar 0%-on marad

**Lehetséges okok:**
- Fájl írási jogosultság hiánya
- A `.update-progress.json` fájl nem jön létre

**Megoldás:**
```bash
# Ellenőrizd a fájl írási jogosultságokat
ls -la .update-progress.json
ls -la .update-log.txt

# Ha nem léteznek, hozd létre manuálisan
touch .update-progress.json
touch .update-log.txt
chmod 666 .update-progress.json .update-log.txt
```

### 2. Git parancsok nem működnek

**Tünetek:**
- A frissítés elindul, de a Git pull lépésnél hibára fut

**Lehetséges okok:**
- Git nincs telepítve
- Nincs Git repository inicializálva
- Nincs remote beállítva

**Megoldás:**
```bash
# Ellenőrizd a Git állapotot
git status
git remote -v

# Ha nincs remote, add hozzá:
git remote add origin https://github.com/zedinke/ZedinGamingHosting.git
```

### 3. PM2 process nem található

**Tünetek:**
- A frissítés lefut, de a restart lépésnél hibára fut

**Megoldás:**
```bash
# Listázd ki a PM2 process-eket
pm2 list

# Ha más a neve, módosítsd a kódban vagy használd:
pm2 restart all
```

### 4. Polling nem találja a progress fájlt

**Tünetek:**
- A frissítés elindul, de a frontend nem látja a progress-t

**Megoldás:**
- Nyisd meg a böngésző konzolt (F12)
- Nézd meg a hálózati kéréseket
- Ellenőrizd, hogy a `/api/admin/system/update/status` endpoint válaszol-e

### 5. Debug információk

A rendszer most részletes console log-okat ír ki:

**Szerver oldali logok:**
```bash
# PM2 logok
pm2 logs

# Vagy közvetlenül a Next.js logok
tail -f .next/server.log
```

**Frontend logok:**
- Nyisd meg a böngésző konzolt (F12)
- Nézd meg a console üzeneteket

**Progress fájl ellenőrzése:**
```bash
# Nézd meg a progress fájl tartalmát
cat .update-progress.json

# Nézd meg a log fájlt
cat .update-log.txt
```

## Manuális Frissítés

Ha az automata frissítés nem működik, használd a manuális módszert:

```bash
# 1. Git pull
git pull origin main

# 2. NPM install
npm install --legacy-peer-deps

# 3. Prisma generate
npm run db:generate

# 4. Database push
npm run db:push

# 5. Build
npm run build

# 6. PM2 restart
pm2 restart all
```

## Progress Fájl Törlése

Ha a progress fájl "beragadt", töröld manuálisan:

```bash
rm -f .update-progress.json .update-log.txt
```

Ezután újra próbálhatod a frissítést.

