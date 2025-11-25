# Nginx SSL Konfiguráció Javítása

## Probléma

A Hestia CP külön SSL konfigurációt használ (`nginx.ssl.conf`), ami nem tartalmazza a reverse proxy beállításokat.

## Megoldás

### 1. Nézd meg az SSL konfigurációt

```bash
cat /home/ZedGamingHosting/conf/web/zedgaminghosting.hu/nginx.ssl.conf
```

### 2. Add hozzá a reverse proxy konfigurációt az SSL fájlhoz is

Az `nginx.ssl.conf` fájlban is hozzá kell adni ugyanazt a `location /` blokkot, mint a HTTP konfigurációban.

### 3. Szerkeszd az SSL konfigurációt

```bash
nano /home/ZedGamingHosting/conf/web/zedgaminghosting.hu/nginx.ssl.conf
```

Add hozzá ugyanazt a reverse proxy konfigurációt, mint a HTTP-nél:

```nginx
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

location /_next/static {
    alias /home/ZedGamingHosting/web/zedgaminghosting.hu/public_html/.next/static;
    expires 365d;
    add_header Cache-Control "public, immutable";
}

location /public {
    alias /home/ZedGamingHosting/web/zedgaminghosting.hu/public_html/public;
    expires 30d;
    add_header Cache-Control "public";
}
```

### 4. Nginx újratöltése

```bash
nginx -t
systemctl reload nginx
```

