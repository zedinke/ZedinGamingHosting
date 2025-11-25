# Teljes Telepítési Útmutató - ZedinGamingHosting

Ez az útmutató lépésről lépésre bemutatja, hogyan telepítsd a ZedinGamingHosting platformot Hestia CP-re.

## 📋 Előfeltételek

- ✅ Hestia CP telepítve és működik
- ✅ SSH hozzáférés a szerverhez
- ✅ Node.js 20+ telepítve (vagy Docker használata)
- ✅ Git telepítve
- ✅ Domain név beállítva (vagy subdomain)

## 🔧 1. LÉPÉS: Hestia CP Beállítások

### 1.1 Adatbázis Létrehozása

1. Jelentkezz be a Hestia CP admin felületére: `https://your-server.com:8083`
2. Menj a **Databases** menüpontra
3. Kattints az **Add Database** gombra
4. Töltsd ki az adatokat:
   - **Database name**: `zedingaming`
   - **Database user**: `zedingaming_user`
   - **Database password**: Generálj egy erős jelszót (pl. `openssl rand -base64 32`)
5. **Fontos**: Mentsd el a jelszót biztonságos helyen!
6. Kattints a **Save** gombra

**Jegyezd meg:**
- Adatbázis típus: PostgreSQL vagy MySQL (a projekt PostgreSQL-t használ alapértelmezetten)
- Host: `localhost`
- Port: PostgreSQL: `5432`, MySQL: `3306`

### 1.2 Email Fiók Létrehozása

1. Menj a **Mail** menüpontra a Hestia CP-ben
2. Kattints az **Add Mail Account** gombra
3. Töltsd ki:
   - **Email**: `noreply@yourdomain.com` (vagy más email cím)
   - **Password**: Generálj egy erős jelszót
4. **Fontos**: Mentsd el a jelszót!
5. Kattints a **Save** gombra

### 1.3 Web Domain Létrehozása

1. Menj a **Web** menüpontra
2. Kattints az **Add Web Domain** gombra
3. Töltsd ki:
   - **Domain**: `yourdomain.com` vagy `app.yourdomain.com`
   - **Document Root**: `/home/user/web/yourdomain.com/public_html`
   - **PHP Version**: Válassz egyet (nem használjuk, de kötelező)
