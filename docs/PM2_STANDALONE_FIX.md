# PM2 Standalone Build Fix

## Probléma

Ha a `next.config.js`-ben `output: 'standalone'` van beállítva, akkor nem a `npm start` (ami `next start`-ot futtat) parancsot kell használni, hanem közvetlenül a standalone szervert.

## Megoldás

### 1. PM2 újraindítás standalone módban

```bash
# PM2 törlése
pm2 delete zedingaming

# PM2 újraindítás standalone szerverrel
pm2 start node --name "zedingaming" -- .next/standalone/server.js

# PM2 mentése
pm2 save
```

### 2. Vagy módosítsd a package.json start scriptjét

A `package.json`-ban:
```json
{
  "scripts": {
    "start": "node .next/standalone/server.js"
  }
}
```

Akkor a régi parancs is működik:
```bash
pm2 start npm --name "zedingaming" -- start
```

### 3. Ellenőrzés

```bash
# PM2 státusz
pm2 list

# Logok
pm2 logs zedingaming --lines 20

# Port ellenőrzés
netstat -tuln | grep 3000
```

