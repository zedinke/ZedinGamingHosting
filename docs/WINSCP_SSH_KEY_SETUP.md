# WinSCP SSH Kulcs Beállítása

## SSH Kulcs Útvonal

```
C:\Users\gelea\.ssh\machine_hetzner-storagebox_u516206_your-storagebox_de
```

## WinSCP Kapcsolat Beállítása

### 1. Új Kapcsolat Létrehozása

1. **Nyisd meg a WinSCP-t**
2. **Kattints az "Új munkamenet"** gombra (vagy **Ctrl+N**)
3. **Töltsd ki a kapcsolati adatokat**:
   - **Fájl protokoll**: `SFTP`
   - **Gépnév**: `u516206.your-storagebox.de`
   - **Portszám**: `23`
   - **Felhasználónév**: `u516206`
   - **Jelszó**: `Gele007ta...` (ideiglenesen, majd kivesszük)

### 2. SSH Kulcs Beállítása

1. **Kattints a "Speciális..."** gombra (vagy **F9**)
2. **Navigálj a "Hitelesítés"** menüpontra (bal oldali menüben)
3. **Az "SSH" alatt**:
   - **Privát kulcs fájl**: Kattints a **"..."** gombra
   - **Tallózd meg** a következő fájlt:
     ```
     C:\Users\gelea\.ssh\machine_hetzner-storagebox_u516206_your-storagebox_de
     ```
   - **Fontos**: A **privát kulcsot** válaszd (NEM a `.pub` fájlt!)
4. **Kattints az "OK"** gombra

### 3. Jelszó Eltávolítása (Opcionális)

Miután az SSH kulcs be van állítva, eltávolíthatod a jelszót:

1. **A kapcsolati beállításokban**:
   - **Jelszó mező**: Hagyd üresen
2. **Kattints az "OK"** gombra

### 4. Kapcsolat Mentése

1. **Kattints a "Mentés"** gombra
2. **Add meg a kapcsolat nevét**: `Hetzner StorageBox`
3. **Kattints az "OK"** gombra

### 5. Kapcsolat Tesztelése

1. **Válaszd ki a mentett kapcsolatot**
2. **Kattints a "Bejelentkezés"** gombra
3. **Ha jelszó nélkül tudsz bejelentkezni**, akkor sikeres volt a beállítás!

## Hibaelhárítás

### "Permission denied" hiba

- Ellenőrizd, hogy a **privát kulcs fájlt** választottad-e (nem a `.pub` fájlt)
- Ellenőrizd, hogy a publikus kulcs be van-e állítva a StorageBox-on
- Próbáld meg újra a jelszóval, majd távolítsd el

### "Could not load private key" hiba

- Ellenőrizd, hogy a kulcs fájl létezik-e
- Próbáld meg a kulcsot újra generálni, ha szükséges

### "Host key verification failed" hiba

1. **Kattints a "Speciális..."** gombra
2. **Navigálj a "Kapcsolat" > "SSH"** menüpontra
3. **Töröld a StorageBox host key-t** a listából
4. **Vagy jelöld be**: "Automatikusan elfogadja a host kulcsot"

## Gyors Útmutató

1. **WinSCP** → **Új munkamenet** (Ctrl+N)
2. **Protokoll**: SFTP
3. **Gépnév**: `u516206.your-storagebox.de`
4. **Port**: `23`
5. **Felhasználó**: `u516206`
6. **Speciális...** (F9) → **Hitelesítés** → **Privát kulcs fájl**: `C:\Users\gelea\.ssh\machine_hetzner-storagebox_u516206_your-storagebox_de`
7. **Mentés** → **Bejelentkezés**

## Képernyőképek Lépései

### 1. Kapcsolati Beállítások
```
Fájl protokoll: SFTP
Gépnév: u516206.your-storagebox.de
Portszám: 23
Felhasználónév: u516206
```

### 2. Speciális Beállítások
```
Bal oldali menü: Hitelesítés
SSH → Privát kulcs fájl: [Tallózás gomb]
```

### 3. Kulcs Fájl Kiválasztása
```
Navigálj: C:\Users\gelea\.ssh\
Válaszd: machine_hetzner-storagebox_u516206_your-storagebox_de
(NEM a .pub fájlt!)
```

