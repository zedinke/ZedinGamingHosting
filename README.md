# ZedinGamingHosting - Gaming Server Hosting Platform

Teljes körű gaming szerver hosting platform CMS képességekkel, felhasználókezeléssel, számlázási rendszerrel és admin vezérlőpulttal.

## 🚀 Tech Stack

- **Frontend**: Next.js 14.2.33 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + Server Actions
- **Database**: MySQL/PostgreSQL + Prisma ORM 5.22.0
- **Authentication**: NextAuth.js
- **Payments**: Stripe, PayPal, Revolut
- **Deployment**: Docker, Standalone Build, PM2
- **Email**: Nodemailer (Hestia CP SMTP)
- **PDF Generation**: Puppeteer (opcionális)

## ✨ Főbb Funkciók

### 🎮 Gaming Szerver Kezelés
- **Szerver Rendelés**: Konfigurációs varázsló, játék típus választás (Minecraft, ARK, Rust, Valheim, stb.)
- **Szerver Kezelés**: Start/Stop/Restart, konzol hozzáférés, fájlkezelő
- **Valós idejű Monitoring**: Server-Sent Events (SSE) alapú monitoring
- **Automatikus Provisioning**: Szerver automatikus telepítés fizetés után
- **Port Management**: Automatikus port kiosztás és ellenőrzés

### 💳 Fizetési Rendszer
- **Több fizetési mód**: Stripe, PayPal, Revolut integráció
- **Előfizetések**: Automatikus számlázás, megújítás
- **Kuponok**: Százalékos vagy fix összegű kedvezmények
- **Számlázás**: Automatikus számla generálás, PDF export (puppeteer opcionális)
- **Webhook kezelés**: Automatikus fizetési események feldolgozása

### 👥 Felhasználókezelés
- **Regisztráció & Bejelentkezés**: Email/jelszó, OAuth (Google, Discord)
- **Email Verifikáció**: Automatikus email küldés és verifikáció
- **Jelszó Visszaállítás**: Biztonságos token alapú visszaállítás
- **Szerepkörök**: USER, MODERATOR, ADMIN, PROBA
- **Jogosultság Kezelés**: Admin felületen szerepkör változtatás
- **2FA**: Kétfaktoros autentikáció támogatás

### 📝 CMS Rendszer
- **Slideshow Kezelés**: Képfeltöltés, automatikus váltás, időzítés beállítás
- **Blog/News**: Cikkek kezelése, kategóriák, címkék
- **Statikus Oldalak**: Dinamikus oldalépítő
- **FAQ**: Gyakran ismételt kérdések kezelése
- **Árazás**: Dinamikus árazási táblázat
- **Testimonials**: Vásárlói vélemények
- **Team**: Csapat tagok kezelése
- **Games**: Játékok és kategóriák kezelése

### 🛠️ Admin Vezérlőpult
- **Felhasználókezelés**: Felhasználók listázása, szerkesztése, jogosultság változtatás
- **Szerver Kezelés**: Összes szerver áttekintése, állapot kezelés
- **Előfizetések**: Előfizetések kezelése, számlák
- **Számlázás**: Számlák kezelése, PDF generálás
- **Támogatás**: Ticket rendszer kezelése
- **Analytics**: Rendszer statisztikák, jelentések
- **Rendszer Frissítés**: Automatikus git pull és build
- **Performance Monitoring**: Teljesítmény metrikák, health checks
- **Audit Logs**: Rendszer események naplózása

### 🤖 AI Chat Támogatás
- **Helyben futó LLM**: Ollama integráció magyar nyelvű válaszokhoz
- **Automatikus telepítés**: Nincs szükség manuális beállításra
- **Hostingra specializált**: Gaming szerver hosting kérdésekben segít
- **Jobb oldali chat panel**: Minden oldalon elérhető (csak bejelentkezett felhasználóknak)
- **Konverzációk mentése**: Minden beszélgetés elmentődik

