# Szervergép Beállítási Útmutató

Ez az útmutató bemutatja, hogyan kell beállítani egy szervergépet a game server hosting rendszerhez.

## 🔐 1. Dedikált Felhasználó Létrehozása

### 1.1 Felhasználó Létrehozása

```bash
# SSH kapcsolódás a szerverhez (root vagy sudo jogosultsággal)
ssh root@your-server-ip

# Dedikált felhasználó létrehozása (FONTOS: -s /bin/bash flaggel!)
# A --system flag NEM használható, mert az /usr/sbin/nologin shell-t állít be
sudo useradd -m -d /opt/game-servers -s /bin/bash gameserver

# Vagy ha adduser-t használsz:
sudo adduser --home /opt/game-servers --shell /bin/bash gameserver

# Ellenőrizd, hogy a shell be van-e állítva:
sudo grep gameserver /etc/passwd
# Kellene látnod: gameserver:x:UID:GID::/opt/game-servers:/bin/bash

# Ha a shell /usr/sbin/nologin vagy /bin/false, akkor javítsd:
sudo usermod -s /bin/bash gameserver

# Jelszó beállítása (opcionális, ha SSH kulcsot használsz)
sudo passwd gameserver
```

### 1.2 Sudo Jogosultságok Beállítása

Az agent-nek szüksége van sudo jogosultságra bizonyos műveletekhez (systemd service létrehozás, portok kezelése, stb.):

```bash
# Sudoers fájl szerkesztése
sudo visudo

# Add hozzá ezt a sort (vagy használd a sudoers.d könyvtárat)
gameserver ALL=(ALL) NOPASSWD: /usr/bin/systemctl, /usr/sbin/service, /usr/bin/apt-get, /usr/bin/apt, /bin/mount, /bin/umount
```

**Vagy biztonságosabb módszer - sudoers.d fájl:**

```bash
# Sudoers.d fájl létrehozása
sudo tee /etc/sudoers.d/gameserver > /dev/null <<EOF
# Game Server Agent sudo jogosultságok
gameserver ALL=(ALL) NOPASSWD: /usr/bin/systemctl
gameserver ALL=(ALL) NOPASSWD: /usr/sbin/service
gameserver ALL=(ALL) NOPASSWD: /usr/bin/apt-get
gameserver ALL=(ALL) NOPASSWD: /usr/bin/apt
gameserver ALL=(ALL) NOPASSWD: /bin/mount
gameserver ALL=(ALL) NOPASSWD: /bin/umount
gameserver ALL=(ALL) NOPASSWD: /bin/mkdir
gameserver ALL=(ALL) NOPASSWD: /bin/chown
gameserver ALL=(ALL) NOPASSWD: /usr/bin/tee
gameserver ALL=(ALL) NOPASSWD: /usr/bin/docker
gameserver ALL=(ALL) NOPASSWD: /usr/bin/docker-compose
EOF

# Fájl jogosultságok beállítása
sudo chmod 0440 /etc/sudoers.d/gameserver
```

### 1.3 Könyvtárak Létrehozása és Jogosultságok Beállítása

```bash
# Game server könyvtárak létrehozása
sudo mkdir -p /opt/servers
sudo mkdir -p /opt/ark-shared
sudo mkdir -p /opt/ark-clusters
sudo mkdir -p /opt/backups
sudo mkdir -p /opt/game-server-agent

# Tulajdonos beállítása
sudo chown -R gameserver:gameserver /opt/servers
sudo chown -R gameserver:gameserver /opt/ark-shared
sudo chown -R gameserver:gameserver /opt/ark-clusters
sudo chown -R gameserver:gameserver /opt/backups
sudo chown -R gameserver:gameserver /opt/game-server-agent

# Jogosultságok beállítása
sudo chmod 755 /opt/servers
sudo chmod 755 /opt/ark-shared
sudo chmod 755 /opt/ark-clusters
sudo chmod 755 /opt/backups
sudo chmod 755 /opt/game-server-agent
```

## 🔑 2. SSH Kulcs Beállítása

### 2.1 SSH Kulcs Generálása (Webszerveren)

```bash
# Generáld az SSH kulcsot a webszerveren (ahol a Next.js app fut)
ssh-keygen -t ed25519 -f ~/.ssh/gameserver_key -N ""

# Vagy RSA kulcs (ha ed25519 nem támogatott):
ssh-keygen -t rsa -b 4096 -f ~/.ssh/gameserver_key -N ""
```

