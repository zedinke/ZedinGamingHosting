# Rendszer Újraindítási Utasítások

Miután a build sikeresen lefutott, újra kell indítani a rendszert, hogy a változások életbe lépjenek.

## PM2 Használata (Ajánlott)

Ha PM2-vel futtatod a Next.js alkalmazást:

```bash
# 1. PM2 újraindítás
pm2 restart zedin-gaming-hosting

# Vagy ha nem tudod a nevet, listázd ki a folyamatokat:
pm2 list

# 2. Ellenőrzés
pm2 status
pm2 logs zedin-gaming-hosting --lines 50
```

## Systemd Használata

Ha systemd service-ként fut:

```bash
# 1. Service újraindítás
sudo systemctl restart zedin-gaming-hosting

# 2. Ellenőrzés
sudo systemctl status zedin-gaming-hosting
```

## NPM Start Használata

Ha közvetlenül `npm start`-tal futtatod:

```bash
# 1. Állítsd le a folyamatot (Ctrl+C vagy kill)
# 2. Indítsd újra
npm start
```

## Next.js Standalone Mode

Ha `output: 'standalone'` módban fut:

```bash
# 1. Állítsd le a folyamatot
pkill -f "node.*\.next/standalone"

# 2. Indítsd újra
cd /home/ZedGamingHosting/web/zedgaminghosting.hu/public_html
node .next/standalone/server.js
```

## Teljes Újraindítási Folyamat

Ha bizonytalan vagy, hogy hogyan fut a rendszer:

```bash
# 1. Build (ha még nem futott le)
npm run build

# 2. Prisma generate (ha szükséges)
npm run db:generate

# 3. PM2 újraindítás (ha PM2-t használsz)
pm2 restart all

# 4. Vagy manuális újraindítás
# Állítsd le az aktuális folyamatot, majd indítsd újra
```

## Ellenőrzés

Miután újraindítottad, ellenőrizd:

1. **Logok ellenőrzése:**
   ```bash
   pm2 logs --lines 100
   # vagy
   tail -f /var/log/zedin-gaming-hosting.log
   ```

2. **Weboldal ellenőrzése:**
   - Nyisd meg a böngészőben: `https://zedgaminghosting.hu`
   - Ellenőrizd, hogy az új funkciók működnek-e

3. **API ellenőrzése:**
   - Próbáld meg az admin panelt megnyitni
   - Ellenőrizd, hogy az új CMS funkciók elérhetők-e

## Hibaelhárítás

Ha a rendszer nem indul el:

1. **Ellenőrizd a logokat:**
   ```bash
   pm2 logs --err
   ```

2. **Ellenőrizd a környezeti változókat:**
   ```bash
   cat .env
   ```

3. **Ellenőrizd a portot:**
   ```bash
   netstat -tulpn | grep :3000
   # vagy
   lsof -i :3000
   ```

4. **Próbáld meg manuálisan indítani:**
   ```bash
   npm start
   ```

## Gyors Újraindítás (PM2)

Ha PM2-t használsz, a leggyorsabb módszer:

```bash
pm2 restart all && pm2 logs --lines 20
```