### 🔧 Fejlett Rendszerek
- **Error Handling**: Központi hibakezelő rendszer strukturált hibakezeléssel
- **Performance Monitoring**: Teljesítmény metrikák gyűjtése és elemzése
- **Cache Rendszer**: In-memory cache gyors adateléréshez
- **Security Utilities**: Biztonsági segédfüggvények validációhoz és védelemhez
- **Logger Rendszer**: Strukturált logging különböző log szintekkel
- **Backup Storage**: S3 és FTP integráció lazy loading-gel (opcionális)
- **SSH Integráció**: Biztonságos SSH kapcsolat szerver gépekkel
- **Automatikus Task Feldolgozás**: Cron job alapú háttér feldolgozás

### 🤖 Agent-Based Architektúra
- **Weboldal (Next.js)**: Felhasználói és admin felület, API Gateway
- **Manager Logika**: Központi koordinátor, terheléselosztás, task kezelés
- **Game Server Agents**: Külön alkalmazások a szerver gépeken
- **Heartbeat Rendszer**: Agent állapot monitoring
- **Task Queue**: Háttér feladatok feldolgozása

### 🌐 Többnyelvű Támogatás
- **Magyar**: Alapértelmezett nyelv
- **Angol**: Teljes fordítás
- **i18n Middleware**: Automatikus nyelv detektálás
- **Dinamikus fordítások**: Server és client komponensek támogatása

## 📦 Telepítés

### Előfeltételek
- Node.js 18+ 
- MySQL vagy PostgreSQL (Hestia CP által kezelt)
- Hestia CP (opcionális, de ajánlott)
- Git

### Telepítési Lépések

```bash
# Repository klónozása
git clone https://github.com/zedinke/ZedinGamingHosting.git
cd ZedinGamingHosting

# Függőségek telepítése
npm install

# Környezeti változók beállítása
cp .env.example .env
# Szerkeszd a .env fájlt a saját adataiddal

# Adatbázis migrációk futtatása
npm run db:generate
npm run db:push

# Opcionális: Seed adatok betöltése
npm run db:seed

# Fejlesztői szerver indítása
npm run dev
```

### Production Build

```bash
# Production build
npm run build

# Production szerver indítása
npm start

# PM2-vel (ajánlott)
pm2 start npm --name "zedingaming" -- start
```

## 🔐 Környezeti Változók

Másold a `.env.example` fájlt `.env`-re és töltsd ki:

```env
# Adatbázis (Hestia CP által kezelt)
DATABASE_URL="mysql://user:password@localhost:3306/database"

# NextAuth
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Email (Hestia CP SMTP)
SMTP_HOST=localhost
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=your-email-password
SMTP_FROM=noreply@yourdomain.com

# Stripe
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# PayPal (opcionális)
PAYPAL_CLIENT_ID=""
PAYPAL_CLIENT_SECRET=""
PAYPAL_MODE="sandbox" # vagy "live"

# Revolut (opcionális)
REVOLUT_API_KEY=""

# OAuth (opcionális)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
DISCORD_CLIENT_ID=""
DISCORD_CLIENT_SECRET=""

# Projekt gyökér (Hestia CP standalone build-hez)
PROJECT_ROOT="/home/user/web/domain.com/public_html"
```

## 🎯 Opcionális Függőségek

A rendszer bizonyos funkciókhoz opcionális függőségeket használ:

- **puppeteer**: PDF számla generálás (ha nincs telepítve, HTML-t ad vissza)
- **basic-ftp**: FTP backup storage
- **@aws-sdk/client-s3**: AWS S3 backup storage

Ezek a függőségek dinamikusan töltődnek be, így a build akkor is sikeres, ha nincsenek telepítve.

## 📚 Dokumentáció

- [Hestia CP Setup](./docs/HESTIA_CP_SETUP.md) - Hestia CP integráció beállítása
- [Agent Architektúra](./docs/AGENT_ARCHITECTURE.md) - Agent-based architektúra részletei
- [Cron Job Beállítás](./docs/CRON_SETUP.md) - Automatikus task feldolgozás
- [Telepítési Útmutató](./docs/COMPLETE_INSTALLATION.md) - Részletes telepítési útmutató
- [Rendszer Frissítés](./docs/SYSTEM_UPDATE.md) - Automatikus rendszer frissítés
- [Troubleshooting](./docs/TROUBLESHOOTING.md) - Gyakori problémák megoldása

