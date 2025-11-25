# Git Pull Schema Konfliktus Megoldása

## Probléma
A `prisma/schema.prisma` fájlban vannak helyi változások, ami blokkolja a `git pull` műveletet.

## Megoldás

### 1. Opció: Stash (ajánlott, ha fontosak a helyi változások)
```bash
# Elmentjük a helyi változásokat
git stash

# Húzzuk le a változásokat
git pull origin main

# Visszaállítjuk a helyi változásokat (ha szükséges)
git stash pop
```

### 2. Opció: Reset (ha nem fontosak a helyi változások)
```bash
# Elvetjük a helyi változásokat és húzzuk le a legfrissebb verziót
git reset --hard origin/main
git pull origin main
```

### 3. Opció: Commit (ha a helyi változások fontosak)
```bash
# Commit-oljuk a helyi változásokat
git add prisma/schema.prisma
git commit -m "Local schema changes"

# Húzzuk le a változásokat (merge lesz)
git pull origin main

# Ha van konfliktus, javítsuk ki manuálisan
```

## Ajánlott megoldás
Mivel a schema fájl automatikusan frissül a Git-ben, a **2. opció (reset)** a legegyszerűbb:

```bash
git reset --hard origin/main
git pull origin main
npm run db:push
npm run build
pm2 restart zedingaming
```

