# ZedinGamingHosting SaaS - Funkciók

## Főbb jellemzők

### ✅ Minimális telepítés
- SQLite adatbázis - nincs szükség külső adatbázis szerverre
- Egyszerű telepítő scriptek (Windows + Linux)
- Admin user automatikus létrehozása

### ✅ License rendszer
- License key aktiválás
- License érvényesség ellenőrzés
- Hátralévő napok számlálása
- License lejárat figyelmeztetés
- License check middleware (védett route-okhoz)

### ✅ Moduláris rendszer
- Modulok telepítése/eltávolítása
- Modul konfiguráció kezelés
- Függőség kezelés
- Elérhető modulok:
  - **Adatbázis**: MySQL, PostgreSQL, MongoDB
  - **Kommunikáció**: Email (SMTP)
  - **Fizetés**: Stripe, PayPal

### ✅ Update rendszer
- Automatikus frissítés ellenőrzés
- Frissítési csatornák (stable, beta, alpha)
- License ellenőrzés frissítéseknél
- Changelog megjelenítés
- Frissítés telepítés

### ✅ Admin felület
- Dashboard (license és update információk)
- License aktiválás oldal
- Modul telepítő oldal
- Modern, reszponzív UI

### ✅ Biztonság
- NextAuth bejelentkezés
- Jelszó hash-elés (bcrypt)
- License védett route-ok
- Admin szerepkör kezelés

## Technikai részletek

### Adatbázis
- **Típus**: SQLite (fájl alapú)
- **Hely**: `data/database.db`
- **ORM**: Prisma

### Backend
- **Framework**: Next.js 14 (App Router)
- **Auth**: NextAuth.js
- **API**: Next.js API Routes

### Frontend
- **Framework**: React 18
- **Styling**: Tailwind CSS
- **UI**: Egyedi komponensek (Button, Card, Input, Badge)

### Telepítés
- **Windows**: `install.bat`
- **Linux**: `install.sh`
- **Manuális**: npm install + db setup

## Használati esetek

1. **Kezdő hosting cég**
   - Minimális telepítés
   - Moduláris bővíthetőség
   - License alapú előfizetés

2. **Kisvállalkozás**
   - SQLite - nincs szükség adatbázis szerverre
   - Egyszerű kezelés
   - Automatikus frissítések

3. **Fejlesztői környezet**
   - Gyors telepítés
   - Moduláris architektúra
   - Könnyen testreszabható

## Követelmények

- Node.js 18+
- npm vagy yarn
- Windows 10+ vagy Linux
- Internet kapcsolat (frissítésekhez és license aktiváláshoz)

## License típusok

- **TRIAL**: 14 napos próba
- **MONTHLY**: Havi előfizetés
- **YEARLY**: Éves előfizetés
- **LIFETIME**: Élethosszig tartó

## Frissítési csatornák

- **stable**: Stabil verziók (ajánlott)
- **beta**: Beta verziók (teszteléshez)
- **alpha**: Alpha verziók (fejlesztéshez)

