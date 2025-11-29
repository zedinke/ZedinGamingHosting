# PM2 Javítás Standalone Build Kikapcsolása Után

## Probléma
500 Internal Server Error - a PM2 még mindig a standalone build-et próbálja futtatni, de az már nem létezik.

## Megoldás

### 1. Állítsd le a PM2 folyamatot

```bash
pm2 stop zedingaming
# vagy
pm2 delete zedingaming
```

### 2. Töröld a régi build fájlokat

```bash
cd /home/ZedGamingHosting/web/zedgaminghosting.hu/public_html
rm -rf .next
rm -rf node_modules/.cache
```

### 3. Frissítsd a kódot

```bash
git pull origin main
```

### 4. Újra build (nem standalone)

```bash
npm run build
```

### 5. Indítsd újra a PM2-t normál módban

```bash
# Töröld a régi PM2 folyamatot
pm2 delete zedingaming

# Indítsd újra normál módban (nem standalone)
cd /home/ZedGamingHosting/web/zedgaminghosting.hu/public_html
pm2 start npm --name "zedingaming" -- start

# Vagy ha van PM2 ecosystem fájl, használd azt
# pm2 start ecosystem.config.js

# Mentsd el
pm2 save
```

### 6. Ellenőrizd a státuszt

```bash
pm2 list
pm2 logs zedingaming --lines 50
```

## Alternatív: PM2 Ecosystem Fájl

Hozz létre egy `ecosystem.config.js` fájlt:

```js
module.exports = {
  apps: [{
    name: 'zedingaming',
    script: 'npm',
    args: 'start',
    cwd: '/home/ZedGamingHosting/web/zedgaminghosting.hu/public_html',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

Majd indítsd:
```bash
pm2 start ecosystem.config.js
pm2 save
```

## Hibaelhárítás

Ha még mindig 500-as hiba:

1. Ellenőrizd a logokat:
   ```bash
   pm2 logs zedingaming --lines 100
   ```

2. Ellenőrizd, hogy fut-e a process:
   ```bash
   pm2 list
   netstat -tuln | grep 3000
   ```

3. Próbáld meg manuálisan indítani:
   ```bash
   cd /home/ZedGamingHosting/web/zedgaminghosting.hu/public_html
   npm start
   ```

4. Ha működik manuálisan, akkor a PM2 konfiguráció a probléma.



