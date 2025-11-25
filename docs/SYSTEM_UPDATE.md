# Rendszer Frissítési Funkció

## Áttekintés

Az admin felületről egy kattintással frissítheted a teljes rendszert. A frissítés automatikusan:

1. **Git Pull** - Letölti a legújabb változásokat
2. **NPM Install** - Telepíti az új függőségeket
3. **Database Migrate** - Frissíti az adatbázis struktúrát (adatvesztés nélkül)
4. **Docker Build** - Újra buildeli a konténereket
5. **Docker Restart** - Újraindítja a szolgáltatásokat

## Használat

1. Menj az **Admin Panel** → **Rendszer** oldalra
2. Kattints a **"Rendszer Frissítése"** gombra
3. Figyeld a progress bárt és a lépéseket
4. A frissítés befejezése után az oldal automatikusan újratöltődik

## Progress Tracking

A frissítés során valós idejű progress információkat látsz:
- **Progress bar** - Százalékos kijelzés
- **Lépések** - Melyik lépés fut éppen
- **Animációk** - Vizuális visszajelzés
- **Hibakezelés** - Ha hiba történik, részletes hibaüzenet

## Karbantartási Mód

A karbantartási mód bekapcsolásával csak az adminok férhetnek hozzá az oldalhoz.

### Használat

1. Menj az **Admin Panel** → **Rendszer** oldalra
2. Kapcsold be/ki a **Karbantartási Mód** kapcsolót
3. Amikor be van kapcsolva, a felhasználók egy karbantartási üzenetet látnak

### Működés

- **Adminok** - Továbbra is hozzáférnek az admin felülethez
- **Felhasználók** - Karbantartási oldalt látnak
- **API routes** - Továbbra is működnek
- **Automatikus ellenőrzés** - 30 másodpercenként ellenőrzi a módot

## Biztonsági Megfontolások

1. **Csak adminok** - Csak ADMIN szerepkörrel rendelkező felhasználók használhatják
2. **Progress fájl** - A progress egy JSON fájlban van tárolva (`.update-progress.json`)
3. **Hibakezelés** - Ha hiba történik, a részletes hibaüzenet megjelenik
4. **Adatbázis backup** - Ajánlott backup készítése frissítés előtt

## Technikai Részletek

### Progress Fájl

A frissítés progress-je a `.update-progress.json` fájlban van tárolva:

```json
{
  "status": "in_progress",
  "message": "Git változások letöltése...",
  "progress": 30,
  "currentStep": "git_pull"
}
```

### API Endpoints

- `POST /api/admin/system/update` - Frissítés indítása
- `GET /api/admin/system/update/status` - Progress lekérése
- `POST /api/admin/system/maintenance` - Karbantartási mód be/ki
- `GET /api/system/maintenance/check` - Karbantartási mód ellenőrzése

### Frissítési Lépések

1. **git_pull** - `git pull origin main`
2. **npm_install** - `npm install`
3. **db_migrate** - `npm run db:generate && npm run db:push`
4. **docker_build** - `docker-compose build` vagy `npm run build`
5. **docker_restart** - `docker-compose up -d` vagy `pm2 restart`

## Hibaelhárítás

### Frissítés nem indul el

- Ellenőrizd, hogy admin vagy-e
- Nézd meg a konzol logokat
- Ellenőrizd a `.update-progress.json` fájlt

### Progress nem frissül

- Frissítsd az oldalt
- Ellenőrizd a hálózati kapcsolatot
- Nézd meg a böngésző konzolt

### Docker build hiba

- Ha nincs Docker, a rendszer automatikusan PM2-t vagy sima build-et használ
- Ellenőrizd a Docker állapotát: `docker ps`
- Nézd meg a Docker logokat: `docker-compose logs`

## Jövőbeli Fejlesztések

- [ ] Rollback funkció (visszaállítás előző verzióra)
- [ ] Backup automatikus készítése frissítés előtt
- [ ] Email értesítés frissítésről
- [ ] Frissítési előzmények
- [ ] WebSocket-alapú valós idejű progress

