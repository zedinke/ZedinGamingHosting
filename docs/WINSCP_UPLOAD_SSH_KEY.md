# WinSCP-vel SSH Kulcs Feltöltése StorageBox-ra

## 1. Publikus Kulcs Fájl Létrehozása

### Windows PowerShell-ben:

```powershell
# Publikus kulcs beolvasása
$publicKey = Get-Content "$env:USERPROFILE\.ssh\machine_hetzner-storagebox_u516206_your-storagebox_de.pub"

# authorized_keys fájl létrehozása
$publicKey | Out-File -FilePath "$env:USERPROFILE\.ssh\authorized_keys_storagebox" -Encoding utf8 -NoNewline
```

Vagy egyszerűen másold be a publikus kulcsot egy új fájlba:

**Publikus kulcs:**
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAILB9+uNkrpCmkYG1cV9Gpp0E58oX1aCC4E0X2lqdT1gE zedingaming-hetzner-storagebox
```

Hozz létre egy `authorized_keys` nevű fájlt (bármilyen szövegszerkesztővel), és másold be a fenti sort.

## 2. WinSCP Kapcsolat (Jelszóval)

1. **Nyisd meg a WinSCP-t**
2. **Új munkamenet** (Ctrl+N)
3. **Kapcsolati adatok**:
   - **Fájl protokoll**: `SFTP`
   - **Gépnév**: `u516206.your-storagebox.de`
   - **Portszám**: `23`
   - **Felhasználónév**: `u516206`
   - **Jelszó**: `Gele007ta...`
4. **Bejelentkezés**

## 3. .ssh Könyvtár Létrehozása

1. **Navigálj a home könyvtárba** (`/home/u516206/` vagy `/home/`)
2. **Ellenőrizd, hogy létezik-e a `.ssh` könyvtár**:
   - Ha **nem látsz** `.ssh` mappát, akkor:
     - **Jobb klikk** → **Új** → **Könyvtár**
     - **Név**: `.ssh`
     - **OK**
3. **Ha a `.ssh` mappa rejtett** (nem látszik):
   - **Nézet** → **Rejtett fájlok megjelenítése** (vagy **Ctrl+Alt+H**)

## 4. authorized_keys Fájl Feltöltése

1. **Nyisd meg a `.ssh` könyvtárat** (dupla kattintás)
2. **Húzd át** a létrehozott `authorized_keys` fájlt a WinSCP ablakba
   - Vagy: **Jobb klikk** → **Feltöltés** → Válaszd ki a fájlt
3. **Várj, amíg a feltöltés befejeződik**

## 5. Jogosultságok Beállítása

1. **Jobb klikk** a `.ssh` mappán → **Tulajdonságok**
2. **Jogosultságok**:
   - **Tulajdonos**: `rwx` (7)
   - **Csoport**: `---` (0)
   - **Egyéb**: `---` (0)
   - **Vagy**: `700`
3. **OK**

4. **Jobb klikk** az `authorized_keys` fájlon → **Tulajdonságok**
5. **Jogosultságok**:
   - **Tulajdonos**: `rw-` (6)
   - **Csoport**: `---` (0)
   - **Egyéb**: `---` (0)
   - **Vagy**: `600`
6. **OK**

## 6. Ellenőrzés

1. **Dupla kattintás** az `authorized_keys` fájlon (megnyitja a WinSCP szerkesztőben)
2. **Ellenőrizd**, hogy tartalmazza-e a publikus kulcsot:
   ```
   ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAILB9+uNkrpCmkYG1cV9Gpp0E58oX1aCC4E0X2lqdT1gE zedingaming-hetzner-storagebox
   ```
3. **Mentés** (ha szerkesztettél) → **Bezárás**

## 7. SSH Kulcs Kapcsolat Tesztelése

1. **Új munkamenet** (Ctrl+N)
2. **Kapcsolati adatok**:
   - **Fájl protokoll**: `SFTP`
   - **Gépnév**: `u516206.your-storagebox.de`
   - **Portszám**: `23`
   - **Felhasználónév**: `u516206`
   - **Jelszó**: **HAGYD ÜRESEN!**
3. **Speciális...** (F9) → **Hitelesítés** → **Privát kulcs fájl**:
   ```
   C:\Users\gelea\.ssh\machine_hetzner-storagebox_u516206_your-storagebox_de
   ```
4. **OK** → **Bejelentkezés**

Ha **jelszó nélkül** tudsz bejelentkezni, akkor sikeres volt a beállítás! 🎉

## Hibaelhárítás

### "Permission denied" hiba

- Ellenőrizd, hogy a `.ssh` mappa jogosultsága `700`
- Ellenőrizd, hogy az `authorized_keys` fájl jogosultsága `600`
- Ellenőrizd, hogy a publikus kulcs helyesen van-e beírva (nincs extra sortörés)

### "Could not load private key" hiba

- Ellenőrizd, hogy a privát kulcs fájl létezik-e
- Próbáld meg a kulcsot újra generálni, ha szükséges

### A .ssh mappa nem látszik

- **Nézet** → **Rejtett fájlok megjelenítése** (Ctrl+Alt+H)
- Vagy hozd létre újra: **Jobb klikk** → **Új** → **Könyvtár** → `.ssh`

## Gyors Útmutató

1. ✅ Publikus kulcs fájl létrehozása (`authorized_keys`)
2. ✅ WinSCP kapcsolat jelszóval
3. ✅ `.ssh` könyvtár létrehozása (ha nincs)
4. ✅ `authorized_keys` fájl feltöltése a `.ssh` mappába
5. ✅ Jogosultságok: `.ssh` = `700`, `authorized_keys` = `600`
6. ✅ Új kapcsolat SSH kulccsal (jelszó nélkül)

