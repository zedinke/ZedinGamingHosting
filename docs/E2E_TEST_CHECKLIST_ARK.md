# 🧪 E2E Test Checklist - ARK Ascended Order Workflow

**Test Date**: 2025-12-06  
**Test Scope**: Full payment → auto-install → server provisioning lifecycle  
**Expected Duration**: 20-30 minutes  

---

## 📋 Pre-Test Verification

### 1.1 Environment Check ✅
- [ ] Dev server running: `npm run dev` (localhost:3000)
- [ ] Database connected: Check console for DB errors
- [ ] Agent machine reachable: GameServer-1 (192.168.x.x)
- [ ] Docker running on agent: `docker ps` should show containers
- [ ] PortManager initialized: No port conflicts
- [ ] DebugLogger initialized: Console shows startup logs

### 1.2 Admin Panel Access ✅
- [ ] Navigate to: `http://localhost:3000/admin`
- [ ] Login credentials: admin@zedin.hu / [password]
- [ ] Dashboard loads: No 404/500 errors
- [ ] Sidebar visible: "Orders", "Servers", "Payments", "Logs"
- [ ] Permission check: User has ADMIN role in DB

### 1.3 Database Pre-Check ✅
```sql
-- Verify test environment
SELECT COUNT(*) FROM "Order" WHERE status = 'PENDING';
SELECT COUNT(*) FROM "GameServer" WHERE status = 'PROVISIONING';
SELECT COUNT(*) FROM "PaymentTransaction" WHERE status = 'PENDING';
```
- [ ] No leftover PENDING orders
- [ ] No stuck PROVISIONING servers
- [ ] Clean payment transaction list

---

## 🎮 Phase 1: Order Creation

### 2.1 Create New ARK Order (Manual)
- [ ] Navigate: Admin Panel → Orders → Create New Order
- [ ] **Order Details**:
  - Customer: Test Customer or New Customer
  - Game: ARK Ascended
  - Machine: GameServer-1 (or available agent)
  - Max Players: 70
  - Port: Leave empty (auto-allocate)
  - World: TheIsland (or Ragnarok)
  - Difficulty: Medium (4.0)
- [ ] **Billing**:
  - Duration: 1 Month
  - Base Price: USD 9.99/month
  - Discount: 0%
  - Total: USD 9.99
- [ ] Payment Method: Stripe Test Card
- [ ] Click: "Create Order & Proceed to Payment"

**Expected State**:
- ✅ Order created with status: `PENDING_PAYMENT`
- ✅ Order ID displayed (e.g., ORD-2025-12345)
- ✅ Payment form appears
- ✅ Logs show: `[ORDER] Order created: ORD-2025-12345`

### 2.2 Verify Order in Database
```sql
SELECT id, status, game_type, customer_id, machine_id, config FROM "Order" 
WHERE id = 'ORD-2025-12345' LIMIT 1;
```
- [ ] Status: `PENDING_PAYMENT`
- [ ] game_type: `ARK_ASCENDED`
- [ ] machine_id: matches selected machine
- [ ] config: contains maxPlayers, worldName, difficulty

---

## 💳 Phase 2: Payment Processing

### 3.1 Stripe Test Payment (UI)
- [ ] Card Number: `4242 4242 4242 4242` (Stripe test)
- [ ] Expiry: Any future date (e.g., 12/25)
- [ ] CVC: Any 3 digits (e.g., 123)
- [ ] Billing Name: Test User
- [ ] Click: "Pay $9.99"

**Expected State**:
- ✅ Payment processing spinner shown
- ✅ Page redirects to success page
- ✅ Confirmation message: "Payment successful"
- ✅ Order ID displayed

### 3.2 Webhook Verification (Backend Logs)
- [ ] Check server logs for webhook event: `[WEBHOOK] Stripe payment.intent.succeeded received`
- [ ] Log shows: Order ID, amount, currency, status
- [ ] No webhook retry logs (indicates success on first try)
- [ ] Timestamp within seconds of UI payment

**Expected Log Output**:
```
[WEBHOOK] 2025-12-06T14:23:45.123Z Stripe payment_intent.succeeded
[WEBHOOK] Order: ORD-2025-12345
[WEBHOOK] Amount: 999 (USD 9.99)
[WEBHOOK] Status: SUCCESS - Routing to auto-install
```

### 3.3 Payment Record in Database
```sql
SELECT id, order_id, status, amount, method, created_at FROM "PaymentTransaction"
WHERE order_id = 'ORD-2025-12345';
```
- [ ] Status: `COMPLETED`
- [ ] Amount: 999 (cents)
- [ ] Method: `STRIPE`
- [ ] created_at: Recent timestamp

---

## ⚙️ Phase 3: Auto-Install Trigger

