# Nginx Duplikált Location Hiba Javítása

## Hiba: "duplicate location "/""

Ez azt jelenti, hogy már van egy `location /` blokk a konfigurációban, és amikor hozzáadtuk a reverse proxy-t, újra létrehoztuk.

## Megoldás

### 1. Nyisd meg az Nginx konfigurációt

```bash
# Szerkeszd a domain Nginx konfigurációját
nano /home/ZedGamingHosting/conf/web/zedgaminghosting.hu/nginx.conf
```

### 2. Keress rá a duplikált location blokkokra

Keress rá erre:
```
location /
```

Valószínűleg két ilyen blokk van:
- Egy régi (amit a Hestia CP hozott létre)
- Egy új (amit mi adtunk hozzá)

### 3. Töröld vagy kommenteld ki a régi location / blokkot

A régi blokk valami ilyesmi lehet:
```nginx
location / {
    root /home/ZedGamingHosting/web/zedgaminghosting.hu/public_html;
    index index.html index.htm index.php;
    # ... stb
}
```

**Töröld ezt a blokkot** vagy **kommenteld ki** (elé `#` jelet tegyél).

### 4. Hagyd meg csak a reverse proxy location / blokkot

A reverse proxy blokknak így kell kinéznie:
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
```

### 5. Mentsd el és teszteld

```bash
# Mentsd el: Ctrl+X, majd Y, majd Enter

# Nginx konfiguráció ellenőrzése
nginx -t

# Ha OK, akkor újratöltés
systemctl reload nginx
```

## Alternatíva: Teljes Konfiguráció Cseréje

Ha nem találod a duplikációt, nézd meg a teljes fájlt:

```bash
# Nézd meg a teljes konfigurációt
cat /home/ZedGamingHosting/conf/web/zedgaminghosting.hu/nginx.conf
```

Keress rá a `location /` sorokra:
```bash
grep -n "location /" /home/ZedGamingHosting/conf/web/zedgaminghosting.hu/nginx.conf
```

Ez megmutatja, hogy hány `location /` blokk van és hol.

## Gyors Javítás

Ha gyorsan szeretnéd javítani, töröld a fájlt és hozd létre újra (de **előtte készíts backup-ot!**):

```bash
# Backup készítése
cp /home/ZedGamingHosting/conf/web/zedgaminghosting.hu/nginx.conf /home/ZedGamingHosting/conf/web/zedgaminghosting.hu/nginx.conf.backup

# Szerkeszd a fájlt
nano /home/ZedGamingHosting/conf/web/zedgaminghosting.hu/nginx.conf
```

A fájlban csak **egy** `location /` blokk legyen - a reverse proxy verzió.

