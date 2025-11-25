# Adatbázis Szerver Telepítése

## Ellenőrzés: Melyik adatbázis szerver van telepítve?

```bash
# MySQL/MariaDB ellenőrzése
systemctl status mysql
# vagy
systemctl status mariadb

# PostgreSQL ellenőrzése
systemctl status postgresql
# vagy
systemctl status postgresql@*-main
```

## Opció 1: MySQL/MariaDB Használata (Hestia CP alapértelmezett)

Ha MySQL/MariaDB van telepítve, használd azt:

### 1. Ellenőrizd, hogy fut-e

```bash
# MySQL/MariaDB státusz
systemctl status mysql
# vagy
systemctl status mariadb

# Ha nem fut, indítsd el
systemctl start mysql
# vagy
systemctl start mariadb
```

### 2. Módosítsd a Prisma sémát

```bash
# Szerkeszd a Prisma sémát
nano prisma/schema.prisma
```

Változtasd meg a `datasource` részt:

```prisma
datasource db {
  provider = "mysql"  // postgresql helyett
  url      = env("DATABASE_URL")
}
```

### 3. Frissítsd az .env fájlt

```bash
# Szerkeszd az .env fájlt
nano .env
```

Változtasd meg a DATABASE_URL-t:

```env
# MySQL formátum
DATABASE_URL="mysql://felhasználó:jelszó@localhost:3306/adatbázis_név"
```

### 4. Prisma újragenerálása

```bash
# Prisma client újragenerálása
npm run db:generate

# Adatbázis séma létrehozása
npm run db:push
```

## Opció 2: PostgreSQL Telepítése

Ha PostgreSQL-t szeretnél használni:

### 1. PostgreSQL Telepítése

```bash
# Frissítsd a csomag listát
apt update

# PostgreSQL telepítése
apt install -y postgresql postgresql-contrib

# PostgreSQL indítása
systemctl start postgresql
systemctl enable postgresql

# Ellenőrzés
systemctl status postgresql
```

### 2. PostgreSQL Beállítása

```bash
# Válts postgres felhasználóra
sudo -u postgres psql

# PostgreSQL-ben:
# CREATE DATABASE zedingaming;
# CREATE USER zedingaming_user WITH PASSWORD 'jelszó';
# GRANT ALL PRIVILEGES ON DATABASE zedingaming TO zedingaming_user;
# \q
```

### 3. Kapcsolat Tesztelése

```bash
# Teszteld a kapcsolatot
psql -h localhost -U zedingaming_user -d zedingaming
```

## Opció 3: Hestia CP Adatbázis Használata

A Hestia CP-ben létrehozott adatbázis használata:

### 1. Ellenőrizd a Hestia CP adatbázis típusát

A Hestia CP-ben:
- Menj a **Databases** menüpontra
- Nézd meg, hogy milyen típusú adatbázisokat hoztál létre
- Általában MySQL/MariaDB

### 2. Használd a Hestia CP-ben létrehozott adatbázist

Az .env fájlban használd a Hestia CP-ben létrehozott adatbázis adatait:

```env
# MySQL esetén (Hestia CP alapértelmezett)
DATABASE_URL="mysql://hestia_user:hestia_password@localhost:3306/hestia_database"

# PostgreSQL esetén (ha PostgreSQL-t használsz a Hestia CP-ben)
DATABASE_URL="postgresql://hestia_user:hestia_password@localhost:5432/hestia_database"
```

### 3. Prisma Séma Módosítása

Ha MySQL-t használsz:

```bash
nano prisma/schema.prisma
```

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

## Gyors Ellenőrzés

```bash
# Melyik adatbázis szerverek vannak telepítve?
which mysql
which psql

# Melyik portokon figyelnek?
netstat -tuln | grep -E '3306|5432'
# vagy
ss -tuln | grep -E '3306|5432'
```

## Ajánlás

**Hestia CP esetén ajánlott MySQL/MariaDB használata**, mert:
- A Hestia CP alapértelmezetten MySQL-t használ
- Könnyebb integráció
- Nincs szükség külön PostgreSQL telepítésre

