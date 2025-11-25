# Nginx Location Blokk Sorrend Javítása

## Probléma

A `location /` blokk az `include` sor után van, ami azt jelenti, hogy az include fájlokban lévő konfigurációk felülírhatják. A `location @fallback` blokk is ott van, ami Apache-ra irányít.

## Megoldás

A `location /` blokkot az `include` sor **elé** kell tenni, hogy az elsőként legyen értékelve.

### 1. Szerkeszd az Nginx konfigurációt

```bash
nano /home/ZedGamingHosting/conf/web/zedgaminghosting.hu/nginx.conf
```

### 2. Mozgasd a `location /` blokkot az `include` sor elé

A fájlnak így kell kinéznie:

```nginx
server {
    listen      116.203.226.140:80;
    server_name zedgaminghosting.hu www.zedgaminghosting.hu;
    error_log   /var/log/apache2/domains/zedgaminghosting.hu.error.log error;
    include /home/ZedGamingHosting/conf/web/zedgaminghosting.hu/nginx.forcessl.conf*;

    location ~ /\.(?!well-known\/|file) {
        deny all;
        return 404;
    }

    # Reverse proxy (Node.js alkalmazás) - ELŐRE MOZGATVA
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Next.js statikus fájlok
    location /_next/static {
        alias /home/ZedGamingHosting/web/zedgaminghosting.hu/public_html/.next/static;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # Public mappa
    location /public {
        alias /home/ZedGamingHosting/web/zedgaminghosting.hu/public_html/public;
        expires 30d;
        add_header Cache-Control "public";
    }

    # Töröld ezt a blokkot (nem kell)
    # location @fallback {
    #     proxy_pass http://116.203.226.140:8080;
    # }

    location /error/ {
        alias /home/ZedGamingHosting/web/zedgaminghosting.hu/document_errors/;
    }

    include /home/ZedGamingHosting/conf/web/zedgaminghosting.hu/nginx.conf_*;
}
```

### 3. Töröld a `location @fallback` blokkot

Ez a blokk Apache-ra irányít, és nem kell.

### 4. Mentsd el és teszteld

```bash
# Mentsd el: Ctrl+X, majd Y, majd Enter

# Nginx konfiguráció ellenőrzése
nginx -t

# Ha OK, újratöltés
systemctl reload nginx
```