### 2.2 Publikus Kulcs Másolása a Szervergépre

**FONTOS:** Ha a "This account is currently not available" hibát kapsz, akkor a felhasználó shell-je nincs megfelelően beállítva. Javítsd először:

```bash
# A szervergépen (root-ként):
sudo usermod -s /bin/bash gameserver

# Ellenőrizd:
sudo grep gameserver /etc/passwd
# Kellene látnod: gameserver:x:UID:GID::/opt/game-servers:/bin/bash
```

**Ezután próbáld újra:**

```bash
# Webszerverről: Publikus kulcs másolása a szervergépre
ssh-copy-id -i ~/.ssh/gameserver_key.pub gameserver@your-server-ip

# Ha még mindig nem működik, használd a manuális módszert root-ként:
# Először root-ként másold a kulcsot:
cat ~/.ssh/gameserver_key.pub | ssh root@your-server-ip "sudo -u gameserver mkdir -p /opt/game-servers/.ssh && sudo -u gameserver chmod 700 /opt/game-servers/.ssh && sudo -u gameserver tee -a /opt/game-servers/.ssh/authorized_keys && sudo -u gameserver chmod 600 /opt/game-servers/.ssh/authorized_keys"

# Vagy egyszerűbben, ha root-ként vagy a szervergépen:
# 1. Lépj be root-ként a szervergépre
ssh root@your-server-ip

# 2. Másold a publikus kulcsot
echo "PASTE_YOUR_PUBLIC_KEY_HERE" | sudo -u gameserver tee -a /opt/game-servers/.ssh/authorized_keys

# 3. Jogosultságok beállítása
sudo -u gameserver chmod 700 /opt/game-servers/.ssh
sudo -u gameserver chmod 600 /opt/game-servers/.ssh/authorized_keys
```

### 2.3 SSH Konfiguráció (Opcionális, de ajánlott)

A webszerveren hozz létre egy SSH config fájlt:

```bash
# ~/.ssh/config fájl szerkesztése
nano ~/.ssh/config

# Add hozzá:
Host gameserver-*
    User gameserver
    IdentityFile ~/.ssh/gameserver_key
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
```

## 🛠️ 3. Szükséges Szoftverek Telepítése

### 3.1 Alapvető Csomagok

```bash
# SSH kapcsolódás a gameserver felhasználóval
ssh gameserver@your-server-ip

# System update
sudo apt-get update
sudo apt-get upgrade -y

# Alapvető eszközök
sudo apt-get install -y curl wget git unzip tar gzip
```

### 3.2 SteamCMD Telepítése (Game Server Installer automatikusan telepíti, de előre is lehet)

```bash
# SteamCMD könyvtár
sudo mkdir -p /opt/steamcmd
sudo chown gameserver:gameserver /opt/steamcmd

# SteamCMD letöltése és telepítése
cd /opt/steamcmd
wget https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz
tar -xzf steamcmd_linux.tar.gz
chmod +x steamcmd.sh
```

### 3.3 Java Telepítése (Minecraft és más Java alapú játékokhoz)

```bash
# OpenJDK 17 telepítése
sudo apt-get install -y openjdk-17-jre-headless

# Vagy OpenJDK 21 (újabb verzió)
sudo apt-get install -y openjdk-21-jre-headless
```

### 3.4 Docker (Opcionális, ha Docker-t használsz)

```bash
# Docker telepítése
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# gameserver felhasználó hozzáadása a docker csoporthoz
sudo usermod -aG docker gameserver
```

## 📝 4. Admin Panelben Szervergép Hozzáadása

Az admin panelben (`/admin/machines`) add hozzá a szervergépet:

1. **Név**: Pl. "Game Server 1" vagy "EU Server"
2. **IP cím**: A szerver IP címe
3. **SSH Port**: Általában 22
4. **SSH User**: `gameserver`
5. **SSH Key Path**: A webszerveren a privát kulcs elérési útja (pl. `/home/user/.ssh/gameserver_key`)
6. **SSH Password**: Hagyd üresen, ha SSH kulcsot használsz
7. **Leírás**: Opcionális leírás

