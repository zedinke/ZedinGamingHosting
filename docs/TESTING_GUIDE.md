# Tesztelési Útmutató

## Port Manager Tesztelés

### Lokális tesztelés (ha van .env fájl)

```bash
npm run test:port-manager
```

### Webszerveren tesztelés

```bash
# SSH kapcsolódás
ssh -i ~/.ssh/webserver_key root@116.203.226.140

# Projekt könyvtár
cd /opt/zedingaming

# Port Manager teszt
npm run test:port-manager
```

### Várható eredmény

- ✅ Teszt gép található
- ✅ Portok allokálva
- ✅ Port elérhetőség ellenőrzés
- ✅ Port felszabadítás
- ✅ Konfliktus teszt
- ✅ Több port allokáció

## Template Deployment Tesztelés

### Előfeltételek

1. **7 Days to Die template készítése:**
   ```bash
   # GameServer-1-en
   cd /opt/zedingaming
   bash scripts/build-7days-template.sh
   ```

2. **Template feltöltése Google Drive-ra:**
   - Töltsd fel a `/tmp/game_templates/7days2die-template-v1.0.tar.gz` fájlt
   - Jegyezd meg a fileId-t
   - Állítsd be a `lib/game-templates/models/templates.ts`-ben:
     ```typescript
     gdrive: {
       fileId: 'YOUR_FILE_ID_HERE',
       fileName: '7days2die-template-v1.0.tar.gz',
       sizeGb: 20,
     }
     ```

3. **Google Drive API kulcs beállítása:**
   ```bash
   # .env fájlban
   GOOGLE_DRIVE_API_KEY=your_api_key_here
   GOOGLE_DRIVE_FOLDER_ID=your_folder_id_here
   ```

### Webszerveren tesztelés

```bash
# SSH kapcsolódás
ssh -i ~/.ssh/webserver_key root@116.203.226.140

# Projekt könyvtár
cd /opt/zedingaming

# Template deployment teszt
npm run test:template-deployment
```

### Várható eredmény

- ✅ Template információ ellenőrzés
- ✅ Teszt szerver létrehozása
- ✅ Template deployment (letöltés, kibontás, konfiguráció, container indítás)

## Manuális Tesztelés

### 1. Port Allokáció Manuális Teszt

```typescript
import { PortManager } from '@/lib/port-manager';
import { prisma } from '@/lib/prisma';

// Teszt gép ID
const machineId = 'your-machine-id';

// Port allokáció
const ports = await PortManager.allocatePorts(
  machineId,
  'SEVEN_DAYS_TO_DIE',
  'test-server-id'
);

console.log('Allocated ports:', ports);

// Port felszabadítás
await PortManager.deallocatePorts('test-server-id');
```

### 2. Template Letöltés Manuális Teszt

```typescript
import { TemplateManager } from '@/lib/game-templates/services/template-manager';
import { getTemplate } from '@/lib/game-templates/models/templates';
import { GameTemplateType } from '@/lib/game-templates/types';

const template = getTemplate(GameTemplateType.SEVEN_DAYS_TO_DIE);

// Template letöltés
await TemplateManager.downloadTemplate(
  template.gdrive,
  '/tmp/test-template.tar.gz',
  (loaded, total) => {
    console.log(`Progress: ${(loaded / total * 100).toFixed(2)}%`);
  }
);

// Template kibontás
await TemplateManager.extractTemplate(
  '/tmp/test-template.tar.gz',
  '/tmp/test-extract'
);
```

### 3. Container Indítás Manuális Teszt

```bash
# GameServer-1-en
docker run -d \
  --name test-7dtd \
  --restart unless-stopped \
  -v /opt/servers/test/server:/opt/7days2die \
  -p 26900:26900/udp \
  -p 8081:8081/tcp \
  -p 8080:8080/tcp \
  7days2die:latest

# Container logok
docker logs test-7dtd

# Container státusz
docker ps | grep test-7dtd

# Container leállítás
docker stop test-7dtd
docker rm test-7dtd
```

## Hibaelhárítás

### Port allokáció sikertelen

**Hiba:** `No available ports found`

**Megoldás:**
1. Ellenőrizd a port tartományt a `lib/port-manager.ts`-ben
2. Ellenőrizd az adatbázisban a foglalt portokat
3. Növeld a port tartományt, ha szükséges

### Template letöltés sikertelen

**Hiba:** `Template download failed`

**Megoldás:**
1. Ellenőrizd a `GOOGLE_DRIVE_API_KEY` beállítását
2. Ellenőrizd a template `fileId`-t
3. Ellenőrizd a hálózati kapcsolatot
4. Ellenőrizd, hogy a fájl publikus-e vagy van-e hozzáférésed

### Container indítás sikertelen

**Hiba:** `Container start failed`

**Megoldás:**
1. Ellenőrizd a Docker image létezését: `docker images`
2. Ellenőrizd a port binding-okat: `docker ps`
3. Nézd meg a container logokat: `docker logs container-name`
4. Ellenőrizd a volume mount-okat: `ls -la /opt/servers/test/server`

## Következő Lépések

1. ✅ Port Manager tesztelés
2. ✅ Template letöltés teszt
3. ✅ Container indítás teszt
4. ⏳ Szerver kapcsolódás teszt (7 Days to Die játékból)

