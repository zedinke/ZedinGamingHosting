# Telepítési Útmutató

Ez az útmutató lépésről lépésre bemutatja, hogyan állítsd be a ZedinGamingHosting platformot Hestia CP-vel.

## Előfeltételek

- Node.js 20+ telepítve
- Hestia CP telepítve és működik
- PostgreSQL vagy MySQL adatbázis elérhető a Hestia CP-ben
- Email fiók létrehozva a Hestia CP-ben

## 1. Projekt Klónozása és Függőségek Telepítése

```bash
# Ha még nincs klónozva, klónozd a projektet
cd /path/to/project

# Függőségek telepítése
npm install
```

## 2. Hestia CP Beállítása

### 2.1 Adatbázis Létrehozása

1. Jelentkezz be a Hestia CP admin felületére
2. Menj a **Databases** menüpontra
3. Kattints az **Add Database** gombra
4. Töltsd ki:
   - **Database name**: `zedingaming`
   - **Database user**: `zedingaming_user`
   - **Database password**: Generálj egy erős jelszót
5. Mentsd el a jelszót!

### 2.2 Email Fiók Létrehozása

1. Menj a **Mail** menüpontra
2. Kattints az **Add Mail Account** gombra
3. Töltsd ki:
   - **Email**: `noreply@yourdomain.com`
   - **Password**: Generálj egy erős jelszót
4. Mentsd el a jelszót!

## 3. Környezeti Változók Beállítása

Hozz létre egy `.env` fájlt a projekt gyökerében:

```bash
cp .env.example .env
```

Szerkeszd a `.env` fájlt és töltsd ki a Hestia CP adataiddal:

```env
# Adatbázis (Hestia CP)
DATABASE_URL="postgresql://zedingaming_user:JELSZÓ@localhost:5432/zedingaming"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="openssl rand -base64 32" # Futtasd le ezt a parancsot

# Email (Hestia CP SMTP)
SMTP_HOST=localhost
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=email-jelszó
SMTP_FROM=noreply@yourdomain.com

# Stripe (fejlesztéshez)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 4. Adatbázis Migrációk

```bash
# Prisma client generálása
npm run db:generate

# Adatbázis séma létrehozása
npm run db:push
```

## 5. Fejlesztői Szerver Indítása

```bash
npm run dev
```

Az alkalmazás elérhető lesz: `http://localhost:3000`

## 6. Production Telepítés

### Docker használatával

```bash
# Build
docker-compose build

# Indítás
docker-compose up -d
```

### PM2 használatával

```bash
# Build
npm run build

# PM2 telepítése
npm install -g pm2

# Indítás
pm2 start npm --name "zedingaming" -- start
pm2 save
pm2 startup
```

## 7. Hestia CP Reverse Proxy Beállítása

1. Menj a **Web** menüpontra a Hestia CP-ben
2. Válaszd ki a domain-t
3. Kattints a **Edit** gombra
4. Az **Advanced** fülön add hozzá:

```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## 8. Első Admin Felhasználó Létrehozása

Az adatbázisban manuálisan vagy egy script segítségével:

```bash
# Prisma Studio használatával
npm run db:studio
```

Vagy hozz létre egy seed scriptet a `prisma/seed.ts` fájlban.

## 9. Tesztelés

1. Nyisd meg: `http://localhost:3000` (vagy a domain-t)
2. Regisztrálj egy új felhasználót
3. Ellenőrizd az emailt (spam mappa is!)
4. Jelentkezz be
5. Teszteld a dashboard-ot

## Hibaelhárítás

### Adatbázis kapcsolati hiba

- Ellenőrizd, hogy a Hestia CP-ben létrehoztad-e az adatbázist
- Ellenőrizd a `DATABASE_URL` formátumát
- Teszteld: `psql -h localhost -U zedingaming_user -d zedingaming`

### Email küldési hiba

- Ellenőrizd az SMTP beállításokat
- Nézd meg a Hestia CP mail logokat
- Teszteld a mail szerver működését

### Port konfliktusok

- Az alkalmazás alapértelmezetten a 3000-es porton fut
- Ha szükséges, változtasd meg a portot

 További segítségért lásd: [Hestia CP Setup](./HESTIA_CP_SETUP.md)

