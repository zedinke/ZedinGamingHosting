# PM2 Hibaelhárítás

## Alkalmazás nem fut a 3000-es porton

### 1. Logok Megtekintése

```bash
# PM2 logok megtekintése
pm2 logs zedingaming

# Vagy csak az utolsó 50 sor
pm2 logs zedingaming --lines 50

# Vagy valós idejű követés
pm2 logs zedingaming --lines 0
```

### 2. Alkalmazás Státusz Részletei

```bash
# Részletes információk
pm2 show zedingaming

# Vagy
pm2 describe zedingaming
```

### 3. Gyakori Hibák

#### Build hiányzik

Ha nincs `.next` mappa:
```bash
# Build készítése
npm run build

# Újraindítás
pm2 restart zedingaming
```

#### .env fájl hiányzik vagy hibás

```bash
# Ellenőrizd az .env fájlt
cat .env

# Ellenőrizd a DATABASE_URL-t
cat .env | grep DATABASE_URL
```

#### Port már foglalt

```bash
# Nézd meg, mi használja a 3000-es portot
lsof -i :3000
# vagy
netstat -tuln | grep 3000
```

#### Node.js verzió probléma

```bash
# Ellenőrizd a Node.js verziót
node --version

# Node.js 20+ kell
```

### 4. Újraindítás

```bash
# PM2 újraindítás
pm2 restart zedingaming

# Vagy törlés és újraindítás
pm2 delete zedingaming
pm2 start npm --name "zedingaming" -- start
```

### 5. Manuális Tesztelés

```bash
# Próbáld meg manuálisan indítani
npm start

# Ha itt is hiba van, nézd meg a hibaüzenetet
```

### 6. Build Ellenőrzés

```bash
# Ellenőrizd, hogy van-e .next mappa
ls -la .next

# Ha nincs, build készítése
npm run build
```

