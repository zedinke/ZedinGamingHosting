# Szervergép Hozzáadása és Telepítés

Ez az útmutató bemutatja, hogyan adhatsz hozzá egy új szervergépet SSH-val a rendszerhez, és hogyan működnek a szerver telepítések.

## 📋 Előfeltételek

- SSH hozzáférés a cél szervergéphez
- Root vagy sudo jogosultság a cél szerveren
- Node.js 20+ telepítve a cél szerveren (vagy automatikus telepítés)
- Internet kapcsolat a cél szerveren (SteamCMD letöltéshez)

## 🔧 Lépések

### 1. Szervergép Hozzáadása az Admin Panelben

1. Jelentkezz be az admin panelbe
2. Menj a **Szerver Gépek** oldalra
3. Kattints az **Új Szerver Gép** gombra
4. Töltsd ki az adatokat:
   - **Név**: A szerver gép neve (pl. "Game Server 1")
   - **IP cím**: A szerver IP címe (pl. "192.168.1.100")
   - **SSH Port**: SSH port (alapértelmezett: 22)
   - **SSH Felhasználó**: SSH felhasználónév (pl. "root")
   - **SSH Kulcs Path**: SSH kulcs elérési útja (opcionális, ha jelszó helyett kulcsot használsz)
   - **Jegyzetek**: Opcionális megjegyzések

5. Kattints a **Mentés** gombra

### 2. SSH Kapcsolat Tesztelése

1. A szerver gép oldalán kattints a **SSH Teszt** gombra
2. Ellenőrizd, hogy sikeres-e a kapcsolat
3. Ha hiba van, ellenőrizd:
   - Az IP cím helyességét
   - Az SSH portot
   - A felhasználónevet
   - Az SSH kulcs/jelszó beállításait

### 3. Agent Telepítése

1. A szerver gép oldalán kattints az **Agent Telepítése** gombra
2. Az agent automatikusan települ a szerverre SSH-n keresztül
3. Az agent telepítés során:
   - Node.js telepítése (ha nincs)
   - Agent könyvtár létrehozása (`/opt/game-server-agent`)
   - Agent kód letöltése és telepítése
   - Systemd service létrehozása
   - Agent indítása

4. Ellenőrizd az agent státuszát:
   - Az agent automatikusan regisztrálja magát a rendszerben
   - Az agent heartbeat-je minden 30 másodpercben frissül
   - Ha az agent ONLINE státuszban van, készen áll a használatra

### 4. Szerver Telepítés Tesztelése

1. Rendelj egy új szervert a felhasználói felületen
2. Fizesd ki a szervert (vagy használd a PROBA rangot)
3. A rendszer automatikusan:
   - Kiválasztja a legjobb gépet (legkevesebb terhelés)
   - Hozzárendeli az agentet
   - Telepíti a játékszervert
   - Elindítja a szervert

## 🔍 Ellenőrzés

### Agent Státusz Ellenőrzése

```bash
# SSH-n keresztül a cél szerveren
systemctl status game-server-agent
```

### Agent Logok Megtekintése

```bash
# SSH-n keresztül a cél szerveren
journalctl -u game-server-agent -f
```

### Szerver Telepítés Ellenőrzése

1. Admin panel → Szerverek
2. Keress rá a telepített szerverre
3. Ellenőrizd a státuszt (ONLINE kell legyen)
4. Ellenőrizd, hogy van-e hozzárendelt gép és agent

## ⚠️ Fontos Megjegyzések

### SSH Kulcs vs Jelszó

- **SSH Kulcs (Ajánlott)**: Biztonságosabb, nem kell jelszót tárolni
- **Jelszó**: Egyszerűbb, de kevésbé biztonságos

### Agent Telepítés Követelmények

- A cél szerveren szükséges:
  - Internet kapcsolat
  - Root vagy sudo jogosultság
  - Legalább 10GB szabad hely
  - Legalább 2GB RAM

### Portok

- Az agent a következő portokat használja:
  - SSH: 22 (vagy amit beállítottál)
  - Manager API: A weboldal URL-je (pl. `https://yourdomain.com`)

### Firewall Beállítások

Győződj meg róla, hogy a következő portok nyitva vannak:
- SSH port (alapértelmezett: 22)
- Game server portok (dinamikusan generált)

## 🐛 Hibaelhárítás

### Agent nem települ

1. Ellenőrizd az SSH kapcsolatot
2. Ellenőrizd a sudo jogosultságokat
3. Nézd meg a task logokat az admin panelben
4. Ellenőrizd a cél szerver logjait

### Agent nem regisztrálódik

1. Ellenőrizd, hogy fut-e az agent: `systemctl status game-server-agent`
2. Ellenőrizd a manager URL-t az agent config-ban
3. Ellenőrizd a hálózati kapcsolatot

### Szerver nem települ

1. Ellenőrizd, hogy van-e ONLINE agent
2. Ellenőrizd a gép erőforrásait (CPU, RAM, Disk)
3. Nézd meg a provisioning task logokat

## 📚 További Információk

- Agent architektúra: `docs/AGENT_ARCHITECTURE.md`
- Game server telepítés: `lib/game-server-installer.ts`
- Server provisioning: `lib/server-provisioning.ts`