## 🏗️ Projekt Struktúra

```
/
├── app/                    # Next.js App Router
│   ├── [locale]/          # Lokalizált oldalak
│   │   ├── admin/         # Admin panel oldalak
│   │   ├── dashboard/     # Felhasználói dashboard
│   │   └── ...
│   ├── api/               # API routes
│   │   ├── admin/         # Admin API endpoints
│   │   ├── agent/         # Agent API endpoints
│   │   ├── auth/          # Autentikáció
│   │   ├── invoices/      # Számlázás
│   │   ├── payments/      # Fizetések
│   │   └── webhooks/      # Webhook kezelés
│   └── ...
├── components/            # React komponensek
│   ├── admin/            # Admin komponensek
│   ├── auth/             # Autentikáció komponensek
│   ├── dashboard/        # Dashboard komponensek
│   └── ui/               # UI komponensek
├── lib/                   # Segédfüggvények
│   ├── auth.ts           # NextAuth konfig
│   ├── email.ts          # Email küldés
│   ├── prisma.ts         # Prisma client
│   ├── payments/         # Fizetési integrációk
│   └── ...
├── prisma/               # Prisma séma és migrációk
├── public/               # Statikus fájlok
│   ├── locales/         # Fordítási JSON fájlok
│   └── uploads/         # Feltöltött fájlok
├── scripts/              # Segéd scriptek
└── docs/                 # Dokumentáció
```

## 🔄 Automatikus Rendszer Frissítés

A rendszer támogatja az automatikus frissítést git pull-lal:

1. Admin panel → Rendszer → Frissítés
2. Automatikus git pull, build, és PM2 restart
3. Frissítési állapot valós idejű követése

## 🎨 Főbb Jellemzők

- ✅ **Moduláris Architektúra**: Könnyen bővíthető komponensek
- ✅ **TypeScript**: Teljes típus biztonság
- ✅ **Responsive Design**: Mobil és desktop támogatás
- ✅ **SEO Optimalizált**: Meta tagok, sitemap
- ✅ **Biztonság**: Rate limiting, CSRF védelem, XSS védelem
- ✅ **Performance**: Code splitting, lazy loading, caching
- ✅ **Standalone Build**: Önálló build Hestia CP-hez
- ✅ **PM2 Support**: Process management production környezetben

## 🐛 Hibakeresés

- **Build hibák**: Lásd [Build Troubleshooting](./docs/BUILD_TROUBLESHOOTING.md)
- **Adatbázis problémák**: Lásd [Database Troubleshooting](./docs/DATABASE_TROUBLESHOOTING.md)
- **Email problémák**: Lásd [Email Setup](./docs/EMAIL_SETUP_COMPLETE.md)
- **Upload problémák**: Lásd [Upload Troubleshooting](./docs/UPLOAD_TROUBLESHOOTING.md)

## 📝 Fejlesztési Fázisok

- ✅ **Fázis 1**: Alapok (projekt struktúra, i18n, auth, CMS)
- ✅ **Fázis 2**: Főbb funkciók (szerver rendelés, fizetések, admin panel)
- ✅ **Fázis 3**: Fejlett funkciók (monitoring, agent architektúra, automatikus frissítés)
- 🚧 **Fázis 4**: Finomítás és skálázás (optimalizálás, további funkciók)

## 🤝 Közreműködés

A projekt jelenleg privát, de javaslatokat és bug reportokat szívesen fogadunk.

## 📄 Licenc

Privát projekt - Minden jog fenntartva

## 🔗 Linkek

- **Production**: https://zedgaminghosting.hu
- **GitHub**: https://github.com/zedinke/ZedinGamingHosting

---

**Fejlesztve**: Zedin Gaming Hosting Team  
**Verzió**: 1.0.0  
**Utolsó frissítés**: 2024
