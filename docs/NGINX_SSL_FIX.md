# Nginx SSL Konfiguráció Javítása

## Probléma

A HTTPS kéréseknél még mindig 404-et kapsz, mert az SSL konfiguráció felülírhatja a reverse proxy beállításokat.

## Megoldás

### 1. Ellenőrizd az SSL konfigurációt

```bash
# Nézd meg az SSL konfigurációt
cat /home/ZedGamingHosting/conf/web/zedgaminghosting.hu/nginx.forcessl.conf*

# Vagy
ls -la /home/ZedGamingHosting/conf/web/zedgaminghosting.hu/nginx.forcessl.conf*
```

### 2. Nézd meg a teljes konfigurációt (SSL port is)

```bash
# Nézd meg a 443-as port konfigurációját
grep -A 50 "listen.*443" /home/ZedGamingHosting/conf/web/zedgaminghosting.hu/nginx.conf

# Vagy a teljes konfigurációt
cat /home/ZedGamingHosting/conf/web/zedgaminghosting.hu/nginx.conf
```

### 3. Ha van külön SSL server blokk

Ha van külön `server` blokk a 443-as porthoz, akkor ott is hozzá kell adni a reverse proxy konfigurációt.

### 4. Alternatíva: Hestia CP-ben módosítás

A Hestia CP-ben:
1. Menj a **Web** → **zedgaminghosting.hu** → **Edit** menüpontra
2. Az **Advanced Options**-ban add hozzá a reverse proxy konfigurációt
3. Mentsd el

### 5. Nginx újratöltése

```bash
# Nginx konfiguráció ellenőrzése
nginx -t

# Ha OK, újratöltés
systemctl reload nginx
```

