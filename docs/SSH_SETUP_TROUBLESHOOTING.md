# SSH Beállítás Hibaelhárítás

## "This account is currently not available" hiba

### Probléma

Amikor `ssh-copy-id`-t futtatsz, ezt a hibát kapod:
```
gameserver@your-server-ip's password:
This account is currently not available.
```

### Ok

A `gameserver` felhasználó shell-je nincs megfelelően beállítva. Valószínűleg `/usr/sbin/nologin` vagy `/bin/false` van beállítva, ami megakadályozza az SSH bejelentkezést.

### Megoldás

#### 1. Lépés: Shell beállítása

```bash
# SSH kapcsolódás a szervergépre root-ként
ssh root@your-server-ip

# Shell beállítása /bin/bash-re
sudo usermod -s /bin/bash gameserver

# Ellenőrzés
grep gameserver /etc/passwd
# Kellene látnod: gameserver:x:UID:GID::/opt/game-servers:/bin/bash
```

#### 2. Lépés: Felhasználó létrehozása (ha még nincs)

```bash
# Felhasználó létrehozása megfelelő shell-lel
sudo useradd -m -d /opt/game-servers -s /bin/bash gameserver

# Jelszó beállítása (ha szükséges)
sudo passwd gameserver
```

#### 3. Lépés: SSH kulcs manuális másolása

Mivel az `ssh-copy-id` nem működik, manuálisan másold a kulcsot:

**Opció A: Root-ként a szervergépen**

```bash
# 1. Webszerverről: Publikus kulcs megjelenítése
cat ~/.ssh/gameserver_key.pub

# 2. Szervergépen: Másold a kulcsot
ssh root@your-server-ip

# 3. Könyvtárak létrehozása
sudo -u gameserver mkdir -p /opt/game-servers/.ssh
sudo -u gameserver chmod 700 /opt/game-servers/.ssh

# 4. Publikus kulcs hozzáadása (másold be a webszerverről kapott kulcsot)
sudo -u gameserver tee -a /opt/game-servers/.ssh/authorized_keys << 'EOF'
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... root@panel.ascensionstudio.hu
EOF

# 5. Jogosultságok beállítása
sudo -u gameserver chmod 600 /opt/game-servers/.ssh/authorized_keys
```

**Opció B: SCP használata**

```bash
# Webszerverről: Publikus kulcs másolása root-ként, majd áthelyezés
scp ~/.ssh/gameserver_key.pub root@your-server-ip:/tmp/gameserver_key.pub

# Szervergépen:
ssh root@your-server-ip
sudo -u gameserver mkdir -p /opt/game-servers/.ssh
sudo -u gameserver chmod 700 /opt/game-servers/.ssh
sudo -u gameserver cp /tmp/gameserver_key.pub /opt/game-servers/.ssh/authorized_keys
sudo -u gameserver chmod 600 /opt/game-servers/.ssh/authorized_keys
rm /tmp/gameserver_key.pub
```

#### 4. Lépés: Tesztelés

```bash
# Webszerverről: SSH kapcsolat tesztelése
ssh -i ~/.ssh/gameserver_key gameserver@your-server-ip "echo 'SSH connection successful'"

# Ha sikeres, akkor készen vagy!
```

## További gyakori problémák

### 1. "Permission denied (publickey)" hiba

**Ok:** A kulcs jogosultságok rosszak vagy a kulcs nincs a megfelelő helyen.

**Megoldás:**
```bash
# Webszerveren: Privát kulcs jogosultságok
chmod 600 ~/.ssh/gameserver_key

# Szervergépen: Authorized_keys jogosultságok
sudo -u gameserver chmod 700 /opt/game-servers/.ssh
sudo -u gameserver chmod 600 /opt/game-servers/.ssh/authorized_keys
```

### 2. "Connection refused" hiba

**Ok:** SSH szolgáltatás nem fut vagy a port nem elérhető.

**Megoldás:**
```bash
# Szervergépen: SSH szolgáltatás ellenőrzése
sudo systemctl status sshd
# vagy
sudo systemctl status ssh

# Ha nem fut, indítsd el:
sudo systemctl start sshd
sudo systemctl enable sshd

# Port ellenőrzése
sudo netstat -tlnp | grep :22
```

### 3. "Host key verification failed" hiba

**Ok:** A szerver host key-je változott vagy nincs a known_hosts-ban.

**Megoldás:**
```bash
# Ismert hostok törlése (ha szükséges)
ssh-keygen -R your-server-ip

# Vagy StrictHostKeyChecking=no használata (fejlesztéshez)
ssh -o StrictHostKeyChecking=no -i ~/.ssh/gameserver_key gameserver@your-server-ip
```

### 4. Felhasználó nem létezik

**Ok:** A `gameserver` felhasználó nincs létrehozva.

**Megoldás:**
```bash
# Felhasználó létrehozása
sudo useradd -m -d /opt/game-servers -s /bin/bash gameserver

# Ellenőrzés
id gameserver
# Kellene látnod: uid=... gid=... groups=...
```

## Ellenőrző lista

- [ ] `gameserver` felhasználó létrehozva
- [ ] Shell beállítva: `/bin/bash` (nem `/usr/sbin/nologin` vagy `/bin/false`)
- [ ] Home könyvtár létrehozva: `/opt/game-servers`
- [ ] `.ssh` könyvtár létrehozva: `/opt/game-servers/.ssh`
- [ ] `authorized_keys` fájl létrehozva
- [ ] Jogosultságok helyesek:
  - `.ssh`: `700` (drwx------)
  - `authorized_keys`: `600` (-rw-------)
- [ ] Privát kulcs jogosultságok helyesek: `600` (-rw-------)
- [ ] SSH kapcsolat tesztelve és működik

## Gyors ellenőrzés parancsok

```bash
# Szervergépen (root-ként):
# 1. Felhasználó ellenőrzése
grep gameserver /etc/passwd

# 2. Shell ellenőrzése
sudo -u gameserver echo $SHELL

# 3. SSH könyvtár ellenőrzése
sudo -u gameserver ls -la /opt/game-servers/.ssh/

# 4. Jogosultságok ellenőrzése
sudo -u gameserver stat /opt/game-servers/.ssh
sudo -u gameserver stat /opt/game-servers/.ssh/authorized_keys

# Webszerveren:
# 5. Privát kulcs jogosultságok
ls -la ~/.ssh/gameserver_key

# 6. SSH kapcsolat tesztelése
ssh -i ~/.ssh/gameserver_key -v gameserver@your-server-ip "echo 'Test successful'"
```

## További segítség

- [Teljes Szervergép Beállítási Útmutató](./SERVER_MACHINE_SETUP.md)
- [Agent Installer Dokumentáció](./AGENT_INSTALLER.md)

