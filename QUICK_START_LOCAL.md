# 🚀 Gyors Indítás - Lokális Fejlesztés

## 1️⃣ .env.local Fájl Létrehozása

### Opció A: Automatikus (Ajánlott)

Futtasd a PowerShell scriptet:

```powershell
.\scripts\setup-local-dev.ps1
```

A script interaktívan kérdezi az élő szerver adatait és létrehozza a `.env.local` fájlt.

### Opció B: Manuális

Hozz létre egy `.env.local` fájlt a projekt gyökerében:

```env
# Adatbázis - ÉLŐ SZERVER
DATABASE_URL="mysql://felhasználó:jelszó@ÉLŐ_SZERVER_IP:3306/zedingaming"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="ugyanaz-mint-az-élő-szerveren"

# SMTP - ÉLŐ SZERVER
SMTP_HOST=ÉLŐ_SZERVER_IP
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@zedgaminghosting.hu
SMTP_PASSWORD=email-jelszó
SMTP_FROM=noreply@zedgaminghosting.hu

# Ollama (opcionális)
OLLAMA_URL=http://ÉLŐ_SZERVER_IP:11434
OLLAMA_MODEL=llama3.2:3b

# Fejlesztés
NODE_ENV=development
```

## 2️⃣ Függőségek Telepítése (ha még nem tetted)

```powershell
npm install
```

## 3️⃣ Prisma Client Generálása (✅ Már kész!)

```powershell
npm run db:generate
```

## 4️⃣ Fejlesztői Szerver Indítása

```powershell
npm run dev
```

A szerver elindul: **http://localhost:3000**

## ✅ Kész!

Most már:
- ✅ Lokálisan fejleszthetsz
- ✅ Az élő adatbázist használod
- ✅ Az élő szerverekre kapcsolódik
- ✅ Nem kell git push/pull minden változtatás után

## 📝 Munkafolyamat

1. **Fejlesztés**: Dolgozz lokálisan, teszteld `http://localhost:3000`-n
2. **Commit**: Amikor kész vagy, commitolod a változtatásokat
3. **Deploy**: Csak akkor pusholsz és frissítesz az éles szerveren, amikor készen állsz

## 🔧 Hasznos Parancsok

```powershell
# Fejlesztői szerver
npm run dev

# Prisma Studio (adatbázis böngésző)
npm run db:studio

# Adatbázis séma frissítése
npm run db:push

# TypeScript ellenőrzés
npm run lint
```

## ⚠️ Fontos

- A `.env.local` fájl **NEM** kerül git-be
- **NE** oszd meg a `.env.local` fájlt másokkal
- Az adatbázis az **élő szerverre** mutat
- Az SSH kapcsolatok automatikusan az élő gépekre mutatnak (adatbázisból jönnek)

## 🐛 Problémák?

Lásd: [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md)

