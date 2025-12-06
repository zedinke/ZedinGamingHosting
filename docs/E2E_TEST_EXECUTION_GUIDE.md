# 🚀 E2E Test Végrehajtási Útmutató - ARK Order

**A követendő lépéseket sorba kell hajtani. Mindegyik után ellenőrizd az adott checkpointokat.**

---

## 📌 START: Environment Ready

### Előfeltételek (5 perc)
```powershell
# 1. Dev szerver fut-e? (3000-es porton)
npm run dev

# 2. Külön terminalban: Agent machine Docker check
# SSH-zásod a GameServer-1-re (192.168.x.x)
ssh user@gameserver-1
docker ps  # Biztosnak kell lenni, hogy docker fut

# 3. Database kapcsolat check (dev server console-ban)
# Keress ilyen sort: "Prisma connected successfully" vagy hasonlót
```

**✅ Checkpoint**:
- Dev server: `localhost:3000` elérhető
- Admin panel: `localhost:3000/admin` nyílva
- Agent machine: SSH kapcsolat OK, Docker fut
- Database: No connection errors

---

## 📍 PHASE 1: Admin Panel - Order Készítés (10 perc)

### 1️⃣ Admin Panel Megnyitása
```
1. Nyiss meg egy böngészőt
2. Navigálj: http://localhost:3000/admin
3. Login: admin@zedin.hu / [jelszó]
4. Várj 2 másodpercet, amíg az oldal betöltődik
```

**✅ Ellenőrzés**:
- Admin dashboard látható
- Nincs 500-as hiba
- Sidebar műküdik: "Orders", "Servers", "Payments" menüpontok

### 2️⃣ Új Order Létrehozása
```
Sidebar: Orders → [Create Order] vagy [New Order] gomb

Kitöltés:
├─ Customer: "Test Customer" (vagy new: "TestUser20251206@test.com")
├─ Game: "ARK Ascended" (dropdown)
├─ Machine: "GameServer-1" (vagy mely agent van online)
├─ Max Players: 70
├─ Port: Hagyj üresen (auto-alloc)
├─ World: "TheIsland"
├─ Difficulty: 4.0 (Medium)
├─ Duration: 1 Month
└─ Payment Method: Stripe Test Card
```

**✅ Ellenőrzés** (submitting után):
- Order ID megjelenik (pl: ORD-2025-12345)
- Status megjelenik: `PENDING_PAYMENT`
- Fizetési form nyílva

### 3️⃣ Order ID Megjegyzés
```
Fontos! Jegyezd meg az Order ID-t (ORD-2025-12345), 
mert később több helyen kell használni:
- Database query-k
- Log keresés
- Container neve
```

---

## 💳 PHASE 2: Fizetés Feldolgozása (5 perc)

### 4️⃣ Stripe Test Kártya Adatok
```
Fizetési formban add meg:

Kártya száma:    4242 4242 4242 4242
Lejárat:         12/25 (vagy bármilyen jövőbeli dátum)
CVC:             123 (vagy bármilyen 3 számjegy)
Név:             Test User
Irányítószám:    12345

Majd kattints: "Pay $9.99"
```

**⏱️ Várj 5-10 másodpercet**

**✅ Ellenőrzés** (letöltés után):
- Success page megjelenik
- Order ID ismét látható
- "Payment successful" üzenet
- Redirect `localhost:3000/orders/[ORDER_ID]`

### 5️⃣ Dev Server Console Ellenőrzés
```
Nézd meg a dev server termináljában:
- Keress: "[WEBHOOK]" szöveget
- Kellene valami ilyen:

[WEBHOOK] 2025-12-06T14:23:45.123Z Stripe payment_intent.succeeded
[WEBHOOK] Order: ORD-2025-12345
[WEBHOOK] Amount: 999 (USD 9.99)
[WEBHOOK] Status: SUCCESS - Routing to auto-install

Ha látsz ilyet: ✅ Webhook feldolgozva
Ha NEM: ❌ Webhook nem érkezett - STOP, debug
```

---

## ⚙️ PHASE 3: Installation Kezdete (30 sec)

### 6️⃣ Order Status Check (Admin Panel)
```
Admin Panel: Orders → [ORD-2025-12345] Kattints

Ellenőrzés:
├─ Status: "PENDING_PAYMENT" → "CONFIRMED" → "PROVISIONING"
│  (ezek között váltson át 2-5 másodperc alatt)
├─ Logs tab: 
│  Jól nézz ki a logok?
│  Vannak-e hibák?
└─ Expected első logok:
   [INSTALL] ARK Ascended installer selected
   [PORT_ALLOC] Allocating 6 ports for ARK_ASCENDED
   [PORT_ALLOC] Game port: 7777
   [PORT_ALLOC] Query port: 27015
   ... stb
```

