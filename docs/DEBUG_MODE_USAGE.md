# Debug Mód Használati Útmutató

## Áttekintés

A debug mód egy átfogó logging rendszer, amely lehetővé teszi, hogy minden műveletet és hibát logoljunk, amikor be van kapcsolva. Ez segít a hibakeresésben és a rendszer működésének megértésében.

## Funkciók

- ✅ Debug mód be/kikapcsolása az admin felületen
- ✅ Minden művelet automatikus logolása
- ✅ Logok megtekintése az admin felületen
- ✅ Logok szűrése szint szerint (info, warn, error, debug)
- ✅ Logok letöltése
- ✅ Logok törlése

## Használat

### 1. Debug mód bekapcsolása

1. Menj az Admin Panel → Debug oldalra
2. Kattints a "Bekapcsolás" gombra
3. Most már minden művelet logolva lesz

### 2. DebugLogger használata a kódban

```typescript
import { DebugLogger, getRequestContext } from '@/lib/debug';

// API route-ban
export async function POST(request: NextRequest) {
  const context = getRequestContext(request);
  const session = await getServerSession(authOptions);
  
  // Info log
  await DebugLogger.info(
    'API',
    'User login attempt',
    { email: session?.user?.email },
    { ...context, userId: session?.user?.id }
  );
  
  // Warning log
  await DebugLogger.warn(
    'API',
    'Invalid request data',
    { body: request.body },
    context
  );
  
  // Error log
  try {
    // some operation
  } catch (error) {
    await DebugLogger.error(
      'API',
      'Operation failed',
      { error: error.message, stack: error.stack },
      { ...context, userId: session?.user?.id }
    );
  }
  
  // Debug log (részletes információk)
  await DebugLogger.debug(
    'API',
    'Processing request',
    { 
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers)
    },
    context
  );
}
```

### 3. Logok megtekintése

1. Menj az Admin Panel → Debug oldalra
2. A "Debug Logok" szekcióban láthatod az összes logot
3. Szűrheted szint szerint (Összes, Csak hibák, stb.)
4. Kattints a "Frissítés" gombra az új logok betöltéséhez

### 4. Logok letöltése

1. A Debug oldalon kattints a "Letöltés" gombra
2. A logok egy szöveges fájlban lesznek letöltve

### 5. Logok törlése

1. A Debug oldalon kattints a "Törlés" gombra
2. Megerősítés után az összes log törlődik

## Log Szintek

- **INFO**: Általános információk, műveletek
- **WARN**: Figyelmeztetések, nem kritikus hibák
- **ERROR**: Hibák, kivételek
- **DEBUG**: Részletes debug információk

## Log Formátum

Minden log tartalmazza:
- **Timestamp**: A log időpontja
- **Level**: A log szintje
- **Category**: A log kategóriája (pl. "API", "Database", "Auth")
- **Message**: A log üzenete
- **Data**: További adatok (opcionális)
- **UserId**: A felhasználó ID-ja (ha elérhető)
- **IP**: A kérés IP címe
- **UserAgent**: A böngésző user agent string

## Log Fájlok

A logok a `logs/debug/` könyvtárban vannak tárolva, naponta egy fájl:
- `debug-2024-01-15.log`
- `debug-2024-01-16.log`
- stb.

## Best Practices

1. **Használj kategóriákat**: Mindig adj meg egy kategóriát (pl. "API", "Database", "Auth")
2. **Logolj kontextust**: Adj meg userId, IP, stb. információkat
3. **Ne logolj érzékeny adatokat**: Ne logolj jelszavakat, API kulcsokat, stb.
4. **Használj megfelelő szinteket**: 
   - INFO: Normál műveletek
   - WARN: Figyelmeztetések
   - ERROR: Hibák
   - DEBUG: Részletes információk
5. **Kapcsold ki production-ben**: A debug módot csak fejlesztés/hibakeresés során kapcsold be

## Példa: API Route-ban

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { DebugLogger, getRequestContext } from '@/lib/debug';

export async function POST(request: NextRequest) {
  const context = getRequestContext(request);
  
  await DebugLogger.debug('API', 'POST request received', {
    url: request.url,
    method: request.method
  }, context);
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      await DebugLogger.warn('API', 'Unauthorized request', {}, context);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await DebugLogger.info('API', 'Processing request', {
      userId: (session.user as any).id
    }, { ...context, userId: (session.user as any).id });
    
    // ... művelet ...
    
    await DebugLogger.info('API', 'Request completed successfully', {}, context);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    await DebugLogger.error('API', 'Request failed', {
      error: error.message,
      stack: error.stack
    }, context);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Példa: Database műveleteknél

```typescript
import { DebugLogger } from '@/lib/debug';
import { prisma } from '@/lib/prisma';

export async function createUser(data: any) {
  await DebugLogger.debug('Database', 'Creating user', { email: data.email });
  
  try {
    const user = await prisma.user.create({ data });
    
    await DebugLogger.info('Database', 'User created', { userId: user.id });
    
    return user;
  } catch (error: any) {
    await DebugLogger.error('Database', 'Failed to create user', {
      error: error.message,
      data: { email: data.email }
    });
    
    throw error;
  }
}
```

