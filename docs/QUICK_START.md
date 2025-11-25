# Gyors Telepítési Útmutató

## 1. Projekt Letöltése

```bash
cd /home/user/web/yourdomain.com/public_html
git clone https://github.com/zedinke/ZedinGamingHosting.git .
```

## 2. Környezeti Változók

```bash
cp .env.example .env
nano .env
```

Töltsd ki a Hestia CP adataiddal!

## 3. Telepítés

```bash
npm install
npm run db:generate
npm run db:push
npm run build
```

## 4. PM2 Indítás

```bash
npm install -g pm2
pm2 start npm --name "zedingaming" -- start
pm2 save
pm2 startup
```

## 5. Hestia CP Reverse Proxy

Hestia CP webes felületén:
- Web -> Domain -> Edit -> Advanced
- Add hozzá a reverse proxy konfigurációt (lásd: HESTIA_CP_DEPLOYMENT.md)

## 6. Kész! 🎉

Az alkalmazás elérhető lesz: `https://yourdomain.com`

## Frissítés

```bash
git pull
npm install
npm run build
pm2 restart zedingaming
```

Vagy használd a deployment scriptet:

```bash
./scripts/deploy.sh
```

