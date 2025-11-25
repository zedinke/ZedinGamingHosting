# Prisma Schema Merge Conflict Javítása

Ha a következő hibát kapod:
```
Error: Error validating: This line is not a valid definition within a datasource.
--> prisma/schema.prisma:10
```

És a 10. sorban látod a `<<<<<<<< Updated upstream` sort, akkor merge conflict marker van a fájlban.

## Gyors Megoldás

### 1. Opció: Automatikus javítás (ajánlott)
```bash
# Script futtatása
chmod +x scripts/fix-prisma-conflict.sh
./scripts/fix-prisma-conflict.sh
```

### 2. Opció: Kézi javítás

Nyisd meg a `prisma/schema.prisma` fájlt és keresd meg a conflict marker-eket:
- `<<<<<<< Updated upstream`
- `=======`
- `>>>>>>> Stashed changes`

Távolítsd el ezeket a sorokat, és hagyd meg csak a helyes kódot.

A datasource résznek így kell kinéznie:
```prisma
datasource db {
  provider = "mysql" // MySQL használata Hestia CP-hez
  url      = env("DATABASE_URL")
}
```

### 3. Opció: Fájl újratöltése a Git-ből

Ha biztos vagy benne, hogy a remote verzió a helyes:
```bash
git checkout --theirs prisma/schema.prisma
```

Vagy teljes reset:
```bash
git fetch origin main
git reset --hard origin/main
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
git commit -m "Fix Prisma schema merge conflict"
```

## Megelőzés

A jövőben, ha merge conflict van:
1. Ne commitold a conflict marker-ekkel
2. Mindig oldd meg a conflict-ot
3. Teszteld a Prisma schema-t: `npx prisma validate`

