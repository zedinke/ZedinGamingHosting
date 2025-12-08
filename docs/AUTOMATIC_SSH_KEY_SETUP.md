# Automatikus SSH Kulcs Generálás és Beállítás

## Áttekintés

Az admin felületen új szerver gép hozzáadásakor lehetőség van automatikus SSH kulcs generálásra és beállításra. Ez elkerüli a manuális SSH kapcsolódást és kulcs másolást.

## Funkciók

1. **Automatikus SSH kulcs generálás**: A rendszer automatikusan generál egy egyedi SSH kulcsot minden szerver géphez
2. **Publikus kulcs automatikus másolása**: A publikus kulcs automatikusan hozzáadódik a cél szerver `authorized_keys` fájlához
3. **SSH kapcsolat tesztelése**: A rendszer teszteli, hogy a kulcs alapú autentikáció működik-e

## Használat

### 1. Új szerver gép hozzáadása

1. Menj az **Admin Panel** → **Szerver Gépek** oldalra
2. Kattints az **"+ Új Szerver Gép"** gombra
3. Töltsd ki az adatokat:
   - **Név**: A szerver gép neve
   - **IP Cím**: A szerver IP címe
   - **SSH Port**: SSH port (alapértelmezett: 22)
   - **SSH Felhasználó**: SSH felhasználó (alapértelmezett: root)
   - **Automatikus SSH kulcs generálás**: ✅ Bejelölve (alapértelmezett)
   - **SSH Jelszó**: A cél szerver SSH jelszava (egyszeri használat)
   - **Megjegyzések**: Opcionális megjegyzések

### 2. Manuális SSH kulcs megadása

Ha nem szeretnéd az automatikus generálást használni:

1. Töröld a **"Automatikus SSH kulcs generálás és beállítás"** checkbox jelölését
2. Add meg a **SSH Kulcs Elérési Út**-ot (pl. `/root/.ssh/gameserver_key`)

## Technikai Részletek

### SSH Kulcs Generálás

- **Típus**: ED25519
- **Hely**: `/root/.ssh/machine_<machineId>_<ip>_key`
- **Jogosultságok**: 
  - Privát kulcs: `600` (csak olvasható/írható a tulajdonos számára)
  - Publikus kulcs: `644` (olvasható mindenki számára)

### Publikus Kulcs Másolás

A rendszer `sshpass` használatával másolja a publikus kulcsot a cél szerverre:

```bash
sshpass -p '<password>' ssh -p <port> <user>@<host> \
  "mkdir -p ~/.ssh && \
   chmod 700 ~/.ssh && \
   echo '<public_key>' >> ~/.ssh/authorized_keys && \
   chmod 600 ~/.ssh/authorized_keys"
```

### Előfeltételek

A webszerveren szükséges:
- `ssh-keygen` (általában alapértelmezetten telepítve)
- `sshpass` (telepítendő: `apt install -y sshpass`)

## Biztonsági Megfontolások

1. **Jelszó kezelés**: Az SSH jelszó csak egyszer kerül használatra, a kulcs generálás és másolás során. A jelszó nem kerül tárolásra az adatbázisban.

2. **Kulcs biztonság**: A generált SSH kulcsok csak a webszerveren tárolódnak, és csak a Node.js alkalmazás folyamat számára elérhetők.

3. **Jogosultságok**: A kulcsok megfelelő jogosultságokkal vannak beállítva (600 privát, 644 publikus).

## Hibaelhárítás

### sshpass nincs telepítve

```bash
apt update
apt install -y sshpass
```

### SSH kapcsolat sikertelen

1. Ellenőrizd, hogy a cél szerver elérhető-e:
   ```bash
   ping <ip_address>
   ```

2. Ellenőrizd az SSH portot:
   ```bash
   telnet <ip_address> <ssh_port>
   ```

3. Ellenőrizd a jelszót:
   ```bash
   ssh <user>@<ip_address> -p <port>
   ```

### Publikus kulcs másolás sikertelen

1. Ellenőrizd, hogy a cél szerveren létezik-e a `~/.ssh` könyvtár
2. Ellenőrizd a jogosultságokat a cél szerveren:
   ```bash
   ls -la ~/.ssh/
   chmod 700 ~/.ssh
   chmod 600 ~/.ssh/authorized_keys
   ```

## API Végpont

### POST `/api/admin/machines`

**Request Body:**
```json
{
  "name": "Szerver Gép Neve",
  "ipAddress": "192.168.1.100",
  "sshPort": 22,
  "sshUser": "root",
  "sshPassword": "jelszó", // Opcionális, csak automatikus kulcs generáláshoz
  "sshKeyPath": "/root/.ssh/key", // Opcionális, csak manuális kulcs megadásához
  "notes": "Megjegyzések"
}
```

**Response (sikeres automatikus kulcs generálás):**
```json
{
  "success": true,
  "machine": { ... },
  "message": "Szerver gép sikeresen hozzáadva. SSH kulcs automatikusan generálva és beállítva."
}
```

## Fájlok

- `lib/ssh-key-manager.ts`: SSH kulcs generálás és másolás utility függvények
- `app/api/admin/machines/route.ts`: API végpont automatikus kulcs generálással
- `components/admin/MachineManagement.tsx`: Frontend komponens automatikus kulcs generálás opcióval

