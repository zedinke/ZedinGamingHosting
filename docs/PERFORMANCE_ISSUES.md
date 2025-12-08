# Teljesítmény Problémák és Megoldások

## Jelenlegi probléma

Amikor egy gombra kattintasz, a processzor felhasználás megnő és lassú az oldal.

## Fő okok

1. **Development mód**: Az alkalmazás `npm run dev` módban fut
   - Nincs code splitting
   - Nincs minifikáció
   - Hot reload overhead
   - Source maps generálása
   - Minden változásnál újra kompilálás

2. **Next.js kompiláció**: Development módban minden kérésnél újra kompilál
   - Lassú első betöltés
   - Lassú navigáció
   - Magas CPU használat

3. **Nincs production build**: Build hibák miatt nem lehet production módban futtatni

## Azonnali megoldások

### 1. Next.js Config Optimalizálás (✅ Kész)

A `next.config.js` fájlban hozzáadtuk:
- `swcMinify: true` - SWC minifier (gyorsabb)
- `compress: true` - Gzip compression
- `poweredByHeader: false` - Header optimalizálás
- `productionBrowserSourceMaps: false` - Source maps kikapcsolása

### 2. Node.js Memória Optimalizálás (✅ Kész)

PM2-ben beállítottuk:
- `NODE_OPTIONS='--max-old-space-size=2048'` - 2GB memória limit

### 3. Production Build (Ajánlott)

A legjobb megoldás a production build, de build hibák miatt jelenleg nem működik.

**Build hibák javítása után:**
```bash
cd /opt/zedingaming
NODE_ENV=production npm run build
pm2 delete zedingaming
pm2 start node --name zedingaming .next/standalone/server.js
pm2 save
```

## További optimalizálások

### 1. React Komponens Optimalizálás

- `React.memo()` használata nagy komponenseknél
- `useMemo()` és `useCallback()` használata
- Lazy loading komponenseknél

### 2. Adatbázis Optimalizálás

- Indexek hozzáadása lassú query-khez
- Query cache-elés
- Connection pooling

### 3. Nginx Optimalizálás

- Static file cache
- Gzip compression
- Proxy cache

### 4. CDN Használata

- Statikus fájlok CDN-re helyezése
- Image optimization

## Monitoring

```bash
# CPU használat ellenőrzése
ps aux --sort=-%cpu | head -10

# PM2 monitoring
pm2 monit

# Next.js build idő mérése
time npm run build
```

## Jelenlegi állapot

- ✅ Next.js config optimalizálva
- ✅ Node.js memória limit beállítva
- ⚠️ Development módban fut (lassabb)
- ❌ Production build nem működik (build hibák)

## Következő lépések

1. Build hibák javítása
2. Production build készítése
3. Production módban futtatás
4. További optimalizálások alkalmazása

