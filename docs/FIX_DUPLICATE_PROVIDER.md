# Prisma Schema Duplikált Provider Javítása

Ha a következő hibát kapod:
```
Error: Key "provider" is already defined in source "db".
  --> prisma/schema.prisma:11
```

Ez azt jelenti, hogy a `provider` kulcs kétszer van definiálva a datasource blokkban.

## Gyors Megoldás

### 1. Opció: Automatikus javítás
```bash
chmod +x scripts/fix-duplicate-provider.sh
./scripts/fix-duplicate-provider.sh
```

### 2. Opció: Kézi javítás

Nyisd meg a `prisma/schema.prisma` fájlt és keresd meg a datasource blokkot:

```prisma
datasource db {
  provider = "mysql" // MySQL használata Hestia CP-hez
  provider = "mysql" // vagy "mysql" ha MySQL-t használsz a Hestia CP-ben  <-- EZT TÁVOLÍTSD EL
  url      = env("DATABASE_URL")
}
```

Távolítsd el az egyik duplikált `provider` sort. A helyes verzió:

```prisma
datasource db {
  provider = "mysql" // MySQL használata Hestia CP-hez
  url      = env("DATABASE_URL")
}
```

### 3. Opció: Sed parancs (gyors)
```bash
# Duplikált provider sor eltávolítása
sed -i '/provider = "mysql" \/\/ vagy "mysql" ha MySQL-t használsz a Hestia CP-ben/d' prisma/schema.prisma

# Ellenőrzés
grep -n "provider" prisma/schema.prisma
```

## Miután javítottad

1. **Prisma generate:**
```bash
npm run db:generate
```

2. **Prisma db push:**
```bash
npm run db:push
```

3. **Commit (ha szükséges):**
```bash
git add prisma/schema.prisma
git commit -m "Fix duplicate provider in Prisma schema"
git push origin main
```

## Ellenőrzés

Ellenőrizd, hogy csak egy `provider` sor van:
```bash
grep -c 'provider = "mysql"' prisma/schema.prisma
```

Ez 1-et kell mutasson.

