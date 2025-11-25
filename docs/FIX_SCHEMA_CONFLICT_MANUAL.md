# Prisma Schema Konfliktus Javítása - Manuális Útmutató

## Probléma
A `prisma/schema.prisma` fájlban Git merge conflict jelölők vannak:
- `<<<<<<< Updated upstream`
- `=======`
- `>>>>>>> Stashed changes`

## Gyors Megoldás (Terminálból)

### 1. Opció: Sed parancs (ajánlott)

```bash
cd /home/ZedGamingHosting/web/zedgaminghosting.hu/public_html

# Töröld a konfliktus jelölőket
sed -i '/^<<<<<<< Updated upstream$/d' prisma/schema.prisma
sed -i '/^=======$/d' prisma/schema.prisma
sed -i '/^>>>>>>> Stashed changes$/d' prisma/schema.prisma

# Töröld a duplikált provider sort (a "vagy" kommenteset)
sed -i '/provider = "mysql" \/\/ vagy "mysql"/d' prisma/schema.prisma

# Ellenőrizd
head -15 prisma/schema.prisma
```

### 2. Opció: Script használata

```bash
cd /home/ZedGamingHosting/web/zedgaminghosting.hu/public_html
bash scripts/fix-schema-conflict.sh
```

### 3. Opció: Manuális szerkesztés

```bash
nano prisma/schema.prisma
```

Keress rá: `<<<<<<< Updated upstream`

A `datasource db` résznek így kell kinéznie:

```prisma
datasource db {
  provider = "mysql" // MySQL használata Hestia CP-hez
  url      = env("DATABASE_URL")
}
```

**Töröld ki ezeket a sorokat:**
- `<<<<<<< Updated upstream` (10. sor)
- `=======` (12. sor)
- `>>>>>>> Stashed changes` (14. sor)
- A duplikált `provider = "mysql" // vagy "mysql" ha MySQL-t használsz a Hestia CP-ben` sort (13. sor)

**Mentés:** `Ctrl+O`, `Enter`, `Ctrl+X`

## Ellenőrzés

```bash
# Nézd meg a datasource részt
sed -n '9,15p' prisma/schema.prisma
```

Eredménynek így kell kinéznie:
```
datasource db {
  provider = "mysql" // MySQL használata Hestia CP-hez
  url      = env("DATABASE_URL")
}
```

## Utána

```bash
npm run db:generate
npm run db:push
npm run build
pm2 restart zedingaming
```

## Ha még mindig nem működik

```bash
# Pull-ozd le a tiszta verziót
git checkout -- prisma/schema.prisma
git pull origin main

# Vagy másold be a helyes verziót
cat > prisma/schema.prisma.temp << 'EOF'
// Prisma schema for ZedinGamingHosting
// Hestia CP által kezelt adatbázis használata
// Fontos: A Hestia CP-ben létrehozott adatbázist kell használni

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql" // MySQL használata Hestia CP-hez
  url      = env("DATABASE_URL")
}
EOF

# Másold be a fájl elejét, majd fűzd hozzá a maradékot
head -8 prisma/schema.prisma.temp > prisma/schema.prisma.new
tail -n +16 prisma/schema.prisma >> prisma/schema.prisma.new
mv prisma/schema.prisma.new prisma/schema.prisma
rm prisma/schema.prisma.temp
```

