# Hestia CP Reverse Proxy Beállítása - Lépésről Lépésre

## 1. LÉPÉS: Nyisd meg a Domain Beállításokat

1. Jelentkezz be a Hestia CP admin felületére
2. Menj a **Web** menüpontra (bal oldali menü)
3. Kattints a domain nevedre (pl. `zedgaminghosting.hu`)

## 2. LÉPÉS: Nyisd meg az Advanced Options-t

A domain szerkesztő oldalon:
1. Kattints az **"Advanced Options"** gombra (a fő beállítások felett)
2. Ez megnyitja az advanced konfigurációs részt

## 3. LÉPÉS: Add hozzá a Reverse Proxy Konfigurációt

Az Advanced Options részben keresd meg:
- **"Proxy Template"** vagy
- **"Custom Nginx Configuration"** vagy
- **"Additional Nginx Directives"** mezőt

### Ha van "Additional Nginx Directives" mező:

Add hozzá ezt a konfigurációt:

```nginx
location / {
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
    alias /home/ZedGamingHosting/web/zedgaminghosting.hu/public_html/.next/static;
    expires 365d;
    add_header Cache-Control "public, immutable";
}

# Public mappa (képek, stb.)
location /public {
    alias /home/ZedGamingHosting/web/zedgaminghosting.hu/public_html/public;
    expires 30d;
    add_header Cache-Control "public";
}
```

### Ha nincs ilyen mező, SSH-n keresztül:

1. SSH-n keresztül szerkeszd a konfigurációt:

```bash
# Szerkeszd a domain Nginx konfigurációját
nano /home/ZedGamingHosting/conf/web/zedgaminghosting.hu/nginx.conf
```

2. Add hozzá a fenti konfigurációt a fájl végére (de a `}` bezárás előtt)

3. Mentsd el: `Ctrl+X`, majd `Y`, majd `Enter`

4. Nginx újratöltése:

```bash
# Nginx konfiguráció ellenőrzése
nginx -t

# Ha OK, akkor újratöltés
systemctl reload nginx
```

## 4. LÉPÉS: Mentsd el a Hestia CP-ben

1. Ha a Hestia CP webes felületén módosítottad, kattints a **"Save"** gombra (jobbra fent)
2. Várj egy pillanatot, amíg a Hestia CP újragenerálja a konfigurációt

## 5. LÉPÉS: Ellenőrzés

1. Ellenőrizd, hogy fut-e a Node.js alkalmazás:

```bash
# PM2 esetén
pm2 list

# Vagy port ellenőrzés
netstat -tuln | grep 3000
```

2. Teszteld a weboldalt:
   - Nyisd meg: `https://zedgaminghosting.hu`
   - Ha működik, akkor sikerült! 🎉

## Alternatíva: Proxy Template Használata

Ha a Hestia CP-ben van **"Proxy Template"** dropdown:

1. Kattints a **"Proxy Template"** dropdown-ra
2. Válassz egy template-et (pl. "proxy" vagy "custom")
3. Ha van "Custom Proxy Configuration" mező, add hozzá a fenti konfigurációt

## Hibaelhárítás

### Ha nem találod az Advanced Options-t:

1. Nézd meg, hogy van-e **"Show Certificate"** gomb mellett egy **"Advanced Options"** gomb
2. Ha nincs, akkor SSH-n keresztül kell módosítani (lásd fent)

### Ha 502 Bad Gateway hibát kapsz:

1. Ellenőrizd, hogy fut-e a Node.js alkalmazás: `pm2 list`
2. Ellenőrizd a portot: `netstat -tuln | grep 3000`
3. Nézd meg az Nginx error logokat: `tail -f /var/log/nginx/error.log`

### Ha nem töltődik be az oldal:

1. Ellenőrizd az Nginx konfigurációt: `nginx -t`
2. Nézd meg az Nginx access logokat: `tail -f /var/log/nginx/access.log`

## Képernyőképek Segítségével

A Hestia CP-ben:
- **Web** → **Domain név** → **Edit** → **Advanced Options** (vagy hasonló)
- Keress egy mezőt, ahol Nginx direktívákat lehet hozzáadni
- Ha nincs ilyen, akkor SSH-n keresztül kell módosítani

