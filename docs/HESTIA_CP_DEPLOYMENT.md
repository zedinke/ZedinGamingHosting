# Hestia CP Telepítési Útmutató

Ez az útmutató lépésről lépésre bemutatja, hogyan telepítsd a ZedinGamingHosting alkalmazást a Hestia CP-re.

## Előfeltételek

- Hestia CP telepítve és működik
- SSH hozzáférés a szerverhez
- Node.js 20+ telepítve (vagy Docker használata)
- Git telepítve

## 1. Projekt Letöltése

### SSH-n keresztül:

```bash
# Lépj be SSH-val a szerverre
ssh user@your-server.com

# Navigálj a web könyvtárba (általában /home/user/web/domain.com/public_html)
cd /home/user/web/yourdomain.com/public_html

# Töröld a meglévő tartalmat (ha van)
rm -rf *

# Klónozd a projektet
git clone https://github.com/zedinke/ZedinGamingHosting.git .

# Vagy ha már van tartalom, másik könyvtárba klónozd
cd /home/user
git clone https://github.com/zedinke/ZedinGamingHosting.git zedingaming
cd zedingaming
```

## 2. Környezeti Változók Beállítása

```bash
# Másold az .env.example fájlt
cp .env.example .env

# Szerkeszd a .env fájlt
nano .env
```

Töltsd ki a következő adatokat:

```env
# Adatbázis (Hestia CP-ben létrehozott)
DATABASE_URL="postgresql://zedingaming_user:JELSZÓ@localhost:5432/zedingaming"

# NextAuth
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="openssl rand -base64 32" # Futtasd le ezt a parancsot

# Email (Hestia CP SMTP)
SMTP_HOST=localhost
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=email-jelszó
SMTP_FROM=noreply@yourdomain.com

# Stripe (ha használod)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
```

## 3. Függőségek Telepítése

```bash
# Telepítsd a Node.js függőségeket
npm install

# Prisma client generálása
npm run db:generate

# Adatbázis migrációk
npm run db:push
```

## 4. Build Készítése

```bash
# Production build
npm run build
```

## 5. Telepítési Módszerek

### Opció 1: PM2 Használata (Ajánlott)

PM2 egy process manager, ami Node.js alkalmazásokat kezel.

```bash
# PM2 telepítése globálisan
npm install -g pm2

# Alkalmazás indítása PM2-vel
pm2 start npm --name "zedingaming" -- start

# PM2 mentése (automatikus újraindítás)
pm2 save

# PM2 startup script (szerver újraindítás után is elindul)
pm2 startup
# Kövesd a kiírt utasításokat
```

**PM2 hasznos parancsok:**
```bash
pm2 list              # Folyamatok listája
pm2 logs zedingaming  # Logok megtekintése
pm2 restart zedingaming  # Újraindítás
pm2 stop zedingaming     # Leállítás
pm2 delete zedingaming   # Törlés
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
```

## 6. Hestia CP Reverse Proxy Beállítása

A Hestia CP-ben be kell állítani egy reverse proxy-t, ami a Node.js alkalmazásra irányítja a forgalmat.

### 6.1 Web Domain Létrehozása a Hestia CP-ben

1. Jelentkezz be a Hestia CP admin felületére
2. Menj a **Web** menüpontra
3. Kattints az **Add Web Domain** gombra
4. Add meg:
   - **Domain**: `yourdomain.com` vagy `app.yourdomain.com`
   - **Document Root**: `/home/user/web/yourdomain.com/public_html` (vagy ahol a projekt van)
   - **PHP Version**: Válassz egyet (nem használjuk, de kötelező)
