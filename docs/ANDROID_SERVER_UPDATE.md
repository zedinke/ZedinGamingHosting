# Android App - Szerver Frissítés

## Gyors Frissítés (Copy-Paste)

A szerveren futtasd le ezeket a parancsokat:

```bash
# 1. Navigálj a projekt könyvtárba
cd /home/ZedGamingHosting/web/zedgaminghosting.hu/public_html

# 2. Git pull (legújabb változások letöltése)
git pull origin main

# 3. Függőségek telepítése (ha változtak)
npm install

# 4. Prisma client generálása
npm run db:generate

# 5. Adatbázis séma frissítése (új PushToken tábla)
npm run db:push

# 6. Production build
npm run build

# 7. PM2 újraindítás
pm2 restart zedingaming

# 8. Ellenőrzés
curl -X POST https://zedgaminghosting.hu/api/mobile-auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}' \
  -v
```

## Részletes Lépések

### 1. Git Pull

```bash
cd /home/ZedGamingHosting/web/zedgaminghosting.hu/public_html
git pull origin main
```

**Ha merge conflict van:**
```bash
git reset --hard origin/main
```

### 2. Függőségek Telepítése

Az új `firebase-admin` package telepítése:

```bash
npm install
```

### 3. Prisma Client Generálása

```bash
npm run db:generate
```

### 4. Adatbázis Séma Frissítése

Az új `PushToken` modell hozzáadása:

```bash
npm run db:push
```

**Ellenőrzés:**
```bash
# MySQL esetén
mysql -u zedingaming_user -p zedingaming -e "SHOW TABLES LIKE 'push_tokens';"

# PostgreSQL esetén
psql -U zedingaming_user -d zedingaming -c "\dt push_tokens"
```

### 5. Production Build

```bash
npm run build
```

**Ellenőrzés:**
```bash
# Nézd meg, hogy létrejött-e a route
ls -la .next/server/app/api/mobile-auth/login/
```

### 6. PM2 Újraindítás

```bash
pm2 restart zedingaming
```

**PM2 állapot ellenőrzése:**
```bash
pm2 status
pm2 logs zedingaming --lines 50
```

### 7. API Endpoint Tesztelése

```bash
# Login endpoint tesztelése
curl -X POST https://zedgaminghosting.hu/api/mobile-auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"geleako@gmail.com","password":"jelszo123"}' \
  -v
```

**Várt válasz:**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "geleako@gmail.com",
    "name": "...",
    "role": "USER",
    "image": null
  },
  "error": null
}
```

## Firebase Admin SDK Beállítása

Ha még nincs beállítva a Firebase Admin SDK:

1. **Firebase Console-ban:**
   - Lépj be a Firebase Console-ba
   - Válaszd ki a projektet
   - Settings → Service Accounts
   - Generate New Private Key
   - Töltsd le a JSON fájlt

2. **Szerveren:**
   ```bash
   # Töltsd fel a JSON fájlt a szerverre
   # Például: /home/ZedGamingHosting/web/zedgaminghosting.hu/public_html/firebase-admin-key.json
   ```

3. **.env fájl frissítése:**
   ```env
   FIREBASE_ADMIN_KEY_PATH=/home/ZedGamingHosting/web/zedgaminghosting.hu/public_html/firebase-admin-key.json
   ```

4. **Újraindítás:**
   ```bash
   pm2 restart zedingaming
   ```

## Ellenőrzési Lista

- [ ] `git pull origin main` sikeres
- [ ] `npm install` sikeres
- [ ] `npm run db:generate` sikeres
- [ ] `npm run db:push` sikeres (push_tokens tábla létrejött)
- [ ] `npm run build` sikeres
- [ ] `.next/server/app/api/mobile-auth/login/route.js` létezik
- [ ] `pm2 restart zedingaming` sikeres
- [ ] `curl` teszt sikeres (200 OK válasz)
- [ ] Firebase Admin SDK beállítva (ha push notification-t használsz)

## Hibaelhárítás

### Probléma: 404 Not Found

**Ok:** A route nem található a szerveren.

**Megoldás:**
```bash
# Ellenőrizd, hogy a fájl létezik-e
ls -la app/api/mobile-auth/login/route.ts

# Ha nincs, pull újra
git pull origin main

# Build újra
npm run build

# PM2 restart
pm2 restart zedingaming
```

### Probléma: 500 Internal Server Error

**Ok:** Valószínűleg adatbázis vagy függőség probléma.

**Megoldás:**
```bash
# Nézd meg a logokat
pm2 logs zedingaming --lines 100

# Ellenőrizd az adatbázis kapcsolatot
npm run db:push

# Prisma client újragenerálása
npm run db:generate
```

### Probléma: Firebase Admin SDK hiba

**Ok:** A Firebase Admin SDK nincs beállítva vagy a key fájl nem található.

**Megoldás:**
```bash
# Ellenőrizd a .env fájlt
cat .env | grep FIREBASE

# Ellenőrizd, hogy a key fájl létezik-e
ls -la firebase-admin-key.json

# Ha nincs, töltsd fel a szerverre
```

## További Információ

- [Android App Integration Guide](./ANDROID_APP_INTEGRATION.md)
- [Android Quick Setup](./ANDROID_QUICK_SETUP.md)
- [Android Login Troubleshooting](./ANDROID_LOGIN_TROUBLESHOOTING.md)