**✅ Ellenőrzés**:
- Status transitioned: PENDING_PAYMENT → CONFIRMED
- Logs jelennek meg
- Nincs "[ERROR]" vagy "[FAILED]" szöveg az első 10 logban

---

## 📦 PHASE 4: Installation Monitoring (3-5 perc)

### 7️⃣ Provisioning Logs Követése
```
Admin Panel: Orders → [ORD-2025-12345] → Logs tab

Várj az alábbi logokra (ez lehet 2-5 perc):

1. [INSTALL] ARK Ascended installer selected (azonnal)
2. [PORT_ALLOC] Allocating 6 ports (2 sec)
3. [DOCKER] Building docker-compose (5 sec)
4. [DOCKER] Creating container: ark-ascended-ORD-2025-12345 (5 sec)
5. [DOCKER] Container starting... (10 sec)
6. [HEALTH_CHECK] Checking ARK health (attempt 1/10) (múlhat 2-3 percig)
7. [INSTALL_COMPLETE] Server status: ONLINE (amikor sikerül)
```

**⏱️ Checkpoint Időpontok**:
- Port alloc: <2 sec után
- Docker image pull: 30-120 sec (nagyobb fájl)
- Container startup: 60-180 sec
- Health check: 2-10 attempt között kell sikerülnie

### 8️⃣ Docker Container ellenőrzése (Agent gépen)
```
SSH: gameserver-1

# Nézd meg fut-e a container:
docker ps | grep ark-ascended-ORD-2025-12345

# Kellene ilyet megmutatni:
# CONTAINER ID   IMAGE                              STATUS         PORTS
# abc123...      zedin-gaming/ark-ascended:latest   Up 2 minutes   0.0.0.0:7777->7777/tcp

# Ha "Exited" státusza van: ❌ HIBA
# Ha "Up" igen: ✅ Jó

# Container logok megtekintése (max utolsó 50 sor):
docker logs ark-ascended-ORD-2025-12345 --tail 50 -f

# Várj egy pillanatra, keress ilyen szövegeket:
# "Server ready"
# "ARK running"
# "Listening on port 7777"

# Kilépéshez: Ctrl+C
```

**✅ Ellenőrzés**:
- Container: `Up X minutes` (nem Exited)
- Restart count: 0 (nem restartolt)
- Logok: Nincs "[ERROR]" vagy "fatal"

---

## ✅ PHASE 5: Final Verification (2 perc)

### 9️⃣ Admin Panel - Server Status
```
Admin Panel: Servers (vagy Sidebar: Servers)

Keress az order-edhez tartozó szerverre:
├─ Név: "ARK Ascended (ORD-2025-12345)"
├─ Status: 🟢 GREEN (ONLINE)
├─ Players: 0/70
├─ Uptime: X minutes/seconds
└─ Ports: 7777, 27015, 32330 (jelenjenek meg)

Ha zöld: ✅ SIKERES
Ha piros vagy sárga: ⚠️ WARNING - de előfordulhat startup közben
```

### 🔟 Port Availability Check
```
Dev gépen (saját машине):

# PowerShell:
Test-NetConnection -ComputerName 192.168.x.x -Port 7777  # Replace X.x
# Expected: "TCPTestSucceeded : True"

# Vagy telnet:
telnet 192.168.x.x 7777
# Expected: Connect sikerült, majd Ctrl+] + Quit

Ha sikeres: ✅ Port nyitva
Ha timeout: ❌ Port nem elérhető - firewall probléma?
```

### 1️⃣1️⃣ Database Final Check
```
Egy SQL tool-ban (SQL Server Management Studio, DataGrip, stb):

-- Order ellenőrzés:
SELECT id, status, created_at, paid_at 
FROM "Order" WHERE id = 'ORD-2025-12345';

-- Kellene: Status = 'ACTIVE' (vagy 'PROVISIONING' még)
-- paid_at: nem NULL

-- GameServer ellenőrzés:
SELECT id, status, ports, health_status, started_at 
FROM "GameServer" WHERE order_id = 'ORD-2025-12345';

-- Kellene: Status = 'ONLINE', health_status = 'HEALTHY'

-- Payment ellenőrzés:
SELECT id, status, amount, created_at 
FROM "PaymentTransaction" WHERE order_id = 'ORD-2025-12345';

-- Kellene: Status = 'COMPLETED', amount = 999 (cents)
```

