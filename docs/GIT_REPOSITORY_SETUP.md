# Git Repository Beállítása Hestia CP Környezetben

## Probléma

Ha a rendszer frissítési funkciója hibát ad, hogy "fatal: not a git repository", akkor a Git repository nincs megfelelően beállítva a projekt könyvtárban.

## Megoldás

### 1. Ellenőrizd a Git Repository Helyét

A projekt root könyvtárban (ahol a `package.json` van) kell lennie a `.git` mappának.

**Hestia CP struktúra:**
```
/home/ZedGamingHosting/web/zedgaminghosting.hu/
├── public_html/          # Itt van a projekt
│   ├── .git/            # Git repository itt kell legyen
│   ├── package.json
│   ├── app/
│   └── ...
```

### 2. Git Repository Klónozása

Ha még nincs Git repository:

```bash
# Navigálj a projekt könyvtárba
cd /home/ZedGamingHosting/web/zedgaminghosting.hu/public_html

# Ha még nincs Git repository, inicializáld:
git init

# Vagy klónozd a meglévő repository-t:
git clone https://github.com/zedinke/ZedinGamingHosting.git .

# Ellenőrizd, hogy a .git mappa létezik:
ls -la .git
```

### 3. Remote Repository Beállítása

```bash
# Ha még nincs remote beállítva:
git remote add origin https://github.com/zedinke/ZedinGamingHosting.git

# Ellenőrizd:
git remote -v
```

### 4. Branch Beállítása

```bash
# Main branch beállítása
git checkout -b main
# vagy
git branch -M main

# Remote tracking beállítása
git branch --set-upstream-to=origin/main main
```

### 5. Ellenőrzés

```bash
# Ellenőrizd, hogy működik-e a Git:
git status
git log --oneline -5

# Teszteld a fetch-et:
git fetch origin main
```

## Automatikus Projekt Root Detektálás

A rendszer automatikusan megpróbálja megtalálni a Git repository-t a következő helyeken:

1. **Standalone build esetén:**
   - `.next/standalone` -> `.next` -> `public_html` (projekt root)
   - Ellenőrzi, hogy van-e `.git` mappa és `package.json`

2. **Közvetlen futtatás esetén:**
   - A `process.cwd()` könyvtárban
   - Szülő könyvtárakban
   - `public_html` könyvtárban

## Hibaelhárítás

### Hiba: "fatal: not a git repository"

**Megoldás:**
1. Ellenőrizd, hogy a projekt könyvtárban van-e `.git` mappa:
   ```bash
   cd /home/ZedGamingHosting/web/zedgaminghosting.hu/public_html
   ls -la .git
   ```

2. Ha nincs, inicializáld vagy klónozd a repository-t (lásd fent)

### Hiba: "fatal: could not read Username"

**Megoldás:**
A Git repository privát, vagy nincs beállítva a hitelesítés. Használj SSH kulcsot vagy personal access token-t:

```bash
# SSH URL használata:
git remote set-url origin git@github.com:zedinke/ZedinGamingHosting.git

# Vagy HTTPS personal access token:
git remote set-url origin https://TOKEN@github.com/zedinke/ZedinGamingHosting.git
```

### Hiba: "Project root not found"

**Megoldás:**
A rendszer nem találja a projekt root-ot. Ellenőrizd:

1. Van-e `package.json` a könyvtárban?
2. Van-e `app` vagy `pages` mappa?
3. Van-e `next.config.js`?

Ha minden megvan, de még mindig hibát ad, akkor manuálisan állítsd be a projekt root-ot környezeti változóval (jövőbeli fejlesztés).

## Környezeti Változó (Opcionális)

Ha a rendszer nem találja meg automatikusan a projekt root-ot, beállíthatod manuálisan:

```bash
# .env fájlban:
PROJECT_ROOT=/home/ZedGamingHosting/web/zedgaminghosting.hu/public_html
```

**Megjegyzés:** Ez a funkció jelenleg nincs implementálva, de a kód könnyen bővíthető.

## Tesztelés

A frissítési funkció tesztelése:

1. Menj az Admin Panel -> Rendszer oldalra
2. Kattints a "Frissítés ellenőrzése" gombra
3. Ha van frissítés, kattints a "Rendszer frissítése" gombra
4. Figyeld a progress bárt és a logokat

## További Információk

- [Git Dokumentáció](https://git-scm.com/doc)
- [GitHub SSH Setup](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)
- [Hestia CP Deployment](./HESTIA_CP_DEPLOYMENT.md)

