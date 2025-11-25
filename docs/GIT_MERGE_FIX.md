# Git Merge Conflict Megoldása - prisma/schema.prisma

## Probléma
A `git pull` során konfliktus van, mert a helyi `prisma/schema.prisma` fájl módosult.

## Megoldás

### 1. Opció: Elmentjük a helyi változásokat (stash)
```bash
# Elmentjük a helyi változásokat
git stash

# Pull-ozzuk a változásokat
git pull origin main

# Visszaállítjuk a helyi változásokat (ha szükséges)
git stash pop
```

### 2. Opció: Commitoljuk a helyi változásokat
```bash
# Hozzáadjuk a fájlt
git add prisma/schema.prisma

# Commitoljuk
git commit -m "Local schema changes"

# Pull-ozzuk a változásokat
git pull origin main

# Ha konfliktus van, meg kell oldani
```

### 3. Opció: Eldobjuk a helyi változásokat (ha nem kellenek)
```bash
# Eldobjuk a helyi változásokat
git checkout -- prisma/schema.prisma

# Pull-ozzuk a változásokat
git pull origin main
```

### 4. Opció: Merge conflict megoldása (ha a pull után konfliktus van)
```bash
# Pull-ozzuk a változásokat
git pull origin main

# Ha konfliktus van, nyisd meg a fájlt
nano prisma/schema.prisma

# Keress rá a konfliktus jelölőkre:
# <<<<<<< HEAD
# (helyi változások)
# =======
# (távoli változások)
# >>>>>>> origin/main

# Töröld a jelölőket és válaszd ki a megfelelő verziót
# Vagy kombináld a két verziót

# Mentés után:
git add prisma/schema.prisma
git commit -m "Resolve merge conflict in schema.prisma"
```

## Ajánlott megoldás
Mivel a legújabb verzióban már benne vannak a számlázási mezők, ajánlott:

```bash
# 1. Elmentjük a helyi változásokat (ha van bennük valami fontos)
git stash

# 2. Pull-ozzuk a változásokat
git pull origin main

# 3. Ha a stash-ben volt valami fontos, visszaállítjuk
git stash pop

# 4. Ha konfliktus van, megoldjuk
# (lásd fent a 4. opciót)
```

## Automatikus merge conflict javítás (ha ismert a probléma)
Ha a konfliktus csak duplikált vagy eltérő sorok miatt van:

```bash
# Pull-ozzuk
git pull origin main

# Ha konfliktus van, használjuk a script-et
bash scripts/fix-prisma-conflict.sh

# Vagy manuálisan javítjuk
nano prisma/schema.prisma
# Töröljük a <<<<<<<, =======, >>>>>>> sorokat
# Választjuk ki a megfelelő verziót

# Mentés után
git add prisma/schema.prisma
git commit -m "Resolve merge conflict"
```

