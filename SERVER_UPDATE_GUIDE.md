# 🚀 Szerver frissítés - Rust Mod Marketplace

## Szerzői gépről → GitHub ✅ KÉSZ

```bash
git add -A
git commit -m "feat: Rust Mod Marketplace..."
git push origin main
```

**Status:** ✅ Pushed to GitHub

---

## Szervergépen lehúzás + frissítés

### 1️⃣ SSH-zz a szerverre
```bash
ssh deploy@116.203.226.140
# vagy ssh-n keresztül a Hestia CP-ből
```

### 2️⃣ Frissítés script futtatása
```bash
cd /var/www/zedgaminghosting
bash scripts/server-update-rust-mods.sh
```

### 3️⃣ Az script automatikusan:
```
✅ git pull origin main
✅ npx prisma generate
✅ npx prisma db push
✅ npx ts-node prisma/seed-rust-mods.ts (12 modul)
✅ npm ci
✅ npm run build
✅ pm2 restart zedgaming-hosting
✅ Státusz ellenőrzés
```

---

## 🧪 Teszt után

### API test
```bash
curl https://zedgaminghosting.hu/api/rust-mods?page=1&limit=12
```

### UI test
```
https://zedgaminghosting.hu/dashboard/servers/[serverId]/mods
https://zedgaminghosting.hu/dashboard/admin/rust-mods
```

---

## 📊 Mit frissít

| Komponens | Státusz |
|-----------|---------|
| Rust Mod piactér | ✅ |
| Admin panel | ✅ |
| API endpoints | ✅ |
| Prisma séma | ✅ |
| Minta modulok | ✅ |
| Seed script | ✅ |

---

## ⚠️ Megjegyzés

- **Backup**: Prisma auto-backup az adatbázisról (`db push` előtt)
- **Downtime**: ~2-3 perc a build alatt
- **Node version**: 18+ szükséges

---

**Szerver frissítés kész!** 🎉
