# Hestia CP Integráció Beállítása

Ez a dokumentum leírja, hogyan kell beállítani a ZedinGamingHosting alkalmazást a Hestia CP-vel való integrációhoz.

## Előfeltételek

- Hestia CP telepítve és működik
- Web domain létrehozva a Hestia CP-ben
- Adatbázis létrehozva a Hestia CP-ben
- Email fiók létrehozva a Hestia CP-ben

## 1. Adatbázis Beállítása

### 1.1 Adatbázis létrehozása a Hestia CP-ben

1. Jelentkezz be a Hestia CP admin felületére
2. Menj a **Databases** menüpontra
3. Kattints az **Add Database** gombra
4. Töltsd ki az adatokat:
   - **Database name**: `zedingaming` (vagy tetszőleges név)
   - **Database user**: `zedingaming_user` (vagy tetszőleges felhasználó)
   - **Database password**: Generálj egy erős jelszót
5. Mentsd el a jelszót biztonságos helyen!

### 1.2 Adatbázis kapcsolat konfigurálása

A `.env` fájlban állítsd be a `DATABASE_URL` változót:

**PostgreSQL esetén:**
```env
DATABASE_URL="postgresql://zedingaming_user:JELSZÓ@localhost:5432/zedingaming"
```

**MySQL/MariaDB esetén:**
```env
DATABASE_URL="mysql://zedingaming_user:JELSZÓ@localhost:3306/zedingaming"
```

**Fontos:** 
- Ha a Hestia CP MySQL-t használ, módosítsd a `prisma/schema.prisma` fájlban a `provider = "mysql"`-re
- A Hestia CP általában `localhost`-on fut, de ellenőrizd a pontos host címet

### 1.3 Adatbázis migrációk futtatása

```bash
# Prisma client generálása
npm run db:generate

# Adatbázis séma létrehozása
npm run db:push

# Vagy migrációk használata (ajánlott production-ben)
npm run db:migrate
```

## 2. Email Beállítása

### 2.1 Email fiók létrehozása a Hestia CP-ben

1. Menj a **Mail** menüpontra a Hestia CP-ben
2. Kattints az **Add Mail Account** gombra
3. Töltsd ki az adatokat:
   - **Email**: `noreply@yourdomain.com` (vagy más email cím)
   - **Password**: Generálj egy erős jelszót
4. Mentsd el a jelszót!

### 2.2 SMTP konfiguráció

A `.env` fájlban állítsd be az SMTP beállításokat:

```env
# SMTP beállítások (Hestia CP mail szerver)
SMTP_HOST=localhost
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=EMAIL_JELSZÓ
SMTP_FROM=noreply@yourdomain.com
```

**Alternatív beállítások:**

Ha a Hestia CP SSL/TLS-t használ:
```env
SMTP_PORT=465
SMTP_SECURE=true
```

Ha külső SMTP szervert használsz (pl. Gmail, SendGrid):
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=app-specific-password
```

### 2.3 Email tesztelése

Az email küldés teszteléséhez használd a Prisma Studio-t vagy hozz létre egy teszt endpoint-ot:

```typescript
// app/api/test-email/route.ts
import { sendEmail } from '@/lib/email';

export async function POST() {
  const result = await sendEmail({
    to: 'test@example.com',
    subject: 'Test Email',
    html: '<h1>Test</h1>',
  });
  return Response.json(result);
}
```

## 3. Környezeti Változók Teljes Listája

Hozz létre egy `.env` fájlt a projekt gyökerében:

```env
# Adatbázis (Hestia CP)
DATABASE_URL="postgresql://user:password@localhost:5432/zedingaming"

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
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# OAuth (opcionális)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
```

## 4. Hestia CP Web Domain Konfiguráció

### 4.1 Domain hozzáadása

1. Menj a **Web** menüpontra
2. Kattints az **Add Web Domain** gombra
3. Add meg a domain nevet: `zedingaming.com` (vagy subdomain: `app.yourdomain.com`)
4. Válaszd ki a PHP verziót (8.1 vagy újabb ajánlott)
5. Engedélyezd az SSL-t (Let's Encrypt)

### 4.2 Node.js alkalmazás beállítása

A Hestia CP nem támogatja közvetlenül a Node.js alkalmazásokat. Két lehetőség van:

**Opció 1: Docker használata (ajánlott)**
- Használd a mellékelt `Dockerfile` és `docker-compose.yml` fájlokat
- A Hestia CP-ben hozz létre egy reverse proxy-t

**Opció 2: PM2 használata**
- Telepítsd a PM2-t: `npm install -g pm2`
- Indítsd el az alkalmazást: `pm2 start npm --name "zedingaming" -- start`
- A Hestia CP-ben állíts be egy reverse proxy-t a PM2 által futtatott alkalmazáshoz

### 4.3 Reverse Proxy beállítása

A Hestia CP-ben:

1. Menj a **Web** menüpontra
2. Válaszd ki a domain-t
3. Kattints a **Edit** gombra
4. Az **Advanced** fülön add hozzá a reverse proxy beállításokat:

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

## 5. Biztonsági Megfontolások

1. **Adatbázis jelszó**: Használj erős, egyedi jelszavakat
2. **Email jelszó**: Ne oszd meg senkivel
3. **NEXTAUTH_SECRET**: Generálj egy erős secret-et: `openssl rand -base64 32`
4. **SSL/TLS**: Mindig használj HTTPS-t production-ben
5. **Firewall**: Csak a szükséges portokat nyisd meg

## 6. Hibaelhárítás

### Adatbázis kapcsolati hiba

- Ellenőrizd, hogy a Hestia CP-ben létrehoztad-e az adatbázist
- Ellenőrizd a `DATABASE_URL` formátumát
- Teszteld a kapcsolatot: `psql -h localhost -U zedingaming_user -d zedingaming`

### Email küldési hiba

- Ellenőrizd az SMTP beállításokat
- Teszteld a Hestia CP mail szerver működését
- Nézd meg a Hestia CP mail logokat
- Ha self-signed cert van, állítsd be a `tls.rejectUnauthorized = false`-t

### Port konfliktusok

- A Hestia CP általában a 80, 443, 3306, 5432 portokat használja
- Az alkalmazás alapértelmezetten a 3000-es porton fut
- Ha szükséges, változtasd meg a portot a `package.json`-ban vagy környezeti változóban

## 7. További Források

- [Hestia CP Dokumentáció](https://www.hestiacp.com/docs/)
- [Prisma Dokumentáció](https://www.prisma.io/docs)
- [Next.js Dokumentáció](https://nextjs.org/docs)
- [Nodemailer Dokumentáció](https://nodemailer.com/about/)

