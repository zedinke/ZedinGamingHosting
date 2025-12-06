# 🎮 Rust Mod Marketplace - Telepítési Útmutató

## ✅ Teljesítette lépések

### 1. **Adatbázis séma** ✅
- ✅ `RustMod` modell - Modulok katalógusa
- ✅ `ModInstallation` modell - Telepítés nyomon követése
- ✅ `ModPurchase` modell - Fizetési történet
- ✅ `ModReview` modell - Felhasználói értékelések
- ✅ `ModCategory` modell - Modul kategorizálás

### 2. **Backend logika** ✅
- ✅ `RustModManager.ts` - Modul telepítés/eltávolítás/frissítés
- ✅ `/api/rust-mods/route.ts` - Publikus API (GET/POST)
- ✅ `/api/admin/rust-mods/route.ts` - Admin API (GET/POST/PATCH/DELETE)

### 3. **Frontend UI** ✅
- ✅ `RustModStore.tsx` - Felhasználó piactér (keresés, kategóriák, telepítés)
- ✅ `RustModManagement.tsx` - Admin panl (hozzáadás/szerkesztés/törlés)
- ✅ `/dashboard/servers/[id]/mods/page.tsx` - Szerver mod oldal

### 4. **Minta adatok** ✅
- ✅ 12 minta modul betöltve az adatbázisba
- ✅ Mix: ingyenes és fizetős modulok
- ✅ Kategóriák: Admin, Utility, Combat, Quality of Life, Building

---

## 🚀 Következő lépések

### 1. Stripe Integrációs (Fizetési rendszer)

#### A. Stripe API kulcsok
```bash
# .env.local fájlba
STRIPE_SECRET_KEY=sk_test_xxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxx
```

#### B. Checkout API endpoint létrehozása
```typescript
// app/api/checkout/route.ts
// POST /api/checkout
// Body: { modId, serverId }
// Response: { sessionId } (Stripe checkout sessionhez)
```

#### C. Payment callback kezelése
```typescript
// app/api/webhooks/stripe/route.ts
// POST endpoint a Stripe webhookoknak
// Ezt követően: ModPurchase create + ModInstallation INSTALLING státusz
```

### 2. Agent Service Integrációs (Automatikus telepítés)

#### A. ModInstallationService létrehozása
```typescript
// lib/services/ModInstallationService.ts
// - Queue mod installation task
// - Track installation status
// - Handle errors and retries
```

#### B. Agent jobokhoz hozzáadás
```typescript
// lib/agent-auth.ts vagy agent service
// - Job típus: INSTALL_RUST_MOD
// - Param: { serverId, modId, downloadUrl }
// - Agent: download → extract → validate → install
```

#### C. Webhook callback az agentből
```typescript
// POST /api/webhook/agent/mod-installation
// Update ModInstallation status: INSTALLING → INSTALLED/FAILED
```

### 3. Admin Kezelőpanel Integrációs

#### A. Admin oldal létrehozása
```typescript
// app/dashboard/admin/rust-mods/page.tsx
// - Mod management UI
// - RustModManagement.tsx komponensből
```

#### B. Admin routes hozzáadása a navigációhoz
```typescript
// components/Navigation.tsx vagy admin menu
// - Link: /dashboard/admin/rust-mods
```

---

## 📋 API Dokumentáció

### 1. Nyilvános API

#### GET `/api/rust-mods`
```bash
# Paraméterek:
query: ?page=1&limit=12&category=Utility&search=radar

# Válasz:
{
  "mods": [
    {
      "id": "uuid",
      "displayName": "Admin Radar",
      "price": 4.99,
      "category": "Admin",
      "rating": 4.5,
      "popularity": 250,
      "isFeatured": true,
      ...
    }
  ],
  "total": 42,
  "page": 1
}
```

#### POST `/api/rust-mods`
```bash
# Kötelezik:
{
  "modId": "uuid",
  "serverId": "uuid",
  "autoInstall": true
}

# Válasz (ingyenes modul):
{
  "installation": { ... },
  "status": "INSTALLING"
}

# Válasz (fizetős modul - szükséges Stripe):
{
  "checkout": {
    "sessionId": "cs_test_xxx",
    "url": "https://checkout.stripe.com/..."
  }
}
```

