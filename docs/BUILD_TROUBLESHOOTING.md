# Build Hibaelhárítás

## Hiba: "Could not find a production build in the '.next' directory"

### 1. Ellenőrizd a .next mappát

```bash
# Nézd meg, mi van a .next mappában
ls -la .next/

# Ellenőrizd, hogy van-e BUILD_ID fájl
ls -la .next/BUILD_ID
```

### 2. Töröld a .next mappát és build újra

```bash
# Töröld a .next mappát
rm -rf .next

# Build újra
npm run build
```

### 3. Ellenőrizd a build folyamatot

A build során figyeld, hogy:
- ✓ Compiled successfully
- ✓ Linting and checking validity of types
- ✓ Creating an optimized production build

Ha hiba van, javítsd ki azt először.

### 4. Build ID ellenőrzés

```bash
# Nézd meg a BUILD_ID fájlt
cat .next/BUILD_ID

# Ha nincs, akkor a build nem sikerült teljesen
```

### 5. Teljes újraépítés

```bash
# Töröld a .next mappát és node_modules/.cache-t
rm -rf .next node_modules/.cache

# Build újra
npm run build

# Ellenőrizd
ls -la .next/BUILD_ID
```

### 6. Ha a build sikertelen

```bash
# Nézd meg a részletes hibaüzeneteket
npm run build 2>&1 | tee build.log

# Vagy próbáld verbose módban
NODE_OPTIONS='--trace-warnings' npm run build
```