---

## 📊 RESULT: Eredmény Rögzítése

### Test Sikeres Ha:
✅ Order status: `ACTIVE` vagy `PROVISIONING`  
✅ GameServer status: `ONLINE`  
✅ Health check: `HEALTHY`  
✅ Docker container: Running  
✅ Ports: 7777, 27015, 32330 nyitva  
✅ Payment: `COMPLETED`  
✅ Total time: <5 perc  

### Test Sikertelen Ha:
❌ Server status: `ERROR` vagy `FAILED`  
❌ Container: `Exited`  
❌ Health check: >10 failed attempt  
❌ Ports: Nem nyitva/elérhető  
❌ Installation time: >10 perc  

---

## 🔴 Emergency Troubleshooting

### Ha Order nem mozdul PENDING_PAYMENT-ből:
```
1. Webhook nem érkezett:
   - Stripe dashboard: Webhooks tab - nézz meg recent events
   - Dev server console: van-e "[WEBHOOK]" log?
   
2. Webhook URL hiba:
   - localhost:3000/api/webhooks/stripe
   - Ez a dev közön nem elérhető kívülről (ngrok kell vagy publikus URL)
   - Ha lokális teszt: Stripe test mode CLI / webhook forwarder

3. Gyors fix: Manual trigger
   - Find: app/api/webhooks/stripe/route.ts
   - Create: test request az adott order-hez
```

### Ha Container Exited:
```
1. Nézd meg a container logot:
   docker logs ark-ascended-ORD-2025-12345 --tail 100

2. Tipikus hibák:
   - Image pull failed: docker pull zedin-gaming/ark-ascended:latest
   - Port már foglalt: lsof -i :7777
   - Nincs elég RAM: docker inspect ark-ascended-ORD-2025-12345

3. Restart:
   docker rm ark-ascended-ORD-2025-12345 (force remove)
   Majd: Admin Panel-en kattints "Retry Installation"
```

### Ha Health Check Sikertelen:
```
1. Container fut? docker ps | grep ark
2. Port figyel? netstat -an | grep 7777
3. Firewall? iptables -L -n | grep 7777 (Linux) vagy Windows Defender
4. Container startup timeout? Nézd meg a game startup logot.
5. Restart container: docker restart ark-ascended-ORD-2025-12345
```

---

## 📝 Quick Notes Template

```
Test Date: 2025-12-06
Order ID: ORD-2025-12345
Machine: GameServer-1
Game: ARK Ascended

[Jelöld be az eredményt]
[ ] PASSED - All phases completed, server ONLINE
[ ] FAILED - [describe issue]

Timings:
- Order Creation: ___ sec
- Payment Processing: ___ sec
- Total Installation: ___ sec

Issues:
1. ___
2. ___

Next Steps:
- [ ] Test Minecraft installer
- [ ] Test Rust installer
- [ ] Test Satisfactory installer
- [ ] Repeat with multiple concurrent orders
```

---

## ✨ Pro Tips

1. **Concurrent Testing**: A 4 installer teszteléshez ne egymás után, hanem párhuzamosan?
   - Create 4 orders (1 ARK, 1 Minecraft, 1 Rust, 1 Satisfactory)
   - Monitor ugyanakkor (4 Docker container parallel startup)
   - Ellenőrizz port conflicts

2. **Automated Testing**: Ez a checklist könnyen konvertálható Jest/Playwright tesztre:
   - Playwright: Browser automation (Admin Panel navigation)
   - Jest: API testing (Order creation, payment webhook)
   - Docker API: Container monitoring

3. **Performance Baseline**: Jegyezd meg az időpontokat, hogy később összehasonlíthasd:
   - Installation time kovarianciája: (machine spec) vs (game complexity)
   - Bottleneck analízis: Image pull? Container startup? Health check?

4. **Rollback Plan**: Ha hiba: 
   ```sql
   -- Clean up test order:
   DELETE FROM "PaymentTransaction" WHERE order_id = 'ORD-2025-12345';
   DELETE FROM "GameServer" WHERE order_id = 'ORD-2025-12345';
   DELETE FROM "Order" WHERE id = 'ORD-2025-12345';
   ```

---

**Go! 🚀 Enjoy az E2E tesztelést! Ezután unit tesztek jönnek.**
