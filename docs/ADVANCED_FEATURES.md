# Fejlett Funkciók Dokumentáció

Ez a dokumentum leírja a rendszer fejlett funkcióit, amelyek a teljesítmény, biztonság és karbantarthatóság javítására szolgálnak.

## 1. Error Handling Rendszer

### Áttekintés
Központi hibakezelő rendszer, amely strukturált hibakezelést biztosít az egész alkalmazásban.

### Használat

```typescript
import { AppError, ErrorCodes, handleApiError } from '@/lib/error-handler';

// Hiba létrehozása
throw new AppError(
  ErrorCodes.NOT_FOUND,
  'Szerver nem található',
  404,
  { serverId: '123' }
);

// API route-ban
export async function GET(request: NextRequest) {
  try {
    // ... kód
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Hibakódok
- `UNAUTHORIZED` - Nincs jogosultság
- `NOT_FOUND` - Erőforrás nem található
- `VALIDATION_ERROR` - Validációs hiba
- `SERVER_NOT_FOUND` - Szerver nem található
- `AGENT_OFFLINE` - Agent offline
- `BACKUP_FAILED` - Backup sikertelen
- `RATE_LIMIT_EXCEEDED` - Rate limit túllépve

## 2. Performance Monitoring

### Áttekintés
Teljesítmény metrikák gyűjtése és elemzése API endpointokhoz.

### Használat

```typescript
import { withPerformanceMonitoring } from '@/lib/performance-monitor';

export const GET = withPerformanceMonitoring(
  async (request: NextRequest) => {
    // ... kód
  },
  '/api/servers',
  'GET'
);
```

### Metrikák
- Átlagos válaszidő
- Leglassabb endpointok
- Hibaarány
- Request számláló

### Admin API
- `GET /api/admin/system/performance` - Performance metrikák lekérdezése

## 3. Cache Rendszer

### Áttekintés
In-memory cache rendszer gyors adateléréshez.

### Használat

```typescript
import { cache, withCache } from '@/lib/cache';

// Egyszerű használat
cache.set('key', value, 60000); // 60 másodperc TTL
const value = cache.get('key');

// Async wrapper
const data = await withCache(
  'cache-key',
  async () => {
    // Lassú művelet
    return await fetchData();
  },
  300000 // 5 perc TTL
);
```

### Admin API
- `GET /api/admin/system/cache` - Cache statisztikák
- `DELETE /api/admin/system/cache` - Cache törlése

## 4. Security Utilities

### Áttekintés
Biztonsági segédfüggvények validációhoz és védelemhez.

### Funkciók

```typescript
import {
  generateSecureToken,
  hashString,
  isValidEmail,
  isValidIP,
  sanitizeInput,
  escapeHtml,
  checkPasswordStrength,
} from '@/lib/security';

// Token generálás
const token = generateSecureToken(32);

// Hash generálás
const hash = hashString('input');

// Validáció
if (!isValidEmail(email)) {
  throw new Error('Érvénytelen email');
}

// Jelszó erősség
const strength = checkPasswordStrength(password);
if (!strength.strong) {
  console.log(strength.feedback);
}
```

## 5. Logger Rendszer

### Áttekintés
Strukturált logging rendszer különböző log szintekkel.

### Használat

```typescript
import { logger, LogLevel } from '@/lib/logger';

logger.debug('Debug üzenet', { context: 'data' });
logger.info('Info üzenet', { userId: '123' });
logger.warn('Warning üzenet');
logger.error('Error üzenet', error, { context: 'data' });

// Log szint beállítása
logger.setMinLevel(LogLevel.DEBUG);
```

### Log Szintek
- `DEBUG` - Részletes debug információk
- `INFO` - Általános információk
- `WARN` - Figyelmeztetések
- `ERROR` - Hibák

## 6. Backup Storage (S3/FTP)

### Lazy Loading
Az AWS SDK és basic-ftp modulok lazy loading-gel vannak implementálva, így nem kell telepíteni őket, ha nem használod.

### S3 Használat
1. Telepítsd: `npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`
2. Állítsd be a környezeti változókat:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION`
   - `AWS_S3_BUCKET`

### FTP Használat
1. Telepítsd: `npm install basic-ftp`
2. Állítsd be a környezeti változókat:
   - `FTP_HOST`
   - `FTP_USER`
   - `FTP_PASSWORD`
   - `FTP_PORT` (opcionális, alapértelmezett: 21)
   - `FTP_SECURE` (opcionális, true/false)

### Admin Beállítások
Az admin felületen (`/admin/settings`) beállíthatod a backup storage típusát:
- Lokális tárolás
- Amazon S3
- FTP/SFTP

## Best Practices

### 1. Error Handling
- Mindig használd az `AppError` osztályt strukturált hibákhoz
- API route-okban használd a `handleApiError` függvényt
- Ne dobjál generikus `Error` objektumokat

### 2. Performance
- Használd a `withPerformanceMonitoring` wrapper-t kritikus endpointokhoz
- Monitorozd a lassú endpointokat rendszeresen
- Optimalizáld a lassú műveleteket

### 3. Cache
- Használd a cache-t gyakran lekérdezett adatokhoz
- Állíts be megfelelő TTL értékeket
- Ne cache-elj érzékeny adatokat

### 4. Security
- Mindig validáld a felhasználói inputot
- Használd a `sanitizeInput` függvényt SQL injection ellen
- Használd a `escapeHtml` függvényt XSS ellen
- Ellenőrizd a jelszó erősségét

### 5. Logging
- Használd a megfelelő log szintet
- Ne logolj érzékeny adatokat (jelszavak, API kulcsok)
- Használd a context objektumot részletes információkhoz

## Monitoring és Debugging

### Performance Metrikák
- Admin felületen: `/admin/system/performance`
- API: `GET /api/admin/system/performance`

### Cache Statisztikák
- Admin felületen: `/admin/system/cache`
- API: `GET /api/admin/system/cache`

### Logok
A logok automatikusan a konzolra íródnak. Production környezetben érdemes egy külső log aggregátort használni (pl. ELK stack, Datadog).

## Következő Lépések

1. **Redis Cache**: Jelenleg in-memory cache van, érdemes Redis-re migrálni production környezetben
2. **Structured Logging**: JSON formátumú logok külső szolgáltatásokhoz
3. **APM Integration**: Application Performance Monitoring integráció (pl. New Relic, Datadog)
4. **Error Tracking**: Sentry vagy hasonló error tracking szolgáltatás integrálása

