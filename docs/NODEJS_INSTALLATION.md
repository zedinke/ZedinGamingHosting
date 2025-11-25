# Node.js és npm Telepítése

## Debian/Ubuntu (Hestia CP általában ezt használja)

### Módszer 1: NodeSource Repository (Ajánlott - Legújabb verzió)

```bash
# Frissítsd a csomag listát
apt update

# Telepítsd a curl-t (ha nincs)
apt install -y curl

# Node.js 20.x telepítése (LTS verzió)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -

# Node.js és npm telepítése
apt install -y nodejs

# Ellenőrizd a verziókat
node --version
npm --version
```

### Módszer 2: Apt Repository (Egyszerűbb, de régebbi verzió)

```bash
# Frissítsd a csomag listát
apt update

# Node.js és npm telepítése
apt install -y nodejs npm

# Ellenőrizd a verziókat
node --version
npm --version
```

### Módszer 3: NVM (Node Version Manager) - Fejlesztéshez ajánlott

```bash
# NVM telepítése
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Terminal újratöltése
source ~/.bashrc

# Node.js 20 telepítése
nvm install 20
nvm use 20

# Alapértelmezett verzió beállítása
nvm alias default 20

# Ellenőrizd
node --version
npm --version
```

## Telepítés Utáni Ellenőrzés

```bash
# Node.js verzió
node -v
# Várható kimenet: v20.x.x vagy újabb

# npm verzió
npm -v
# Várható kimenet: 10.x.x vagy újabb

# npm globális csomagok telepítése (ha szükséges)
npm install -g pm2
```

## Ha a Verzió Túl Régi

Ha a telepített verzió túl régi (< 18), használd a NodeSource módszert:

```bash
# Régi verzió eltávolítása
apt remove -y nodejs npm

# NodeSource repository hozzáadása
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -

# Újra telepítés
apt install -y nodejs
```

## PM2 Telepítése (Process Manager)

```bash
# PM2 globális telepítése
npm install -g pm2

# PM2 verzió ellenőrzése
pm2 --version
```

## További Hasznos Csomagok

```bash
# TypeScript globális telepítése (ha szükséges)
npm install -g typescript tsx

# Prisma CLI globális telepítése (opcionális)
npm install -g prisma
```

## Hibaelhárítás

### "E: Unable to locate package nodejs"

```bash
# Frissítsd a csomag listát
apt update
apt upgrade
```

### "Permission denied" npm install-nél

```bash
# npm prefix beállítása (root esetén nem szükséges, de user esetén)
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

### Node.js verzió ellenőrzése

```bash
# Melyik Node.js verzió van telepítve
which node
node -v

# Melyik npm verzió van telepítve
which npm
npm -v
```

