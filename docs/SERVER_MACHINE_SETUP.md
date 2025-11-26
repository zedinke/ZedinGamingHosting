# Szerver Gép és Agent Beállítása

Ez az útmutató bemutatja, hogyan kell beállítani egy szerver gépet és agentet, hogy a játékszerver telepítés működjön.

## ⚠️ Fontos

Ha a következő hibaüzenetet kapod:
> **"Nincs elérhető gép vagy agent a szerver telepítéséhez"**

Ez azt jelenti, hogy nincs beállítva egyetlen szerver gép sem, vagy a gépek nem ONLINE státuszban vannak, vagy nincs agent telepítve rajtuk.

## 📋 Előfeltételek

- Admin jogosultság a rendszerben
- SSH hozzáférés a szerver géphez, ahol a játékszervereket telepíteni szeretnéd
- A szerver gépen telepített Node.js és Docker

## 🔧 Lépések

### 1. Lépés: Szerver Gép Hozzáadása az Admin Felületen

1. Jelentkezz be az admin felületre
2. Menj az **Admin → Gépek** menüpontra (`/admin/machines`)
3. Kattints az **Új gép hozzáadása** gombra
4. Töltsd ki az adatokat:
   - **Név**: A gép egyedi neve (pl. "Game Server 1", "Helsinki Node 1")
   - **IP cím**: A szerver gép IP címe (pl. `192.168.1.100` vagy publikus IP)
   - **SSH Port**: SSH port (alapértelmezett: `22`)
   - **SSH Felhasználó**: SSH felhasználó (pl. `root`, `ubuntu`, `gameuser`)
   - **SSH Kulcs útvonal**: Opcionális - SSH privát kulcs útvonala (pl. `/home/user/.ssh/id_rsa`)
   - **Megjegyzés**: Opcionális - További információk a gépről

5. Kattints a **Mentés** gombra

### 2. Lépés: SSH Kapcsolat Tesztelése

A gép hozzáadása után:

1. A gépek listájában kattints a gép nevére
2. Kattints az **SSH kapcsolat tesztelése** gombra
3. Ellenőrizd, hogy a kapcsolat sikeres volt

**Fontos**: Ha a SSH kapcsolat nem működik, ellenőrizd:
- Hogy az IP cím elérhető-e
- Hogy a SSH port nyitva van-e (általában 22)
- Hogy az SSH felhasználó létezik
- Hogy a SSH kulcs be van állítva (vagy jelszó alapú bejelentkezés engedélyezve van)

### 3. Lépés: Agent Telepítése

Az agent a szoftver, ami a szerver gépen fut, és kommunikál a fő szerverrel.

1. A gép részletek oldalán kattints az **Agent telepítése** gombra
2. Az agent automatikusan települ a szerver gépre SSH-n keresztül
3. Ellenőrizd, hogy az agent státusza **ONLINE** lett

**Agent telepítés után**:
- Az agent egy Docker konténerben fut
- Port: `3001` (vagy az általad megadott port)
- Az agent automatikusan csatlakozik a fő szerverhez

### 4. Lépés: Gép Erőforrások Beállítása

A gép részletek oldalán állítsd be az erőforrásokat:

- **CPU magok**: Hány CPU mag van (pl. `4`, `8`, `16`)
- **RAM (GB)**: Mennyi RAM van (pl. `16`, `32`, `64`)
- **Tárhely (GB)**: Mennyi tárhely van (pl. `100`, `500`, `1000`)

Ezek az adatok segítenek a rendszernek meghatározni, hogy hány szerver fér el a gépen.

### 5. Lépés: Ellenőrzés

A gépek listájában ellenőrizd:

- ✅ **Státusz**: **ONLINE** kell legyen
- ✅ **Agentek száma**: Legalább 1 ONLINE agent kell legyen
- ✅ **Erőforrások**: Be vannak állítva

## 🎮 Szerver Telepítés

Miután a gép és agent be van állítva:

1. A felhasználók rendelhetnek játékszervereket
2. A rendszer automatikusan kiválasztja a legjobb gépet és agentet
3. A szerver telepítés automatikusan megkezdődik

## 🔍 Hibaelhárítás

### Hiba: "Nincs elérhető gép vagy agent"

**Megoldások**:
1. Ellenőrizd, hogy van-e beállítva szerver gép (Admin → Gépek)
2. Ellenőrizd, hogy a gép státusza **ONLINE**-e
3. Ellenőrizd, hogy van-e telepítve és futó agent a gépen
4. Ellenőrizd, hogy az agent státusza **ONLINE**-e

### Hiba: SSH kapcsolat nem működik

**Megoldások**:
1. Ellenőrizd az IP címet és portot
2. Teszteld a SSH kapcsolatot manuálisan: `ssh user@ip -p port`
3. Ellenőrizd a tűzfal beállításokat
4. Ha SSH kulcsot használsz, ellenőrizd hogy a kulcs elérhető-e

### Hiba: Agent nem kapcsolódik

**Megoldások**:
1. Ellenőrizd az agent logokat a gép részletek oldalán
2. Ellenőrizd, hogy az agent konténer fut-e: `docker ps | grep agent`
3. Ellenőrizd a hálózati kapcsolatot a gépről a fő szerverre
4. Újraindítsd az agentet az admin felületen

### Agent manuális telepítése

Ha az automatikus telepítés nem működik, manuálisan is telepítheted:

1. Csatlakozz SSH-val a szerver gépre
2. Telepítsd a Docker-t (ha nincs):
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   ```
3. Indítsd el az agent konténert (az admin felület részleteiben találod a pontos parancsot)

## 📚 További Információk

- [Agent Architektúra](AGENT_ARCHITECTURE.md)
- [Szerver Telepítési Útmutató](SERVER_MACHINE_SETUP.md)
- [Rendszer Funkciók](SYSTEM_FEATURES.md)
