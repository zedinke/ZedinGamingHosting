# SSH Kapcsolat - Webszerver

## Szerver Adatok

**IP cím:** 116.203.226.140  
**Felhasználó:** root  
**Jelszó:** Gele007ta...  
**Port:** 22 (alapértelmezett SSH port)

### Szerver Specifikációk

✅ **SSH kapcsolat:** Működik (webserver_key)  
**Hostname:** ubuntu-8gb-nbg1-1  
**OS:** Ubuntu 24.04.3 LTS  
**CPU:** 8 mag  
**RAM:** 15 GB (7.4 GB használatban)  
**Disk:** 75 GB (7.9 GB használatban, 64 GB szabad)  
**Node.js:** v24.11.1 ✅  
**Git:** 2.43.0 ✅  
**Hestia CP:** Nincs telepítve (tiszta Ubuntu szerver)

## SSH Kapcsolat

### Jelszóval való kapcsolódás

```bash
ssh root@116.203.226.140
# Jelszó: Gele007ta...
```

### SSH Kulcs Beállítása

#### 1. SSH kulcs generálása (ha még nincs)

```bash
# Lokális gépen
ssh-keygen -t ed25519 -C "webserver-key" -f ~/.ssh/webserver_key

# Vagy RSA kulcs (ha ed25519 nem támogatott):
ssh-keygen -t rsa -b 4096 -C "webserver-key" -f ~/.ssh/webserver_key
```

#### 2. Publikus kulcs másolása a szerverre

```bash
# Jelszóval való kapcsolódás után
ssh-copy-id -i ~/.ssh/webserver_key.pub root@116.203.226.140

# Vagy manuálisan:
cat ~/.ssh/webserver_key.pub | ssh root@116.203.226.140 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

#### 3. SSH kulcs használata

```bash
ssh -i ~/.ssh/webserver_key root@116.203.226.140
```

## SSH Kulcs Ellenőrzése

### Lokális gépen

**Kulcs helye:**
- Privát kulcs: `C:\Users\gelea\.ssh\webserver_key`
- Publikus kulcs: `C:\Users\gelea\.ssh\webserver_key.pub`

**Publikus kulcs tartalma:**
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICcIOfJ3yfnbXz8J1YlDIs6bMKcszHaEhOilyghXs/MR webserver-key
```

```bash
# PowerShell-ben ellenőrzés
Get-Content $env:USERPROFILE\.ssh\webserver_key.pub

# Kulcs tartalmának megtekintése
cat ~/.ssh/webserver_key.pub
```

### Szerveren (SSH kapcsolaton keresztül)

```bash
# Kapcsolódj a szerverhez
ssh root@116.203.226.140

# Ellenőrizd az authorized_keys fájlt
cat ~/.ssh/authorized_keys

# Jogosultságok ellenőrzése
ls -la ~/.ssh/
# authorized_keys-nek 600 (-rw-------) jogosultsággal kell rendelkeznie
```

## SSH Kulcs Tesztelése

```bash
# Próbáld meg kapcsolódni kulcs nélküli jelszó kérése nélkül
ssh -i ~/.ssh/webserver_key root@116.203.226.140

# Ha nem kér jelszót, akkor működik!
```

## Hibaelhárítás

### Ha a kulcs nem működik

1. **Jogosultságok ellenőrzése:**
   ```bash
   chmod 600 ~/.ssh/webserver_key
   chmod 644 ~/.ssh/webserver_key.pub
   ```

2. **Szerveren az authorized_keys ellenőrzése:**
   ```bash
   ssh root@116.203.226.140
   chmod 700 ~/.ssh
   chmod 600 ~/.ssh/authorized_keys
   ```

3. **SSH debug mód:**
   ```bash
   ssh -v -i ~/.ssh/webserver_key root@116.203.226.140
   ```

## SSH Kulcs Beállítása (Automatikus)

Használd a `scripts/setup-ssh-key.ps1` scriptet:

```powershell
.\scripts\setup-ssh-key.ps1
```

Ez a script:
1. ✅ Létrehozza a webserver_key-t (ha még nincs)
2. 📋 Megjeleníti a publikus kulcsot
3. 📤 Segít a kulcs másolásában a szerverre
4. 🧪 Teszteli a kapcsolatot

## Projekt Telepítés

Miután az SSH kulcs működik, a projekt telepítése:

```bash
# Kapcsolódj a szerverhez (Windows PowerShell)
ssh -i $env:USERPROFILE\.ssh\webserver_key root@116.203.226.140

# Navigálj a web könyvtárba (cseréld ki a domain-t)
cd /home/user/web/yourdomain.com/public_html

# Klónozd a projektet
git clone https://github.com/zedinke/ZedinGamingHosting.git .

# Telepítés (lásd: docs/COMPLETE_INSTALLATION.md)
```

## Biztonsági Megjegyzések

⚠️ **FONTOS:**
- Ne oszd meg a jelszót vagy SSH kulcsot!
- Használj erős SSH kulcsokat (ed25519 vagy RSA 4096 bit)
- Tiltsd le a root bejelentkezést jelszóval (ha lehetséges)
- Használj SSH kulcsot a jelszó helyett