### 4.1 Order Status Transition
```sql
SELECT id, status, updated_at FROM "Order" WHERE id = 'ORD-2025-12345';
```
- [ ] Status transitioned from `PENDING_PAYMENT` → `CONFIRMED`
- [ ] updated_at: Recent timestamp (within 5 seconds of payment)

**Expected Timeline**:
1. `PENDING_PAYMENT` (2.1 - Order Created)
2. `PENDING_PAYMENT` (3.1 - Payment UI waiting)
3. `CONFIRMED` (3.2 - Webhook received, auto-install triggered)
4. `PROVISIONING` (4.2 - Installer started)

### 4.2 Server Provisioning Started
```sql
SELECT id, order_id, status, machine_id, config FROM "GameServer"
WHERE order_id = 'ORD-2025-12345';
```
- [ ] GameServer record created
- [ ] Status: `PROVISIONING`
- [ ] machine_id: Matches Order
- [ ] config: Contains all ARK settings (maxPlayers: 70, worldName, etc.)

**Expected State**:
- ✅ New GameServer entry in DB
- ✅ Port allocated (check PortManager logs)
- ✅ Docker container starting on agent

---

## 📦 Phase 4: Installation Progress

### 5.1 Check Provisioning Logs
**Admin Panel Path**: Orders → [ORD-2025-12345] → Logs

Expected log sequence:
1. `[INSTALL] ARK Ascended installer selected`
2. `[PORT_ALLOC] Allocating 6 ports for ARK_ASCENDED`
3. `[PORT_ALLOC] Game port: 7777`
4. `[PORT_ALLOC] Query port: 27015`
5. `[PORT_ALLOC] RCON port: 32330`
6. `[DOCKER] Building docker-compose for ARK`
7. `[DOCKER] Creating container: ark-ascended-ORD-2025-12345`
8. `[DOCKER] Container starting...`
9. `[HEALTH_CHECK] Checking ARK health (attempt 1/10)`
10. `[INSTALL_COMPLETE] Server status: ONLINE`

**Checkpoint 1: Port Allocation** ⏱️ 2-5 sec
- [ ] 6 ports allocated (port, queryPort, beaconPort, steamPeerPort, rconPort, rawSockPort)
- [ ] No port conflicts (PortManager anti-duplicate)
- [ ] Logs show allocation success

**Checkpoint 2: Docker Image Pull** ⏱️ 30-120 sec
- [ ] Image: `zedin-gaming/ark-ascended:latest`
- [ ] Logs show pull progress
- [ ] No image pull errors or timeouts

**Checkpoint 3: Container Startup** ⏱️ 15-60 sec
- [ ] Container ID shown in logs
- [ ] Container named: `ark-ascended-ORD-2025-12345`
- [ ] Volume mounts created (ark-data, ark-logs)
- [ ] Environment variables set (MAXPLAYERS, WORLDNAME, DIFFICULTY)

**Checkpoint 4: Server Initialization** ⏱️ 120-300 sec
- [ ] Logs show world loading
- [ ] No fatal errors in container logs
- [ ] Health check passing

### 5.2 Monitor Docker Container
**On Agent Machine** (SSH: GameServer-1)
```bash
docker ps --filter "name=ark-ascended-ORD-2025-12345"
docker logs ark-ascended-ORD-2025-12345 --tail 50
```
- [ ] Container status: `Up X minutes`
- [ ] No restart loops (restart count should be 0)
- [ ] Container logs show "Server ready" or similar

### 5.3 Check Ports Are Open
```bash
# On agent machine
netstat -ano | findstr "7777|27015|32330|27016|34567|27018"
# Or use PowerShell:
Get-NetTCPConnection -State Listen | Where-Object {$_.LocalPort -eq 7777}
```
- [ ] Port 7777 (Game): Listening
- [ ] Port 27015 (Query): Listening
- [ ] Port 32330 (RCON): Listening
- [ ] All ports on agent machine: YES
- [ ] All ports accessible from dev machine: YES (telnet test)

---

## ✅ Phase 5: Server Status Verification

### 6.1 Final Server Status
```sql
SELECT id, order_id, status, external_ip, ports, health_status, started_at 
FROM "GameServer" WHERE order_id = 'ORD-2025-12345';
```
- [ ] Status: `ONLINE`
- [ ] external_ip: Shows agent IP (e.g., 192.168.x.x or public IP)
- [ ] ports: JSON contains all 6 ports
- [ ] health_status: `HEALTHY`
- [ ] started_at: Recent timestamp

### 6.2 Admin Panel Dashboard Verification
**Path**: Admin Panel → Servers