5. Engedélyezd az SSL-t (Let's Encrypt)

### 6.2 Nginx Konfiguráció Módosítása

A Hestia CP Nginx-et használ. Módosítsd a domain konfigurációját:

```bash
# SSH-n keresztül szerkeszd a konfigurációt
nano /home/user/conf/web/yourdomain.com/nginx.conf
```

**VAGY** a Hestia CP webes felületén:
1. Menj a **Web** menüpontra
2. Kattints a domain-re
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

### 6.3 Nginx Újratöltése

```bash
# Nginx konfiguráció ellenőrzése
nginx -t

# Ha OK, akkor újratöltés
systemctl reload nginx

# VAGY Hestia CP-ben:
# Web menü -> Domain -> Edit -> Save
```

## 7. Port Ellenőrzés

Ellenőrizd, hogy a 3000-es port elérhető-e:

```bash
# Port ellenőrzés
netstat -tuln | grep 3000

# Ha foglalt, változtasd meg a portot a .env fájlban vagy PM2-ben
```

Ha más portot szeretnél használni:

```bash
# PM2-ben port változtatás
PORT=3001 pm2 start npm --name "zedingaming" -- start

# Vagy .env fájlban
PORT=3001
```

És frissítsd a reverse proxy-t is:

```nginx
proxy_pass http://localhost:3001;
```

## 8. Firewall Beállítás

A 3000-es portot nem kell nyitni a külső felé, mert a Nginx reverse proxy-n keresztül érkezik a forgalom.

```bash
# Ha mégis szükséges (nem ajánlott)
ufw allow 3000/tcp
```

## 9. SSL Tanúsítvány (Let's Encrypt)

A Hestia CP-ben engedélyezd az SSL-t:

1. Web menü -> Domain -> Edit
2. Engedélyezd a **Let's Encrypt SSL** opciót
3. Mentsd el

Vagy SSH-n keresztül:

```bash
# Hestia CP parancs
v-add-letsencrypt-domain user yourdomain.com
```

## 10. Automatikus Újraindítás

### PM2 Startup Script

```bash
# PM2 startup script generálása
pm2 startup

# Kövesd a kiírt utasításokat (általában egy sudo parancsot kell futtatnod)
```

### Systemd Service (Alternatíva)

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

## 11. Logok Megtekintése

### PM2 Logok

```bash
pm2 logs zedingaming
pm2 logs zedingaming --lines 100  # Utolsó 100 sor
```

### Nginx Logok

```bash
tail -f /var/log/nginx/yourdomain.com.log
tail -f /var/log/nginx/yourdomain.com.error.log
```

### Application Logok

A Next.js logok a konzolra mennek, PM2-ben láthatók.

## 12. Frissítés Folyamata

Amikor frissíteni szeretnéd a projektet:

```bash
# Lépj be a projekt könyvtárába
cd /home/user/web/yourdomain.com/public_html

# Pull a legújabb változásokat
git pull

# Telepítsd a függőségeket (ha változtak)
npm install

# Prisma migrációk (ha változtak)
npm run db:push

# Build
npm run build

# PM2 újraindítás
pm2 restart zedingaming
```

## 13. Hibaelhárítás

### Alkalmazás nem indul el

```bash
# Ellenőrizd a PM2 státuszt
pm2 list
pm2 logs zedingaming

# Ellenőrizd a portot
netstat -tuln | grep 3000

# Ellenőrizd a .env fájlt
cat .env
```

### 502 Bad Gateway

- Ellenőrizd, hogy fut-e a Node.js alkalmazás: `pm2 list`
- Ellenőrizd a Nginx konfigurációt: `nginx -t`
- Nézd meg a Nginx error logokat

### Adatbázis kapcsolati hiba

- Ellenőrizd a `DATABASE_URL`-t a .env fájlban
- Teszteld a kapcsolatot: `psql -h localhost -U zedingaming_user -d zedingaming`

### Email küldési hiba

- Ellenőrizd az SMTP beállításokat
- Teszteld a Hestia CP mail szervert

## 14. Biztonsági Megfontolások

1. **.env fájl védelem**: Ne commitold a .env fájlt
2. **Firewall**: Csak a szükséges portokat nyisd meg
3. **SSL**: Mindig használj HTTPS-t production-ben
4. **Jelszavak**: Erős jelszavakat használj mindenhol
5. **PM2**: Ne futtasd root-ként

## 15. Teljesítmény Optimalizálás

### Next.js Standalone Build

A `next.config.js`-ben már be van állítva az `output: 'standalone'`, ami optimalizált buildet készít.

### PM2 Cluster Mode

Több process használata:

```bash
pm2 start npm --name "zedingaming" -- start -i max
```

### Nginx Caching

A statikus fájlokhoz már be van állítva a cache a reverse proxy konfigurációban.

## További Segítség

- [Hestia CP Dokumentáció](https://www.hestiacp.com/docs/)
- [PM2 Dokumentáció](https://pm2.keymetrics.io/docs/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

