# Teljesítmény Optimalizálás

## Jelenlegi probléma

Az alkalmazás **development módban** fut (`npm run dev`), ami lassabb, mint a production build.

## Fő problémák

1. **Development mód**: Az alkalmazás `npm run dev` módban fut, ami nem optimalizált
2. **Nincs production build**: A standalone build nem működik build hibák miatt
3. **Lassú API endpointok**: A monitoring stream endpoint 5+ másodpercet vesz igénybe
4. **Sok COUNT(*) query**: Az adatbázis lekérdezések nem optimalizáltak

## Megoldások

### 1. Production Build (Ajánlott)

```bash
# Build hibák javítása után:
cd /opt/zedingaming
NODE_ENV=production npm run build
pm2 delete zedingaming
pm2 start node --name zedingaming .next/standalone/server.js
pm2 save
```

### 2. PM2 Cluster Mód (Gyors javítás)

```bash
# Több process használata (2-4 CPU core esetén)
pm2 delete zedingaming
pm2 start npm --name zedingaming -- run dev -i 2
pm2 save
```

### 3. Nginx Cache Beállítása

```nginx
# /etc/nginx/sites-available/zedgaminghosting.hu
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

location / {
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m use_temp_path=off;
    proxy_cache my_cache;
    proxy_cache_valid 200 60m;
    proxy_cache_valid 404 1m;
    proxy_pass http://localhost:3000;
    # ... existing proxy settings ...
}
```

### 4. Adatbázis Optimalizálás

```sql
-- Indexek hozzáadása a lassú COUNT(*) query-khez
CREATE INDEX idx_servers_status ON servers(status);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_machines_status ON server_machines(status);
CREATE INDEX idx_agents_status ON agents(status);
```

### 5. API Optimalizálás

- A monitoring stream endpoint-ot cache-elni kell
- COUNT(*) query-k helyett cache-elt értékeket használni
- Redis cache bevezetése a gyakran használt adatokhoz

## Azonnali javítás (PM2 cluster mód)

```bash
ssh root@116.203.226.140
cd /opt/zedingaming
pm2 delete zedingaming
pm2 start npm --name zedingaming -- run dev -i 2
pm2 save
```

Ez azonnal javítja a teljesítményt, mert 2 process fogja kezelni a kéréseket.