- [ ] Server appears in list with status: `ONLINE`
- [ ] Server name: ARK Ascended (ORD-2025-12345)
- [ ] Player count: 0/70
- [ ] Uptime: Shows seconds/minutes (not errors)
- [ ] Connection dot: 🟢 GREEN

### 6.3 Connection Test (If ARK Client Available)
- [ ] Direct connect to: [agent-ip]:7777
- [ ] Server appears in favorites list
- [ ] Server shows correct config (70 max players, TheIsland)
- [ ] Can join server

---

## 📊 Phase 6: Data Integrity Check

### 7.1 Order Lifecycle Complete
```sql
SELECT id, status, created_at, paid_at, provisioned_at 
FROM "Order" WHERE id = 'ORD-2025-12345';
```
- [ ] Status: `ACTIVE` (or `PROVISIONING` if still starting)
- [ ] created_at: Initial creation time
- [ ] paid_at: Payment completion time
- [ ] provisioned_at: Server provisioned time

### 7.2 Port Manager Consistency
```sql
SELECT game_type, allocated_ports, last_used_port FROM "PortAllocation"
WHERE game_type = 'ARK_ASCENDED';
```
- [ ] All 6 ports recorded
- [ ] No duplicate ports
- [ ] last_used_port incremented correctly

### 7.3 Payment Reconciliation
```sql
SELECT SUM(amount) as total_revenue FROM "PaymentTransaction"
WHERE status = 'COMPLETED' AND DATE(created_at) = CURRENT_DATE;
```
- [ ] Today's revenue includes USD 9.99 (or equivalent in stored currency)
- [ ] Payment count incremented

---

## 🔴 Troubleshooting Matrix

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Order stuck in `PENDING_PAYMENT` | Webhook not received | Check Stripe dashboard for failed webhooks |
| Server status = `PROVISIONING` for >10min | Installer timeout | Check Docker logs on agent, restart container |
| Port allocation fails | Port conflicts | Check PortManager.ts for duplicate allocation |
| Health check failures | Container not responsive | Check Docker logs, verify game startup logs |
| Container exits immediately | Image pull failed | Check Docker image availability on agent |
| Server visible but can't connect | Firewall blocking | Check agent firewall rules, verify port is listening |

---

## 📝 Test Results Template

**Test Date**: 2025-12-06  
**Tester**: [Name]  
**Start Time**: [HH:MM]  
**End Time**: [HH:MM]  
**Total Duration**: [minutes]  

### Test Outcome
- [ ] ✅ PASSED - All phases completed, server ONLINE
- [ ] ⚠️ PARTIAL - Some phases failed, debugging logs collected
- [ ] ❌ FAILED - Critical failure, cannot provision server

### Key Metrics
| Metric | Value | Target |
|--------|-------|--------|
| Order Creation Time | [sec] | <5 sec |
| Payment Processing | [sec] | <10 sec |
| Webhook Latency | [sec] | <5 sec |
| Port Allocation | [sec] | <2 sec |
| Image Pull Time | [sec] | <120 sec |
| Container Startup | [sec] | <60 sec |
| Health Check Pass | [attempt] | <5 attempts |
| **Total Installation Time** | [sec] | <300 sec (5 min) |

### Issues Found
1. [Description] - Severity: [CRITICAL/HIGH/MEDIUM/LOW] - Status: [OPEN/RESOLVED]
2. [Description] - Severity: [CRITICAL/HIGH/MEDIUM/LOW] - Status: [OPEN/RESOLVED]

### Notes
```
[Any additional observations, logs, or screenshots]
```

---

## ✨ Success Criteria

**PASS Conditions** (All must be true):
- ✅ Order status: `ACTIVE` or `ONLINE`
- ✅ GameServer status: `ONLINE`
- ✅ All 6 ARK ports allocated and listening
- ✅ Health check: `HEALTHY`
- ✅ Docker container: Running (not exited)
- ✅ Admin panel shows server in green
- ✅ Payment recorded: `COMPLETED`
- ✅ Total time: <5 minutes

**FAIL Condition**:
- ❌ Any step times out (>300 sec)
- ❌ Server status never reaches `ONLINE`
- ❌ Container exits with error
- ❌ Ports not allocated/listening
- ❌ Health check failures >5 attempts

---

## 📋 Related Documentation
- [INSTALLERS.md](./INSTALLERS.md) - Installer configuration reference
- [ARK_INSTALLATION.md](./ARK_INSTALLATION.md) - ARK-specific setup
- [PAYMENT_WEBHOOKS.md](./PAYMENT_WEBHOOKS.md) - Webhook integration
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Production deployment

---

**Test Framework**: Manual  
**Automation Status**: Ready for Jest/Playwright automation  
**Next Steps**: Run E2E test, collect metrics, iterate on failures
