# 🚀 Gyors Telepítés - Rövid Útmutató

## Lépések

```bash
# 1. Lépj be SSH-val a szerverre
ssh root@panel

# 2. Navigálj a projekt könyvtárba
cd /home/ZedGamingHosting/web/zedgaminghosting.hu/public_html

# 3. Klónozd a projektet (ha még nincs)
git clone https://github.com/zedinke/ZedinGamingHosting.git .

# 4. Másold az .env.example fájlt (FIGYELJ: cp parancs!)
cp .env.example .env

# 5. Szerkeszd a .env fájlt
nano .env
# Töltsd ki a Hestia CP adataiddal, majd mentés: Ctrl+X, majd Y, majd Enter

# 6. Telepítsd a függőségeket
npm install

# 7. Generáld a Prisma clientet
npm run db:generate

# 8. Hozd létre az adatbázis sémát
npm run db:push

# 9. Betöltsd az alapvető adatokat (opcionális)
npm run db:seed

# 10. Build
npm run build

# 11. PM2 telepítése és indítás
npm install -g pm2
pm2 start npm --name "zedingaming" -- start
pm2 save
pm2 startup  # Kövesd a kiírt utasításokat

# 12. Kész! Most állítsd be a Hestia CP reverse proxy-t
```

## Fontos Parancsok

```bash
# Fájl másolása (jó)
cp .env.example .env

# Fájl másolása (rossz - ezt ne csináld!)
.env.example .env  # ❌ Hibás!

# Fájl tartalmának megtekintése
cat .env

# Fájl szerkesztése
nano .env
# Mentés: Ctrl+X, majd Y, majd Enter

# Kilépés mentés nélkül: Ctrl+X, majd N
```

## Hestia CP Reverse Proxy

A Hestia CP webes felületén:
1. Web → zedgaminghosting.hu → Edit → Advanced
2. Add hozzá a reverse proxy konfigurációt (lásd: COMPLETE_INSTALLATION.md)
3. Save

## További Segítség

Teljes útmutató: `docs/COMPLETE_INSTALLATION.md`
Hibaelhárítás: `docs/TROUBLESHOOTING.md`

