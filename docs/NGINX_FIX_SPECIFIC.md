# Nginx Konfiguráció Javítása - Konkrét Lépések

## Probléma

A fájlban két `location /` blokk van:
- **20-34. sorok**: Régi proxy konfiguráció (`http://116.203.226.140:8080`)
- **45-58. sorok**: Új reverse proxy konfiguráció (`http://localhost:3000`)

## Megoldás

### 1. Töröld az első `location /` blokkot (20-34. sorok)

A nano szerkesztőben:
1. Menj a **20. sorhoz** (Ctrl+_ és írd be: 20)
2. Töröld az egész blokkot (20-34. sorok)
   - Menj a 20. sor elejére
   - Töröld a teljes blokkot (Ctrl+K többször, vagy jelöld ki és töröld)

**Törlendő rész:**
```nginx
location / {
    proxy_pass http://116.203.226.140:8080;
    location ^.+\.(css|htm|html|js|mjs|json|xml|apng|avif|bmp|cur|gif|ico|jfif|jpg|jpeg|pjp|pjpeg|png|svg|tif|tiff|webp|aac|caf|flac|m4a|midi|mp3|ogg|opus|wav|3gp|avl|avi|m4v|mkv|mov|m> {
        try_files $uri @fallback;
        root /home/ZedGamingHosting/web/zedgaminghosting.hu/public_html;
        access_log /var/log/apache2/domains/zedgaminghosting.hu.log combined;
        access_log /var/log/apache2/domains/zedgaminghosting.hu.bytes bytes;
        expires max;
    }
}
```

### 2. Töröld a `location @fallback` blokkot is (36-38. sorok)

Ez az első blokkhoz tartozik, szóval töröld ezt is:
```nginx
location @fallback {
    proxy_pass http://116.203.226.140:8080;
}
```

### 3. Javítsd a statikus fájlok location blokkját

A `location /_next/static` blokkban (60. sor) van egy elírás:
- Jelenleg: `location /next/static` (hiányzik az `_`)
- Javítsd erre: `location /_next/static`

### 4. Végleges konfiguráció

A fájlnak így kell kinéznie (fontos részek):

```nginx
# Első location blokk (biztonsági)
location /\.(?!well-known\/|file) {
    deny all;
    return 404;
}

# Reverse proxy (Node.js alkalmazás)
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

# Next.js statikus fájlok (JAVÍTVA: /_next/static)
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
```

## Gyors Javítás Lépések

1. **Nyisd meg a fájlt:**
   ```bash
   nano /home/ZedGamingHosting/conf/web/zedgaminghosting.hu/nginx.conf
   ```

2. **Töröld a 20-34. sorokat** (első location / blokk)

3. **Töröld a 36-38. sorokat** (location @fallback blokk)

4. **Javítsd a 60. sort:**
   - Régi: `location /next/static`
   - Új: `location /_next/static`

5. **Mentsd el:** Ctrl+X, majd Y, majd Enter

6. **Teszteld:**
   ```bash
   nginx -t
   systemctl reload nginx
   ```

## Ellenőrzés

Miután javítottad:
```bash
# Nginx konfiguráció ellenőrzése
nginx -t

# Ha OK, újratöltés
systemctl reload nginx

# Ellenőrizd, hogy fut-e a Node.js alkalmazás
pm2 list

# Teszteld
curl http://localhost:3000
```

