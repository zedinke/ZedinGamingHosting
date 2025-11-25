# Első Telepítés - Lépésről Lépésre

Ha a `.env.example` fájl nem található, akkor a projekt még nincs letöltve.

## 1. LÉPÉS: Ellenőrizd a könyvtár tartalmát

```bash
# Nézd meg, mi van a könyvtárban
ls -la

# Ha üres vagy csak alap fájlok vannak, akkor nincs ott a projekt
```

## 2. LÉPÉS: Projekt Letöltése

### Ha a könyvtár ÜRES:

```bash
# Klónozd a projektet a jelenlegi könyvtárba
git clone https://github.com/zedinke/ZedinGamingHosting.git .

# A pont (.) a végén azt jelenti, hogy a jelenlegi könyvtárba klónozza
```

### Ha a könyvtárban már VAN valami:

```bash
# Vagy másik könyvtárba klónozd
cd /home/ZedGamingHosting
git clone https://github.com/zedinke/ZedinGamingHosting.git zedingaming
cd zedingaming

# Vagy töröld a meglévő tartalmat és klónozd újra
cd /home/ZedGamingHosting/web/zedgaminghosting.hu/public_html
rm -rf *
git clone https://github.com/zedinke/ZedinGamingHosting.git .
```

## 3. LÉPÉS: Ellenőrizd, hogy minden fájl megvan-e

```bash
# Listázd ki a fájlokat
ls -la

# Nézd meg a package.json fájlt (ez biztosítja, hogy a projekt megvan)
cat package.json

# Ellenőrizd, hogy van-e .env.example fájl
ls -la .env.example
```

## 4. LÉPÉS: Ha minden rendben, akkor folytasd

```bash
# Most már működnie kell
cp .env.example .env
nano .env
```

## Alternatíva: Ha a Git nem elérhető

Ha nem tudod használni a Git-et, manuálisan is létrehozhatod az .env fájlt:

```bash
# Hozz létre egy üres .env fájlt
touch .env

# Szerkeszd
nano .env
```

És másold be ezt a tartalmat (majd töltsd ki a saját adataiddal):

```env
DATABASE_URL="postgresql://user:password@localhost:5432/zedingaming"
NEXTAUTH_URL="https://zedgaminghosting.hu"
NEXTAUTH_SECRET="generald-le-egy-secret-kulcsot"
SMTP_HOST=localhost
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@zedgaminghosting.hu
SMTP_PASSWORD=email-jelszo
SMTP_FROM=noreply@zedgaminghosting.hu
```

