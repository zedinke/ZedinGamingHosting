# Adatbázis Kapcsolati Hiba Megoldása

## Hiba: "Can't reach database server at `localhost:3306`"

### 1. Ellenőrizd, hogy fut-e a MySQL

```bash
# MySQL/MariaDB státusz ellenőrzése
systemctl status mysql
# vagy
systemctl status mariadb

# Ha nem fut, indítsd el
systemctl start mysql
# vagy
systemctl start mariadb

# Automatikus indítás beállítása
systemctl enable mysql
```

### 2. Ellenőrizd a .env fájlt

```bash
# Nézd meg a DATABASE_URL-t
cat .env | grep DATABASE_URL
```

A formátumnak így kell lennie MySQL esetén:
```env
DATABASE_URL="mysql://felhasználó:jelszó@localhost:3306/adatbázis_név"
```

### 3. Hestia CP adatbázis információk

A Hestia CP-ben:
1. Menj a **Databases** menüpontra
2. Nézd meg a létrehozott adatbázis adatait:
   - **Database name**: pl. `ZedGamingHosting_gamingportal`
   - **Database user**: pl. `ZedGamingHosting_gamingportal`
   - **Password**: (mentve kell legyen)
   - **Host**: általában `localhost`

### 4. Kapcsolat tesztelése

```bash
# MySQL kapcsolat tesztelése
mysql -h localhost -u ZEDGAMINGHOSTING_USER -p ZEDGAMINGHOSTING_DB

# Ha nem működik, próbáld root-ként
mysql -u root -p
```

### 5. Port ellenőrzés

```bash
# Nézd meg, hogy a MySQL fut-e a 3306-os porton
netstat -tuln | grep 3306
# vagy
ss -tuln | grep 3306
```

### 6. Hestia CP adatbázis kapcsolati string formátuma

A Hestia CP által létrehozott adatbázisok formátuma:
```
mysql://USERNAME:PASSWORD@localhost:3306/DATABASE_NAME
```

**Fontos:**
- Ha a jelszóban speciális karakterek vannak, URL encode-old őket:
  - `@` → `%40`
  - `#` → `%23`
  - `%` → `%25`
  - `&` → `%26`
  - stb.

### 7. Prisma kapcsolat tesztelése

```bash
# Prisma client generálása
npm run db:generate

# Adatbázis séma push (ha még nincs)
npm run db:push

# Kapcsolat tesztelése Node.js-ből
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => { console.log('✅ Kapcsolat sikeres!'); process.exit(0); }).catch(e => { console.error('❌ Hiba:', e.message); process.exit(1); });"
```

### 8. Gyakori problémák

**1. MySQL nem fut:**
```bash
systemctl start mysql
```

**2. Rossz jelszó:**
- Ellenőrizd a Hestia CP-ben a jelszót
- Ha URL encode-olni kell, használd a fenti táblázatot

**3. Rossz adatbázis név:**
- A Hestia CP-ben nézd meg a pontos adatbázis nevet
- Figyelj a kis/nagybetűkre!

**4. Hestia CP adatbázis elérési út:**
- A Hestia CP általában `localhost`-on fut
- Ha más host-ot használsz, módosítsd a DATABASE_URL-t

### 9. Teljes .env példa

```env
# Adatbázis (Hestia CP)
DATABASE_URL="mysql://ZedGamingHosting_gamingportal:JELSZÓ@localhost:3306/ZedGamingHosting_gamingportal"

# NextAuth
NEXTAUTH_URL="https://zedgaminghosting.hu"
NEXTAUTH_SECRET="your-secret-here"

# Email (Hestia CP SMTP)
SMTP_HOST=localhost
SMTP_PORT=587
SMTP_USER=noreply@zedgaminghosting.hu
SMTP_PASSWORD=email-password
SMTP_FROM=noreply@zedgaminghosting.hu
```

### 10. PM2 újraindítás

Miután javítottad a DATABASE_URL-t:

```bash
# PM2 újraindítás
pm2 restart zedingaming

# Logok ellenőrzése
pm2 logs zedingaming --lines 50
```

