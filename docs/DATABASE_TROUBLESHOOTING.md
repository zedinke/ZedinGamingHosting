# Adatbázis Kapcsolati Hibaelhárítás

## Hiba: "Can't reach database server at `localhost:5432`"

### 1. Ellenőrizd a .env fájlt

```bash
# Nézd meg a DATABASE_URL-t
cat .env | grep DATABASE_URL
```

A formátumnak így kell lennie:
```
DATABASE_URL="postgresql://felhasználó:jelszó@localhost:5432/adatbázis_név"
```

### 2. Ellenőrizd, hogy fut-e a PostgreSQL

```bash
# PostgreSQL szolgáltatás státusza
systemctl status postgresql

# Vagy
service postgresql status

# Ha nem fut, indítsd el
systemctl start postgresql
```

### 3. Teszteld a kapcsolatot

```bash
# PostgreSQL kapcsolat tesztelése
psql -h localhost -U zedingaming_user -d zedingaming

# Ha nem működik, próbáld root-ként
sudo -u postgres psql -l
```

### 4. Ellenőrizd a Hestia CP adatbázis beállításait

A Hestia CP-ben:
1. Menj a **Databases** menüpontra
2. Nézd meg a létrehozott adatbázis adatait
3. Ellenőrizd:
   - Adatbázis név
   - Felhasználó név
   - Jelszó
   - Host (általában `localhost`)

### 5. MySQL használata esetén

Ha MySQL-t használsz a Hestia CP-ben:

```bash
# Prisma séma módosítása
nano prisma/schema.prisma

# Változtasd meg:
# datasource db {
#   provider = "mysql"  # postgresql helyett
#   url      = env("DATABASE_URL")
# }

# MySQL kapcsolat tesztelése
mysql -h localhost -u zedingaming_user -p zedingaming
```

### 6. Port ellenőrzés

```bash
# Nézd meg, hogy a PostgreSQL fut-e a 5432-es porton
netstat -tuln | grep 5432

# Vagy
ss -tuln | grep 5432
```

### 7. Hestia CP adatbázis kapcsolati információk

A Hestia CP-ben a kapcsolati információk általában:
- **Host**: `localhost` vagy `127.0.0.1`
- **Port**: PostgreSQL: `5432`, MySQL: `3306`
- **Database name**: Amit a Hestia CP-ben adtál meg
- **User**: Amit a Hestia CP-ben adtál meg
- **Password**: Amit a Hestia CP-ben adtál meg

### 8. Gyakori hibák

**Hibás formátum:**
```
DATABASE_URL="postgresql://user:pass@localhost/zedingaming"  # ❌ Hiányzik a port
DATABASE_URL="postgresql://user:pass@localhost:5432"        # ❌ Hiányzik az adatbázis név
```

**Helyes formátum:**
```
DATABASE_URL="postgresql://user:pass@localhost:5432/zedingaming"  # ✅
```

**Speciális karakterek a jelszóban:**
Ha a jelszóban speciális karakterek vannak (pl. `@`, `#`, `%`), URL encode-old őket:
- `@` → `%40`
- `#` → `%23`
- `%` → `%25`
- stb.

### 9. Kapcsolat tesztelése Node.js-ből

Hozz létre egy teszt fájlt:

```bash
cat > test-db.js << 'EOF'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    await prisma.$connect();
    console.log('✅ Adatbázis kapcsolat sikeres!');
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Adatbázis kapcsolati hiba:', error.message);
  }
}

test();
EOF

node test-db.js
```

