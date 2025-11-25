# Cron Job Beállítás

Ez a dokumentáció leírja, hogyan állítsd be a cron job-okat a rendszer automatikus feldolgozásához.

## Szükséges Cron Job-ok

### 1. Task Feldolgozás (5 percenként)

Ez a cron job feldolgozza a várakozó feladatokat.

**Opció 1: Node.js script használata**

```bash
# Cron beállítás
crontab -e

# Add hozzá ezt a sort (5 percenként futtatja)
*/5 * * * * cd /path/to/project && node scripts/process-tasks.js >> /var/log/zedingaming-tasks.log 2>&1
```

**Opció 2: API endpoint hívása (ha van CRON_SECRET beállítva)**

```bash
# Cron beállítás
crontab -e

# Add hozzá ezt a sort
*/5 * * * * curl -X POST http://localhost:3000/api/admin/system/cron -H "Authorization: Bearer YOUR_CRON_SECRET" >> /var/log/zedingaming-cron.log 2>&1
```

### 2. Offline Agentek Ellenőrzése (1 percenként)

Ez a cron job ellenőrzi az offline agenteket.

```bash
# Cron beállítás
crontab -e

# Add hozzá ezt a sort
* * * * * cd /path/to/project && node scripts/process-tasks.js >> /var/log/zedingaming-agents.log 2>&1
```

(A `process-tasks.js` script már tartalmazza az offline agentek ellenőrzését)

## Környezeti Változók

Ha API endpoint-ot használsz, add hozzá a `.env` fájlhoz:

```env
CRON_SECRET=your-secret-key-here
```

## Log Fájlok

A cron job-ok log fájlokat hoznak létre:
- `/var/log/zedingaming-tasks.log` - Task feldolgozás logok
- `/var/log/zedingaming-agents.log` - Agent ellenőrzés logok

## Ellenőrzés

```bash
# Cron job-ok listája
crontab -l

# Log fájlok megtekintése
tail -f /var/log/zedingaming-tasks.log
tail -f /var/log/zedingaming-agents.log
```

## Hibaelhárítás

Ha a cron job-ok nem futnak:

1. **Ellenőrizd a cron szolgáltatást:**
   ```bash
   systemctl status cron
   # vagy
   systemctl status crond
   ```

2. **Ellenőrizd a log fájlokat:**
   ```bash
   tail -f /var/log/zedingaming-tasks.log
   ```

3. **Teszteld a scriptet manuálisan:**
   ```bash
   cd /path/to/project
   node scripts/process-tasks.js
   ```

4. **Ellenőrizd az útvonalakat:**
   - A cron job-oknak abszolút útvonalakat kell használniuk
   - A `node` parancs teljes útvonala: `which node`

## PM2 Cron Alternatíva

Ha PM2-t használsz, használhatod a PM2 cron funkcióját is:

```bash
# PM2 cron telepítése
pm2 install pm2-cron

# Cron job hozzáadása
pm2 cron "*/5 * * * * node /path/to/scripts/process-tasks.js"
```