### 4.1 SSH Kulcs Elérési Út Beállítása

A webszerveren (ahol a Next.js app fut) győződj meg róla, hogy:
- Az SSH privát kulcs elérhető
- A fájl jogosultságok helyesek: `chmod 600 ~/.ssh/gameserver_key`
- A Next.js app felhasználója hozzáfér a kulcshoz

## ✅ 5. Tesztelés

### 5.1 SSH Kapcsolat Tesztelése

```bash
# Webszerverről teszteld az SSH kapcsolatot
ssh -i ~/.ssh/gameserver_key gameserver@your-server-ip "echo 'SSH connection successful'"
```

### 5.2 Agent Telepítés Tesztelése

Az admin panelben:
1. Menj a **Szervergépek** oldalra
2. Kattints a szervergép **"Agent Telepítése"** gombjára
3. Figyeld a telepítési folyamatot
4. Ellenőrizd, hogy az agent sikeresen regisztrálódott-e

### 5.3 Szerver Telepítés Tesztelése

1. Rendelj egy teszt szervert
2. Fizesd ki (vagy használd a PROBA rangot)
3. Ellenőrizd, hogy a szerver automatikusan települ-e

## 🔒 6. Biztonsági Ajánlások

### 6.1 SSH Biztonság

```bash
# SSH konfiguráció szerkesztése
sudo nano /etc/ssh/sshd_config

# Ajánlott beállítások:
PermitRootLogin no
PasswordAuthentication no  # Ha csak SSH kulcsot használsz
PubkeyAuthentication yes
AllowUsers gameserver

# SSH újraindítása
sudo systemctl restart sshd
```

### 6.2 Firewall Beállítás

```bash
# UFW (Uncomplicated Firewall) telepítése és beállítása
sudo apt-get install -y ufw

# Alapvető portok engedélyezése
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP (ha szükséges)
sudo ufw allow 443/tcp   # HTTPS (ha szükséges)

# Game server portok dinamikusan nyitva lesznek (a rendszer kezeli)

# Firewall engedélyezése
sudo ufw enable
```

### 6.3 Fail2Ban (Opcionális, de ajánlott)

```bash
# Fail2Ban telepítése
sudo apt-get install -y fail2ban

# Alapértelmezett konfiguráció használata (elég a legtöbb esetben)
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## 📋 7. Ellenőrző Lista

- [ ] Dedikált `gameserver` felhasználó létrehozva
- [ ] Sudo jogosultságok beállítva
- [ ] Könyvtárak létrehozva és jogosultságok beállítva
- [ ] SSH kulcs generálva és másolva
- [ ] SSH kapcsolat tesztelve
- [ ] Alapvető szoftverek telepítve (curl, wget, git, stb.)
- [ ] Java telepítve (ha szükséges)
- [ ] SteamCMD telepítve (vagy automatikus telepítésre vár)
- [ ] Szervergép hozzáadva az admin panelben
- [ ] Agent telepítve és működik
- [ ] Teszt szerver telepítve és működik

## 🆘 8. Hibaelhárítás

### 8.1 SSH Kapcsolat Sikertelen

```bash
# SSH verbose módban tesztelés
ssh -v -i ~/.ssh/gameserver_key gameserver@your-server-ip

# Ellenőrizd a jogosultságokat
ls -la ~/.ssh/gameserver_key
# Kellene: -rw------- (600)

# Ellenőrizd a szerver oldali authorized_keys fájlt
ssh gameserver@your-server-ip "cat ~/.ssh/authorized_keys"
```

### 8.2 Sudo Jogosultságok Probléma

```bash
# Teszteld a sudo jogosultságokat
sudo -u gameserver sudo systemctl status

# Ellenőrizd a sudoers fájlt
sudo visudo -c
```

### 8.3 Agent Nem Regisztrálódik

```bash
# Agent logok ellenőrzése
ssh gameserver@your-server-ip "journalctl -u game-server-agent -n 50"

# Agent manuális indítása
ssh gameserver@your-server-ip "sudo systemctl start game-server-agent"
```

## 📚 További Információk

- [Agent Installer Dokumentáció](./AGENT_INSTALLER.md)
- [Game Server Installer Dokumentáció](./GAME_SERVER_INSTALLER.md)
- [System Diagnostics](./SYSTEM_DIAGNOSTICS.md)
