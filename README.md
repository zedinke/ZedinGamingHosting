# ZedinGamingHosting - Gaming Server Hosting Platform

Teljes körű gaming szerver hosting platform CMS képességekkel, felhasználókezeléssel, számlázási rendszerrel és admin vezérlőpulttal.

## Tech Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + Server Actions
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: NextAuth.js
- **Payments**: Stripe
- **Deployment**: Docker

## Főbb Funkciók

1. **Website CMS** - Dinamikus oldalépítő, blog kezelés, többnyelvű támogatás
2. **Felhasználókezelés** - Regisztráció, bejelentkezés, 2FA, szerepkör alapú hozzáférés
3. **Szerver Rendelés & Kezelés** - Szerver választás, konfiguráció, valós idejű monitoring
4. **Számlázás & Előfizetések** - Stripe integráció, automatikus számlázás, kupon rendszer
5. **Admin Vezérlőpult** - Teljes rendszerkezelés, jelentések, analytics
6. **Támogatás** - Ticket rendszer, chat, tudásbázis

## Telepítés

```bash
# Függőségek telepítése
npm install

# Adatbázis migrációk futtatása
npm run db:generate
npm run db:push

# Fejlesztői szerver indítása
npm run dev
```

## Hestia CP Integráció

Ez az alkalmazás a **Hestia CP** webes adatbázis és levelezés szolgáltatásait használja.

### Előfeltételek

1. **Hestia CP telepítve** és működik
2. **Adatbázis létrehozva** a Hestia CP-ben (PostgreSQL vagy MySQL)
3. **Email fiók létrehozva** a Hestia CP-ben

Részletes beállítási útmutató: [Hestia CP Setup Dokumentáció](./docs/HESTIA_CP_SETUP.md)

## Környezeti Változók

Másold a `.env.example` fájlt `.env`-re és töltsd ki a Hestia CP adataiddal:

```env
# Adatbázis (Hestia CP által kezelt)
DATABASE_URL="postgresql://zedingaming_user:JELSZÓ@localhost:5432/zedingaming"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Email (Hestia CP SMTP)
SMTP_HOST=localhost
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=your-email-password
SMTP_FROM=noreply@yourdomain.com

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."

# OAuth (opcionális)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
DISCORD_CLIENT_ID=""
DISCORD_CLIENT_SECRET=""
```

## Többnyelvű Támogatás

A rendszer magyar és angol nyelvet támogat. Az alapértelmezett nyelv a magyar.

## Fejlesztési Fázisok

- ✅ Fázis 1: Alapok (projekt struktúra, i18n, auth)
- ⏳ Fázis 2: Főbb funkciók (szerver rendelés, Stripe)
- ⏳ Fázis 3: Fejlett funkciók (teljes vezérlőpult)
- ⏳ Fázis 4: Finomítás és skálázás

