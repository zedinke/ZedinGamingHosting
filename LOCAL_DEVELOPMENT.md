# Lokális Fejlesztői Környezet Beállítása

Ez az útmutató bemutatja, hogyan állítsd be a lokális fejlesztői környezetet Windows 11-en, hogy az élő szerverekre kapcsolódjon.

## 🎯 Előnyök

- ✅ Lokálisan fejleszthetsz, de az élő adatbázist és szervereket használod
- ✅ Nem kell minden változtatás után git push/pull és build
- ✅ Gyors iteráció és tesztelés
- ✅ Az SSH kapcsolatok automatikusan az élő gépekre mutatnak (adatbázisból jönnek)

## 📋 Előfeltételek

- Node.js 20+ telepítve
- Git telepítve
- Hozzáférés az élő szerverhez (adatbázis, SMTP)

## 🚀 Beállítás Lépései

### 1. Környezeti Változók Beállítása

```powershell
# Másold a .env.local.example fájlt .env.local néven
Copy-Item .env.local.example .env.local
```

Vagy manuálisan hozd létre a `.env.local` fájlt és töltsd ki az élő szerver adataival:

```env
DATABASE_URL="mysql://felhasználó:jelszó@ÉLŐ_SZERVER_IP:3306/zedingaming"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="ugyanaz-mint-az-élő-szerveren"
SMTP_HOST=ÉLŐ_SZERVER_IP
SMTP_PORT=587
SMTP_USER=noreply@zedgaminghosting.hu
SMTP_PASSWORD=email-jelszó
SMTP_FROM=noreply@zedgaminghosting.hu
```

### 2. Függőségek Telepítése

```powershell
npm install
```

### 3. Prisma Client Generálása

```powershell
npm run db:generate
```

### 4. Fejlesztői Szerver Indítása

```powershell
npm run dev
```

A szerver elindul a `http://localhost:3000` címen.

## 🔧 Hasznos Parancsok

```powershell
# Fejlesztői szerver indítása
npm run dev

# Prisma Studio (adatbázis böngésző)
npm run db:studio

# Adatbázis séma frissítése
npm run db:push

# TypeScript ellenőrzés
npm run lint
```

## ⚠️ Fontos Megjegyzések

### Adatbázis Kapcsolat

- Az adatbázis az **élő szerverre** mutat
- A gépek (ServerMachine) az adatbázisból jönnek
- Az SSH kapcsolatok automatikusan az élő gépekre mutatnak

### SSH Kulcsok Windows-on

Ha SSH kulcsokat használsz, a Windows elérési út formátuma:

```env
# Abszolút útvonal (dupla backslash)
SSH_KEY_PATH=C:\\Users\\YourName\\.ssh\\id_rsa

# Vagy relatív útvonal
SSH_KEY_PATH=.\\keys\\server_key
```

### Biztonság

- A `.env.local` fájl **NEM** kerül git-be (`.gitignore`-ban van)
- **NE** oszd meg a `.env.local` fájlt másokkal
- **NE** commitold a `.env.local` fájlt

## 🐛 Hibaelhárítás

### "Cannot connect to database"

1. Ellenőrizd, hogy az élő szerver elérhető-e:
   ```powershell
   ping ÉLŐ_SZERVER_IP
   ```

2. Ellenőrizd a `DATABASE_URL` formátumát
3. Ellenőrizd, hogy az adatbázis felhasználónak van-e hozzáférése

### "Prisma Client not generated"

```powershell
# Töröld a node_modules/.prisma mappát és generáld újra
Remove-Item -Recurse -Force node_modules\.prisma
npm run db:generate
```

### "Port 3000 already in use"

```powershell
# Másik port használata
$env:PORT=3001
npm run dev
```

Vagy módosítsd a `.env.local` fájlban:
```env
PORT=3001
```

## 📝 Munkafolyamat

1. **Fejlesztés**: Lokálisan dolgozol, az élő szerverekre kapcsolódva
2. **Tesztelés**: `http://localhost:3000`-n teszteled
3. **Commit**: Amikor kész vagy, commitolod a változtatásokat
4. **Deploy**: Csak akkor pusholsz és frissítesz az éles szerveren, amikor készen állsz

## 🔄 Frissítés Éles Szerveren

Amikor készen állsz a változtatásokkal:

```bash
# Éles szerveren (SSH-n keresztül)
cd /path/to/project
git pull
npm install
npm run build
pm2 restart zedingaming
```

Vagy használd az admin felület rendszer frissítés funkcióját.