4. Engedélyezd az **SSL**-t (Let's Encrypt)
5. Kattints a **Save** gombra

## 💻 2. LÉPÉS: Projekt Letöltése

### 2.1 SSH Kapcsolat

```bash
# Kapcsolódj a szerverhez SSH-val
ssh user@your-server.com

# Navigálj a web könyvtárba
cd /home/user/web/yourdomain.com/public_html

# Töröld a meglévő tartalmat (ha van)
rm -rf *
```

### 2.2 Git Klónozás

```bash
# Klónozd a projektet
git clone https://github.com/zedinke/ZedinGamingHosting.git .

# Vagy ha másik könyvtárba szeretnéd:
cd /home/user
git clone https://github.com/zedinke/ZedinGamingHosting.git zedingaming
cd zedingaming
```

## ⚙️ 3. LÉPÉS: Környezeti Változók Beállítása

### 3.1 .env Fájl Létrehozása

```bash
# Másold az .env.example fájlt
cp .env.example .env

# Szerkeszd a .env fájlt
nano .env
```

### 3.2 .env Fájl Tartalma

Töltsd ki a következő adatokat a Hestia CP adataiddal:

```env
# ============================================
# ADATBÁZIS (Hestia CP)
# ============================================
# PostgreSQL példa:
DATABASE_URL="postgresql://zedingaming_user:JELSZÓ@localhost:5432/zedingaming"

# MySQL/MariaDB példa (ha MySQL-t használsz):
# DATABASE_URL="mysql://zedingaming_user:JELSZÓ@localhost:3306/zedingaming"

# ============================================
# NEXTAUTH (Autentikáció)
# ============================================
NEXTAUTH_URL="https://yourdomain.com"
# Generáld le: openssl rand -base64 32
NEXTAUTH_SECRET="itt-a-generált-secret-kulcs"

# ============================================
# EMAIL (Hestia CP SMTP)
# ============================================
SMTP_HOST=localhost
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=email-jelszó
SMTP_FROM=noreply@yourdomain.com

# ============================================
# STRIPE (Fizetési rendszer - opcionális)
# ============================================
# Fejlesztéshez használd a test kulcsokat:
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Production-hez:
# STRIPE_SECRET_KEY=sk_live_...
# STRIPE_PUBLISHABLE_KEY=pk_live_...

# ============================================
# OAUTH (Opcionális - Google, Discord)
# ============================================
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
```

### 3.3 NEXTAUTH_SECRET Generálása

```bash
# Generáld le a secret kulcsot
openssl rand -base64 32

# Másold be az eredményt a .env fájlba
```

## 📦 4. LÉPÉS: Függőségek Telepítése

```bash
# Navigálj a projekt könyvtárába
cd /home/user/web/yourdomain.com/public_html

# Telepítsd a Node.js függőségeket
npm install

# Ez néhány percig eltarthat...
```

## 🗄️ 5. LÉPÉS: Adatbázis Beállítás

### 5.1 Prisma Client Generálása

```bash
# Prisma client generálása
npm run db:generate
```

### 5.2 Adatbázis Séma Létrehozása

```bash
# Adatbázis séma létrehozása (adatvesztés nélkül)
npm run db:push
```

**Vagy migrációk használata (ajánlott production-ben):**

```bash
npm run db:migrate
```

### 5.3 Alapvető Adatok Betöltése (Seed)

```bash
# Alapvető adatok betöltése (admin felhasználó, árazási csomagok, FAQ)
npm run db:seed
```

**Fontos**: Az admin felhasználó alapértelmezett adatai:
- Email: `admin@zedingaming.com` (vagy amit a .env-ben beállítottál)
- Jelszó: `Admin123!` (vagy amit a .env-ben beállítottál)
- **Azonnal változtasd meg a bejelentkezés után!**

## 🏗️ 6. LÉPÉS: Production Build

```bash
# Production build készítése
npm run build
```

Ez létrehozza a `.next` mappát az optimalizált build fájlokkal.

## 🚀 7. LÉPÉS: Alkalmazás Indítása

### Opció 1: PM2 Használata (Ajánlott)

PM2 egy process manager, ami Node.js alkalmazásokat kezel és automatikusan újraindítja, ha leáll.

```bash
# PM2 telepítése globálisan
npm install -g pm2

# Alkalmazás indítása PM2-vel
pm2 start npm --name "zedingaming" -- start

# PM2 mentése (automatikus újraindítás)
pm2 save

# PM2 startup script (szerver újraindítás után is elindul)
pm2 startup
# Kövesd a kiírt utasításokat (általában egy sudo parancsot kell futtatnod)
```

**PM2 Hasznos Parancsok:**

```bash
pm2 list              # Folyamatok listája
pm2 logs zedingaming  # Logok megtekintése
pm2 restart zedingaming  # Újraindítás
pm2 stop zedingaming     # Leállítás
pm2 delete zedingaming   # Törlés
pm2 monit              # Valós idejű monitoring
```

### Opció 2: Docker Használata

Ha Docker-t használsz:

```bash
# Build
docker-compose build

# Indítás
docker-compose up -d

# Logok
docker-compose logs -f

# Leállítás
docker-compose down
```

### Opció 3: Systemd Service (Alternatíva)

Hozz létre egy systemd service fájlt:

```bash
sudo nano /etc/systemd/system/zedingaming.service
```

Tartalom:

```ini
[Unit]
Description=ZedinGamingHosting Node.js App
After=network.target

[Service]
Type=simple
User=user
WorkingDirectory=/home/user/web/yourdomain.com/public_html
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/node /home/user/web/yourdomain.com/public_html/.next/standalone/server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Aktíválás:

```bash
sudo systemctl daemon-reload
sudo systemctl enable zedingaming
sudo systemctl start zedingaming
sudo systemctl status zedingaming
```

## 🔄 8. LÉPÉS: Hestia CP Reverse Proxy Beállítása

A Hestia CP-ben be kell állítani egy reverse proxy-t, ami a Node.js alkalmazásra irányítja a forgalmat.

### 8.1 Nginx Konfiguráció Módosítása

**Módszer 1: Hestia CP Webes Felületén**

1. Menj a **Web** menüpontra a Hestia CP-ben
2. Kattints a domain nevére
3. Kattints az **Edit** gombra
4. Az **Advanced** fülön add hozzá a következőt:

```nginx
# Alapértelmezett konfiguráció elrejtése
location / {
    # Minden kérést a Node.js alkalmazásra irányít
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    
    # WebSocket támogatás
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    
    # Headerek
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Cache kikapcsolása
    proxy_cache_bypass $http_upgrade;
    
    # Timeout beállítások
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}

# Statikus fájlok (Next.js .next mappa)
location /_next/static {
    alias /home/user/web/yourdomain.com/public_html/.next/static;
    expires 365d;
    add_header Cache-Control "public, immutable";
}

# Public mappa (képek, stb.)
location /public {
    alias /home/user/web/yourdomain.com/public_html/public;
    expires 30d;
    add_header Cache-Control "public";
}
```

5. Kattints a **Save** gombra

**Módszer 2: SSH-n keresztül**

```bash
# Szerkeszd a konfigurációt
nano /home/user/conf/web/yourdomain.com/nginx.conf

# Add hozzá a fenti konfigurációt

# Nginx konfiguráció ellenőrzése
nginx -t

# Ha OK, akkor újratöltés
systemctl reload nginx
```

### 8.2 Nginx Újratöltése

A Hestia CP automatikusan újratölti az Nginx-et, amikor mentesz. Ha SSH-n keresztül módosítottad:

```bash
# Nginx újratöltése
systemctl reload nginx

# Vagy
/etc/init.d/nginx reload
```

## 🔒 9. LÉPÉS: SSL Tanúsítvány (Let's Encrypt)

### 9.1 SSL Engedélyezése a Hestia CP-ben

1. Menj a **Web** menüpontra
2. Kattints a domain nevére
3. Kattints az **Edit** gombra
4. Engedélyezd a **Let's Encrypt SSL** opciót
5. Kattints a **Save** gombra

### 9.2 Vagy SSH-n keresztül

```bash
# Hestia CP parancs
v-add-letsencrypt-domain user yourdomain.com
```

## ✅ 10. LÉPÉS: Ellenőrzés és Tesztelés

### 10.1 Port Ellenőrzés

```bash
# Ellenőrizd, hogy fut-e az alkalmazás
netstat -tuln | grep 3000

# Vagy
ss -tuln | grep 3000

# PM2 esetén
pm2 list
```

### 10.2 Alkalmazás Tesztelése

1. Nyisd meg a böngészőben: `https://yourdomain.com`
2. Ellenőrizd, hogy betöltődik-e az oldal
3. Próbáld meg regisztrálni egy teszt felhasználót
4. Jelentkezz be az admin fiókkal

### 10.3 Logok Ellenőrzése

```bash
# PM2 logok
pm2 logs zedingaming

# Nginx logok
tail -f /var/log/nginx/yourdomain.com.log
tail -f /var/log/nginx/yourdomain.com.error.log

# Application logok (ha vannak)
tail -f /home/user/web/yourdomain.com/public_html/logs/app.log
```

## 🔧 11. LÉPÉS: Admin Fiók Beállítása

### 11.1 Első Bejelentkezés

1. Nyisd meg: `https://yourdomain.com/hu/login`
2. Jelentkezz be az admin fiókkal:
   - Email: `admin@zedingaming.com` (vagy amit beállítottál)
   - Jelszó: `Admin123!` (vagy amit beállítottál)

### 11.2 Jelszó Változtatása

1. Menj a **Dashboard** → **Beállítások** oldalra
2. Változtasd meg a jelszót egy erős jelszóra
3. Frissítsd a profil adataidat

### 11.3 Admin Panel Elérése

1. Menj a **Dashboard** oldalra
2. Kattints az **Admin Panel** linkre (vagy menj: `https://yourdomain.com/hu/admin`)
3. Ellenőrizd, hogy minden funkció működik-e

## 🎯 12. LÉPÉS: További Beállítások

### 12.1 OAuth Beállítás (Opcionális)

Ha Google vagy Discord bejelentkezést szeretnél:

**Google:**
1. Menj a [Google Cloud Console](https://console.cloud.google.com/)-ba
2. Hozz létre egy új projektet
3. Engedélyezd a Google+ API-t
4. Hozz létre OAuth 2.0 credentials-t
5. Add hozzá a redirect URI-t: `https://yourdomain.com/api/auth/callback/google`
6. Másold a Client ID-t és Secret-et a `.env` fájlba

**Discord:**
1. Menj a [Discord Developer Portal](https://discord.com/developers/applications)-ra
2. Hozz létre egy új Application-t
3. Add hozzá a redirect URI-t: `https://yourdomain.com/api/auth/callback/discord`
4. Másold a Client ID-t és Secret-et a `.env` fájlba

### 12.2 Stripe Beállítás (Opcionális)

1. Regisztrálj a [Stripe](https://stripe.com/)-ra
2. Menj a **Developers** → **API keys** menüpontra
3. Másold a **Secret key**-t és **Publishable key**-t
4. Add hozzá a `.env` fájlba
5. Webhook beállítása: `https://yourdomain.com/api/webhooks/stripe`

## 🔄 13. LÉPÉS: Frissítés Folyamata

### 13.1 Manuális Frissítés

```bash
# Lépj be a projekt könyvtárba
cd /home/user/web/yourdomain.com/public_html

# Pull a legújabb változásokat
git pull origin main

# Telepítsd az új függőségeket (ha változtak)
npm install

# Prisma migrációk (ha változtak)
npm run db:generate
npm run db:push

# Build
npm run build

# PM2 újraindítás
pm2 restart zedingaming
```

### 13.2 Automatikus Frissítés (Admin Panel-ből)

1. Menj az **Admin Panel** → **Rendszer** oldalra
2. Kattints a **"Rendszer Frissítése"** gombra
3. Figyeld a progress bárt
4. A frissítés befejezése után az oldal automatikusan újratöltődik

## 🛠️ 14. LÉPÉS: Hibaelhárítás

### 14.1 Alkalmazás nem indul el

```bash
# Ellenőrizd a PM2 státuszt
pm2 list
pm2 logs zedingaming

# Ellenőrizd a portot
netstat -tuln | grep 3000

# Ellenőrizd a .env fájlt
cat .env

# Próbáld meg manuálisan indítani
cd /home/user/web/yourdomain.com/public_html
npm start
```

### 14.2 502 Bad Gateway

Ez azt jelenti, hogy az Nginx nem tud kapcsolódni a Node.js alkalmazáshoz.

```bash
# Ellenőrizd, hogy fut-e az alkalmazás
pm2 list

# Ha nem fut, indítsd el
pm2 start npm --name "zedingaming" -- start

# Ellenőrizd az Nginx konfigurációt
nginx -t

# Nézd meg az Nginx error logokat
tail -f /var/log/nginx/error.log
```

### 14.3 Adatbázis Kapcsolati Hiba

```bash
# Ellenőrizd a DATABASE_URL-t a .env fájlban
cat .env | grep DATABASE_URL

# Teszteld a kapcsolatot
# PostgreSQL esetén:
psql -h localhost -U zedingaming_user -d zedingaming

# MySQL esetén:
mysql -h localhost -u zedingaming_user -p zedingaming
```

### 14.4 Email Küldési Hiba

```bash
# Ellenőrizd az SMTP beállításokat a .env fájlban
cat .env | grep SMTP

# Teszteld a Hestia CP mail szervert
# Hestia CP-ben: Mail -> Test Email
```

### 14.5 Port Konfliktusok

Ha a 3000-es port foglalt:

```bash
# Nézd meg, mi használja a portot
lsof -i :3000

# Vagy változtasd meg a portot
# .env fájlban:
PORT=3001

# És frissítsd az Nginx konfigurációt is
```

## 📊 15. LÉPÉS: Monitoring és Karbantartás

### 15.1 PM2 Monitoring

```bash
# Valós idejű monitoring
pm2 monit

# Részletes információk
pm2 show zedingaming

# Logok követése
pm2 logs zedingaming --lines 100
```

### 15.2 Rendszer Erőforrások

```bash
# CPU és RAM használat
htop

# Disk használat
df -h

# Process lista
ps aux | grep node
```

### 15.3 Backup Készítése

```bash
# Adatbázis backup (PostgreSQL)
pg_dump -h localhost -U zedingaming_user zedingaming > backup_$(date +%Y%m%d).sql

# Adatbázis backup (MySQL)
mysqldump -h localhost -u zedingaming_user -p zedingaming > backup_$(date +%Y%m%d).sql

# Projekt fájlok backup
tar -czf project_backup_$(date +%Y%m%d).tar.gz /home/user/web/yourdomain.com/public_html
```

## 🎉 Kész!

Az alkalmazás most már működik! 

### További Lépések:

1. ✅ **Teszteld az összes funkciót**
2. ✅ **Állítsd be az árazási csomagokat** (Admin → CMS → Árazási Csomagok)
3. ✅ **Hozz létre tartalmat** (Blog, FAQ, stb.)
4. ✅ **Állítsd be a Stripe-t** (ha használod)
5. ✅ **Teszteld a szerver rendelést**
6. ✅ **Állítsd be az email sablonokat** (ha szükséges)

### Hasznos Linkek:

- Admin Panel: `https://yourdomain.com/hu/admin`
- Felhasználói Dashboard: `https://yourdomain.com/hu/dashboard`
- GitHub Repository: https://github.com/zedinke/ZedinGamingHosting.git

### További Dokumentáció:

- [Hestia CP Setup](./HESTIA_CP_SETUP.md)
- [Hestia CP Deployment](./HESTIA_CP_DEPLOYMENT.md)
- [System Update](./SYSTEM_UPDATE.md)
- [Quick Start](./QUICK_START.md)

## 🆘 Segítség Szükséges?

Ha problémába ütközöl:

1. Nézd meg a logokat: `pm2 logs zedingaming`
2. Ellenőrizd a dokumentációt
3. Nézd meg a GitHub Issues-t
4. Kérj segítséget a közösségtől

**Sok sikert a telepítéshez! 🚀**

