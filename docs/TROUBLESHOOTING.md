# Hibaelhárítási Útmutató

## Gyakori Hibák és Megoldások

### 1. "command not found" hiba

**Hiba:**
```bash
.env.example: command not found
```

**Megoldás:**
A `cp` parancs hiányzik. Használd ezt:

```bash
cp .env.example .env
```

### 2. Fájl másolási parancsok

**Helyes parancsok:**
```bash
# Fájl másolása
cp .env.example .env

# Fájl átnevezése
mv .env.example .env

# Tartalom másolása (ha másik könyvtárból)
cp /path/to/.env.example .env
```

### 3. Adatbázis kapcsolati hiba

**Hiba:** `Error: P1001: Can't reach database server`

**Megoldás:**
```bash
# Ellenőrizd a DATABASE_URL formátumát
echo $DATABASE_URL

# PostgreSQL teszt
psql -h localhost -U zedingaming_user -d zedingaming

# MySQL teszt
mysql -h localhost -u zedingaming_user -p zedingaming
```

### 4. Permission denied hiba

**Hiba:** `Permission denied`

**Megoldás:**
```bash
# Jogosultságok beállítása
chmod -R 755 /home/user/web/yourdomain.com/public_html
chown -R user:user /home/user/web/yourdomain.com/public_html
```

### 5. Node modules hiba

**Hiba:** `Cannot find module`

**Megoldás:**
```bash
# Telepítsd újra a függőségeket
rm -rf node_modules package-lock.json
npm install
```

### 6. Prisma hiba

**Hiba:** `PrismaClient is not configured`

**Megoldás:**
```bash
# Prisma client újragenerálása
npm run db:generate
```

### 7. Port már foglalt

**Hiba:** `Port 3000 is already in use`

**Megoldás:**
```bash
# Nézd meg, mi használja
lsof -i :3000
# Vagy
netstat -tuln | grep 3000

# Állítsd le a folyamatot
kill -9 PID

# Vagy változtasd meg a portot
PORT=3001 pm2 start npm --name "zedingaming" -- start
```

### 8. Git pull hiba

**Hiba:** `Could not resolve host: github.com`

**Megoldás:**
```bash
# Ellenőrizd az internetkapcsolatot
ping github.com

# Vagy használd az SSH URL-t
git remote set-url origin git@github.com:zedinke/ZedinGamingHosting.git
```

## Gyors Parancsok Referencia

### Fájl Műveletek

```bash
# Fájl másolása
cp source.txt destination.txt

# Fájl átnevezése
mv oldname.txt newname.txt

# Fájl törlése
rm filename.txt

# Mappa törlése
rm -rf foldername

# Fájl tartalmának megtekintése
cat filename.txt

# Fájl szerkesztése
nano filename.txt
# vagy
vi filename.txt
```

### Git Parancsok

```bash
# Státusz ellenőrzés
git status

# Változások hozzáadása
git add .

# Commit
git commit -m "Üzenet"

# Push
git push

# Pull
git pull

# Klónozás
git clone https://github.com/user/repo.git
```

### Node.js Parancsok

```bash
# Függőségek telepítése
npm install

# Build
npm run build

# Dev szerver
npm run dev

# Production szerver
npm start
```

### PM2 Parancsok

```bash
# Alkalmazás indítása
pm2 start npm --name "zedingaming" -- start

# Lista
pm2 list

# Logok
pm2 logs zedingaming

# Újraindítás
pm2 restart zedingaming

# Leállítás
pm2 stop zedingaming

# Törlés
pm2 delete zedingaming

# Monitoring
pm2 monit
```

### Prisma Parancsok

```bash
# Client generálás
npm run db:generate

# Séma push
npm run db:push

# Migráció
npm run db:migrate

# Prisma Studio
npm run db:studio
```