### 2. Admin API

#### GET `/api/admin/rust-mods`
```bash
# Összes modul listázása (csak admin)
# Válasz: [ { id, name, author, category, price, ... } ]
```

#### POST `/api/admin/rust-mods`
```bash
{
  "displayName": "New Mod",
  "description": "...",
  "author": "...",
  "version": "1.0.0",
  "category": "Utility",
  "price": 4.99,
  "downloadUrl": "https://...",
  "imageUrl": "https://..."
}
```

#### PATCH `/api/admin/rust-mods/:id`
```bash
# Modul szerkesztése
{
  "displayName": "Updated Name",
  "price": 5.99,
  "isFeatured": true
}
```

#### DELETE `/api/admin/rust-mods/:id`
```bash
# Modul törlése
```

---

## 🧪 Tesztelési Checklist

- [ ] GET `/api/rust-mods` - 12 minta modul visszaadott
- [ ] Modul keresés működik (search paraméter)
- [ ] Kategória szűrés működik
- [ ] Oldaltörés működik (pagination)
- [ ] Bejelentkezés szükséges a telepítéshez
- [ ] Ingyenes modul telepítés működik (azonnal INSTALLING)
- [ ] Fizetős modul fizetésre irányít (Stripe után)
- [ ] Admin panel nyilvánvaló (CRUD)
- [ ] RustModStore az /dashboard/servers/[id]/mods oldalon jelenik meg
- [ ] Oxide Framework ellenőrzés működik

---

## 📊 Funkcionalitás Status

| Funkció | Status | Megjegyzés |
|---------|--------|-----------|
| Mod katalógus | ✅ Kész | 12 minta modul |
| Keresés & szűrés | ✅ Kész | Kategória, Search, Pagination |
| Ingyenes mod telepítés | ✅ Kész | Azonnali INSTALLING |
| Fizetős mod workflow | 🔨 Félkész | Stripe integrációra vár |
| Admin kezelés | ✅ Kész | CRUD ops készen |
| Mod eltávolítás | ✅ Kész | RustModManager.uninstallMod() |
| Agent integrációs | 🔨 Félkész | Service létrehozásra vár |
| Felhasználó UI | ✅ Kész | RustModStore komponens |
| Installációs tracking | ✅ Kész | ModInstallation modell |

---

## 🔧 Beállítás Produkciónhoz

1. **Stripe Live Keys**
   ```
   STRIPE_SECRET_KEY=sk_live_xxxx
   STRIPE_PUBLISHABLE_KEY=pk_live_xxxx
   ```

2. **Agent Token**
   ```
   AGENT_REGISTRATION_TOKEN=prod_token_here
   ```

3. **Email értesítések**
   - ModPurchase után: Email a felhasználónak
   - Installation started/completed webhookokra

4. **Logging & Monitoring**
   - RustModManager hibák logolása
   - ModInstallation state transitions tracking

---

## 🎯 Végpontok URL

| Endpoint | URL |
|----------|-----|
| Publikus mod API | `/api/rust-mods` |
| Admin mod API | `/api/admin/rust-mods` |
| Stripe Checkout | `/api/checkout` |
| Stripe Webhook | `/api/webhooks/stripe` |
| Agent Webhook | `/api/webhook/agent/mod-installation` |
| Mod oldal | `/dashboard/servers/[id]/mods` |
| Admin panel | `/dashboard/admin/rust-mods` |

---

## 📝 Megjegyzések

- **Oxide Framework**: A telepítés előtt ellenőrizze, hogy az Oxide framework telepítve van a szerveren
- **Plugin Directory**: `/opt/rust-servers/{serverId}/plugins`
- **Mod Cache**: A letöltött modulok az `/tmp` -ben vannak tárolva, majd kitömörítve
- **Payment Processing**: Jelenleg csak Stripe támogatott, de kiterjeszthető PayPal/más fizetési módokra
- **Review System**: Modul értékelések (/5) az RustModStore-ban megjeleníthetők (UI elkészítésre vár)

---

**Frissítve:** 2025-12-06
