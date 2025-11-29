# Git Pull Utasítások - Android App Integráció

## Összefoglaló

Az összes Android app integrációval kapcsolatos változás push-olva van a GitHub repository-ba. A következő fájlok lettek hozzáadva/modifikálva:

### Új fájlok:
- `app/api/mobile-auth/login/route.ts` - Mobile bejelentkezési endpoint
- `app/api/user/push-token/route.ts` - Push token regisztrálás/törlés endpoint
- `lib/push-notifications.ts` - Firebase push notification kezelés
- `docs/ANDROID_APP_INTEGRATION.md` - Teljes integrációs dokumentáció
- `docs/ANDROID_QUICK_SETUP.md` - Gyors beállítási útmutató
- `docs/ANDROID_SERVER_UPDATE.md` - Szerver frissítési útmutató
- `docs/ANDROID_LOGIN_TROUBLESHOOTING.md` - Bejelentkezési hibaelhárítás
- `docs/ANDROID_DEBUG_GUIDE.md` - Debug útmutató

### Módosított fájlok:
- `app/api/admin/servers/[id]/[action]/route.ts` - Push notification hozzáadása
- `app/api/servers/[id]/[action]/route.ts` - Push notification hozzáadása
- `package.json` - firebase-admin dependency hozzáadása
- `prisma/schema.prisma` - PushToken modell hozzáadása
- `next.config.js` - firebase-admin webpack externals konfiguráció

## Szerveren Futtatandó Parancsok

```bash
# 1. Navigálj a projekt könyvtárba
cd /home/ZedGamingHosting/web/zedgaminghosting.hu/public_html

# 2. Ellenőrizd a git státuszt
git status

# 3. Ha van lokális változás, mentsd el vagy dobjad el
# Opció A: Lokális változások elmentése
git stash

# Opció B: Lokális változások elvetése (FIGYELEM: elvesznek!)
# git reset --hard HEAD

# 4. Frissítsd a remote információkat
git fetch origin

# 5. Ellenőrizd, hogy vannak-e új változások
git log HEAD..origin/main --oneline

# 6. Ha vannak új változások, pull
git pull origin main

# VAGY ha merge conflict van, használd ezt:
git pull origin main --no-rebase

# VAGY ha teljesen frissíteni akarod (FIGYELEM: lokális változások elvesznek!):
git fetch origin
git reset --hard origin/main

# 7. Függőségek telepítése
npm install

# 8. Prisma client generálása
npm run db:generate

# 9. Adatbázis séma frissítése
npm run db:push

# 10. Production build
npm run build

# 11. PM2 újraindítás
pm2 restart zedingaming

# 12. Ellenőrzés
pm2 logs zedingaming --lines 50
```

## Ha a Git Pull Nem Működik

### Probléma 1: "Your branch is up to date"
**Ok:** A lokális branch már friss.
**Megoldás:**
```bash
# Ellenőrizd, hogy a remote friss-e
git fetch origin
git log HEAD..origin/main --oneline

# Ha vannak új commitok, pull
git pull origin main
```

### Probléma 2: Merge Conflict
**Ok:** Lokális változások ütköznek a remote változásokkal.
**Megoldás:**
```bash
# Opció A: Lokális változások elmentése
git stash
git pull origin main
git stash pop

# Opció B: Remote verzió használata (FIGYELEM!)
git fetch origin
git reset --hard origin/main
```

### Probléma 3: "Permission denied" vagy "Authentication failed"
**Ok:** Nincs jogosultság a repository-hoz.
**Megoldás:**
```bash
# Ellenőrizd a git konfigurációt
git remote -v

# Ha HTTPS-t használsz, lehet hogy újra kell authentikálnod
# Vagy használj SSH-t:
git remote set-url origin git@github.com:zedinke/ZedinGamingHosting.git
```

### Probléma 4: "fatal: not a git repository"
**Ok:** Nem a git repository könyvtárában vagy.
**Megoldás:**
```bash
# Navigálj a projekt könyvtárba
cd /home/ZedGamingHosting/web/zedgaminghosting.hu/public_html

# Ellenőrizd, hogy git repository-e
ls -la .git
```

## Manuális Fájl Letöltés (Ha Git Pull Nem Működik)

Ha a git pull nem működik, manuálisan is letöltheted a fájlokat:

```bash
# 1. Navigálj a projekt könyvtárba
cd /home/ZedGamingHosting/web/zedgaminghosting.hu/public_html

# 2. Töltsd le a fájlokat curl-lel vagy wget-tel
# Például:
curl -O https://raw.githubusercontent.com/zedinke/ZedinGamingHosting/main/app/api/mobile-auth/login/route.ts
# stb...

# VAGY klónozd újra a repository-t egy másik könyvtárba és másold át a fájlokat
cd /tmp
git clone https://github.com/zedinke/ZedinGamingHosting.git
cp -r ZedinGamingHosting/app/api/mobile-auth /home/ZedGamingHosting/web/zedgaminghosting.hu/public_html/app/api/
cp -r ZedinGamingHosting/app/api/user/push-token /home/ZedGamingHosting/web/zedgaminghosting.hu/public_html/app/api/user/
cp ZedinGamingHosting/lib/push-notifications.ts /home/ZedGamingHosting/web/zedgaminghosting.hu/public_html/lib/
# stb...
```

## Ellenőrzési Lista

A frissítés után ellenőrizd:

- [ ] `git pull origin main` sikeres
- [ ] `npm install` sikeres
- [ ] `npm run db:generate` sikeres
- [ ] `npm run db:push` sikeres (push_tokens tábla létrejött)
- [ ] `npm run build` sikeres
- [ ] `pm2 restart zedingaming` sikeres
- [ ] `/api/mobile-auth/login` endpoint elérhető (curl teszt)
- [ ] `/api/user/push-token` endpoint elérhető (curl teszt)

## API Endpoint Tesztelése

```bash
# Mobile login endpoint tesztelése
curl -X POST https://zedgaminghosting.hu/api/mobile-auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}' \
  -v

# Push token regisztrálás tesztelése (session cookie szükséges)
curl -X POST https://zedgaminghosting.hu/api/user/push-token \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{"token":"test-token","platform":"android"}' \
  -v
```

## További Információ

- [Android App Integration Guide](./ANDROID_APP_INTEGRATION.md)
- [Android Server Update Guide](./ANDROID_SERVER_UPDATE.md)
- [Android Quick Setup](./ANDROID_QUICK_SETUP.md)

