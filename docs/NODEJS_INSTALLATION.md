# Node.js 20+ Telepítése Hestia CP Szerveren

Ez az útmutató bemutatja, hogyan telepítsd a Node.js 20-at és az npm-et egy Hestia CP szerveren.

## 🚀 Gyors Telepítés (Ajánlott)

### 1. NodeSource Repository Hozzáadása

```bash
# Frissítsd a csomag listát
apt update

# Telepítsd a curl-t (ha nincs telepítve)
apt install -y curl

# NodeSource repository hozzáadása (Node.js 20.x)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
```

### 2. Node.js és npm Telepítése

```bash
# Node.js 20.x telepítése (npm automatikusan települ vele)
apt install -y nodejs

# Ellenőrizd a telepítést
node --version
npm --version
```

**Várt kimenet:**
- Node.js: `v20.x.x` vagy újabb
- npm: `10.x.x` vagy újabb

## 🔄 Alternatív Módszer: NVM Használata

Ha több Node.js verziót szeretnél kezelni, használd az NVM-et:

```bash
# NVM telepítése
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Terminal újratöltése vagy:
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Node.js 20 telepítése
nvm install 20
nvm use 20
nvm alias default 20

# Ellenőrzés
node --version
npm --version
```

## ✅ Telepítés Ellenőrzése

```bash
# Node.js verzió
node --version

# npm verzió
npm --version

# Telepítési helyek
which node
which npm
```

## 🔧 Hibaelhárítás

### Ha a `node` vagy `npm` parancs nem található

```bash
# Ellenőrizd, hogy telepítve van-e
dpkg -l | grep nodejs

# Ha nincs telepítve, próbáld újra:
apt update
apt install -y nodejs npm

# Vagy használd a teljes elérési utat:
/usr/bin/node --version
/usr/bin/npm --version
```

### Ha a verzió nem megfelelő

```bash
# Távolítsd el a régi verziót
apt remove -y nodejs npm

# Telepítsd újra a NodeSource-ból
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

### Permission hibák

Ha permission hibákat kapsz npm telepítéskor:

```bash
# npm cache és prefix beállítása (root esetén nem szükséges, de user esetén igen)
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'

# PATH hozzáadása (ha user vagy)
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

## 📝 Telepítés Után

Miután a Node.js és npm telepítve van, folytasd a projekt telepítését:

```bash
# Navigálj a projekt könyvtárába
cd /home/ZedGamingHosting/web/zedgaminghosting.hu/public_html

# Függőségek telepítése
npm install

# Prisma client generálása
npm run db:generate
```

## 🔗 További Információk

- [NodeSource Repository](https://github.com/nodesource/distributions)
- [NVM GitHub](https://github.com/nvm-sh/nvm)
- [Node.js Hivatalos Dokumentáció](https://nodejs.org/)
