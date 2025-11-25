# TODO Lista - ZedinGamingHosting

## 🚧 Folyamatban lévő feladatok

### 1. Szerver Provisioning
- [ ] **API Route-okban TODO-k:**
  - `app/api/servers/order/route.ts` - Tényleges szerver provisioning logika
  - `app/api/servers/[id]/[action]/route.ts` - Valós szerver műveletek (start/stop/restart)
  - `app/api/admin/servers/[id]/[action]/route.ts` - Admin szerver műveletek

### 2. Stripe Integráció
- [ ] **Payment Flow:**
  - `app/api/servers/order/route.ts` - Stripe integráció előfizetésekhez
  - Stripe webhook kezelés
  - Payment method kezelés
  - Automatikus számlázás

### 3. Analytics Dashboard
- [ ] **Komponensek:**
  - `components/admin/AnalyticsDashboard.tsx` - Teljes implementáció
  - `components/admin/analytics/StatCard.tsx` - Statisztika kártya
  - `components/admin/analytics/RevenueChart.tsx` - Bevétel grafikon
  - `components/admin/analytics/UserGrowthChart.tsx` - Felhasználó növekedés
  - `components/admin/analytics/PeriodSelector.tsx` - Időszak választó
- [ ] Chart library telepítés (`recharts` vagy `chart.js`)

### 4. Theme Editor
- [ ] **Komponensek:**
  - `components/admin/ThemeEditor.tsx` - Teljes implementáció
  - `components/admin/theme/ColorPicker.tsx` - Színválasztó
  - `components/admin/theme/FontSelector.tsx` - Betűtípus választó
  - `components/admin/theme/PreviewPanel.tsx` - Előnézet panel
- [ ] Dinamikus CSS változók generálása
- [ ] Téma alkalmazása a frontend-en

## 📋 Következő prioritások

### 1. Szerver Kezelés
- [ ] Valós idejű szerver monitoring
- [ ] Fájlkezelő implementáció
- [ ] Konzol hozzáférés
- [ ] Backup kezelés
- [ ] Resource usage grafikonok

### 2. Támogatási Rendszer
- [ ] Ticket rendszer teljes implementáció
- [ ] Real-time chat
- [ ] Tudásbázis/FAQ frontend
- [ ] Email értesítések

### 3. Felhasználói Funkciók
- [ ] Felhasználói profil oldal teljesítése
- [ ] 2FA beállítások
- [ ] Jelszó változtatás
- [ ] Email cím módosítás

### 4. Admin Funkciók
- [ ] Felhasználókezelés CRUD
- [ ] Szerver példány kezelés
- [ ] Pénzügyi jelentések
- [ ] Rendszer logok megtekintése
- [ ] Email template kezelés

## 🔧 Technikai fejlesztések

### 1. Teljesítmény
- [ ] Image optimization
- [ ] Lazy loading
- [ ] Caching stratégia
- [ ] Database query optimalizálás

### 2. SEO
- [ ] Meta tag kezelés
- [ ] Sitemap generálás
- [ ] Robots.txt
- [ ] Open Graph tags

### 3. Biztonság
- [ ] Rate limiting
- [ ] CSRF protection
- [ ] XSS protection
- [ ] SQL injection elleni védelem (Prisma már véd)

### 4. Tesztelés
- [ ] Unit tesztek
- [ ] Integration tesztek
- [ ] E2E tesztek
- [ ] Performance tesztek

## 📝 Dokumentáció

- [ ] API dokumentáció
- [ ] Deployment guide frissítése
- [ ] User guide
- [ ] Admin guide
- [ ] Developer guide

## 🐛 Ismert hibák/javítandó

### 1. Dashboard oldal
- [x] ✅ Javítva: Icon komponensek szerializálása
- [x] ✅ Javítva: Translation függvény szerializálása
- [x] ✅ Javítva: Params async kezelés

### 2. Debug mód
- [x] ✅ Elkészült: Debug mód rendszer
- [ ] Debug logger integrálása az összes API route-ba

### 3. Frissítési rendszer
- [x] ✅ Javítva: Syntax hibák
- [x] ✅ Javítva: Progress tracking
- [ ] További tesztelés szükséges

## 🎯 Rövid távú célok (1-2 hét)

1. **Szerver provisioning logika** - Agent-based architektúra implementálása
2. **Stripe integráció** - Payment flow teljes implementáció
3. **Analytics Dashboard** - Alapvető statisztikák megjelenítése
4. **Theme Editor** - Alapvető szín és betűtípus szerkesztés

## 🚀 Hosszú távú célok (1-2 hónap)

1. **Teljes szerver kezelőpult** - Monitoring, fájlkezelő, konzol
2. **Támogatási rendszer** - Ticket rendszer, chat, tudásbázis
3. **Mobil app** - React Native vagy PWA
4. **Automatizált provisioning** - Docker/Podman alapú szerver provisioning
5. **Multi-server support** - Több szerver kezelése egy felületről

## 📊 Statisztikák

- **Elkészült funkciók:** ~70%
- **Folyamatban:** ~20%
- **Tervezett:** ~10%

## 🔄 Frissítés dátuma

Utolsó frissítés: 2024-01-XX

---

**Megjegyzés:** Ez a TODO lista dinamikus, és folyamatosan frissül a projekt haladásával.

