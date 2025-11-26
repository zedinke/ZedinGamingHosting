# Docker és Game Server Rendszer Együttélés

Ez a dokumentum leírja, hogyan működik együtt a game server hosting rendszer egy olyan gépen, ahol már futnak Docker konténerek.

## 🔍 Hogyan Működik?

### 1. Erőforrás Monitoring

A rendszer **automatikusan figyelembe veszi** a Docker konténerek által használt erőforrásokat:

- **CPU**: Az agent a teljes gép CPU használatát monitorozza, beleértve a Docker konténereket is
- **RAM**: A teljes RAM használatot figyeli, Docker konténerek által használt memóriát is
- **Disk**: A teljes lemezterületet monitorozza

**Következmény**: A rendszer csak akkor telepít új szervert, ha van elég szabad erőforrás (CPU, RAM, Disk) a Docker konténerek után is.

### 2. Port Management

A rendszer **két szinten ellenőrzi** a portokat:

1. **Adatbázis szint**: Ellenőrzi, hogy a port nincs-e már használatban más szerver által a rendszerben
2. **Gép szint**: SSH-n keresztül ellenőrzi a ténylegesen foglalt portokat a gépen (beleértve a Docker konténereket is)

**Parancsok amit használ**:
```bash
# Port ellenőrzés
ss -tuln | grep ":PORT "
# vagy
netstat -tuln | grep ":PORT "
```

**Következmény**: Ha egy Docker konténer használja a portot, a rendszer automatikusan egy másik szabad portot választ.

### 3. Port Konfliktusok Elkerülése

A rendszer a következő módon kerüli el a port konfliktusokat:

1. **Alapértelmezett port ellenőrzés**: Először ellenőrzi az alapértelmezett portot (pl. ARK: 7777)
2. **Inkrementális keresés**: Ha foglalt, +1, +2, +3... portokat próbálja meg
3. **Tényleges ellenőrzés**: Minden portot ténylegesen ellenőriz a gépen SSH-n keresztül

**Példa**:
- Docker konténer használja a 7777-es portot
- Új ARK szerver rendelés esetén a rendszer ellenőrzi: 7777 foglalt → 7778 foglalt → 7779 szabad ✅

## ⚠️ Fontos Megjegyzések

### 1. Port Tartományok

A rendszer **100 portot próbál meg** az alapértelmezett porttól kezdve. Ha mind a 100 port foglalt, akkor az alapértelmezett portot adja vissza (ez ritka eset).

**Javaslat**: Ha sok Docker konténered van, érdemes lehet:
- Külön port tartományokat használni a Docker konténerekhez és a game szerverekhez
- Például: Docker: 8000-8999, Game szerverek: 7000-7999

### 2. Erőforrás Korlátok

A rendszer **nem korlátozza** a Docker konténereket, csak figyeli őket. Ha nincs elég szabad erőforrás, akkor nem telepít új szervert.

**Javaslat**: 
- Monitorozd a gép erőforrásait (CPU, RAM, Disk)
- Ha szükséges, korlátozd a Docker konténerek erőforrás használatát (Docker resource limits)

### 3. Hálózat Konfiguráció

A game szerverek **közvetlenül a gép hálózatán** futnak (nem Docker konténerekben), ezért:
- Ugyanazt a hálózati interfészt használják
- Ugyanazokat a portokat használhatják (ha nincs konfliktus)
- A Docker hálózat konfigurációja nem befolyásolja őket

## 🔧 Konfiguráció

### Port Tartomány Beállítása (Jövőbeli Funkció)

Jelenleg a rendszer automatikusan választ portokat. Jövőbeli fejlesztésként lehetőség lesz port tartományok beállítására:

```typescript
// Példa (jövőbeli funkció)
const portRange = {
  min: 7000,
  max: 7999,
};
```

### Docker Resource Limits

Ha szeretnéd korlátozni a Docker konténerek erőforrás használatát:

```bash
# Docker konténer erőforrás korlátok
docker run --memory="2g" --cpus="2" your-image
```

Vagy `docker-compose.yml`-ben:

```yaml
services:
  your-service:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

## 📊 Monitoring

### Erőforrás Használat Ellenőrzése

```bash
# CPU és RAM használat
htop

# Port használat
ss -tuln | grep LISTEN

# Docker konténerek erőforrás használata
docker stats
```

### Admin Panelben

Az admin panelben a szervergép részletek oldalon láthatod:
- **Erőforrások**: CPU, RAM, Disk használat (Docker konténereket is tartalmazza)
- **Szerverek**: A rendszer által kezelt szerverek
- **Portok**: A használt portok listája

## ✅ Ellenőrző Lista

- [ ] Docker konténerek futnak a gépen
- [ ] A rendszer agent telepítve és működik
- [ ] Port ellenőrzés működik (SSH kapcsolat rendben)
- [ ] Erőforrás monitoring működik (CPU, RAM, Disk)
- [ ] Új szerver telepítéskor port konfliktus nincs
- [ ] Docker konténerek továbbra is működnek

## 🐛 Hibaelhárítás

### Port Konfliktus

**Probléma**: Új szerver nem indul, port foglalt hiba

**Megoldás**:
```bash
# Ellenőrizd, mi használja a portot
ss -tuln | grep ":PORT "

# Ha Docker konténer, nézd meg:
docker ps --format "table {{.Names}}\t{{.Ports}}"

# Ha szükséges, állítsd le vagy változtasd meg a Docker konténer portját
```

### Erőforrás Hiány

**Probléma**: Új szerver nem települ, nincs elég erőforrás

**Megoldás**:
```bash
# Ellenőrizd az erőforrás használatot
free -h
df -h
top

# Ha szükséges, állítsd le vagy korlátozd a Docker konténereket
docker stop container-name
# vagy
docker update --memory="1g" container-name
```

## 📝 Összefoglalás

✅ **A rendszer automatikusan kezeli a Docker konténerekkel való együttélést**
✅ **Port ellenőrzés figyelembe veszi a Docker konténereket**
✅ **Erőforrás monitoring tartalmazza a Docker konténerek használatát**
✅ **Nincs szükség külön konfigurációra**

A rendszer **biztonságosan működik együtt** a meglévő Docker konténerekkel, anélkül hogy azokat befolyásolná vagy megzavarná.

