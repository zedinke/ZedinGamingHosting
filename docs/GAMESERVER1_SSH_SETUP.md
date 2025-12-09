# GameServer-1 SSH Kulcs Beállítás

## Szerver Adatok

**IP cím:** 95.217.194.148  
**Felhasználó:** root  
**Jelszó:** :2hJsXmJVTTx3Aw  
**Port:** 22

## SSH Kulcs Beállítás (Manuális)

### 1. Lokális gépen - Publikus kulcs

A publikus kulcs már generálva van:
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIL81EbnxXvIZH8CFWGGwd3+ziUoNmG9dhFPS1ryGxRjv gameserver1
```

**Kulcs helye:**
- Privát kulcs: `C:\Users\gelea\.ssh\gameserver1_key`
- Publikus kulcs: `C:\Users\gelea\.ssh\gameserver1_key.pub`

### 2. GameServer-1-en - Kulcs hozzáadása

Kapcsolódj a GameServer-1-hez jelszóval:
```bash
ssh root@95.217.194.148
# Jelszó: :2hJsXmJVTTx3Aw
```

Majd futtasd ezeket a parancsokat:
```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIL81EbnxXvIZH8CFWGGwd3+ziUoNmG9dhFPS1ryGxRjv gameserver1" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 3. Tesztelés

Lokális gépen (PowerShell):
```powershell
ssh -i $env:USERPROFILE\.ssh\gameserver1_key root@95.217.194.148 "echo 'SSH kulcs működik!'"
```

Vagy Linux/Mac:
```bash
ssh -i ~/.ssh/gameserver1_key root@95.217.194.148 "echo 'SSH kulcs működik!'"
```

## Automatikus Beállítás (Webszerverről)

Ha a webszerverről szeretnéd beállítani:

```bash
# Webszerverről (116.203.226.140)
ssh root@116.203.226.140

# Ott futtasd:
sshpass -p ':2hJsXmJVTTx3Aw' ssh -o StrictHostKeyChecking=no root@95.217.194.148 "mkdir -p ~/.ssh && echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIL81EbnxXvIZH8CFWGGwd3+ziUoNmG9dhFPS1ryGxRjv gameserver1' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && chmod 700 ~/.ssh"
```

## Használat

Miután a kulcs be van állítva, használd így:

```powershell
# PowerShell
ssh -i $env:USERPROFILE\.ssh\gameserver1_key root@95.217.194.148

# Parancs futtatása
ssh -i $env:USERPROFILE\.ssh\gameserver1_key root@95.217.194.148 "docker --version"
```

## Hibaelhárítás

Ha a kapcsolat timeout-ol vagy blokkolódik:

1. **Ellenőrizd a hálózati kapcsolatot:**
   ```powershell
   Test-NetConnection -ComputerName 95.217.194.148 -Port 22
   ```

2. **Használj explicit timeout-ot:**
   ```powershell
   ssh -i $env:USERPROFILE\.ssh\gameserver1_key -o ConnectTimeout=10 -o ServerAliveInterval=5 root@95.217.194.148 "echo 'test'"
   ```

3. **Ellenőrizd a jelszóval való kapcsolódást:**
   ```powershell
   ssh root@95.217.194.148
   # Jelszó: :2hJsXmJVTTx3Aw
   ```

