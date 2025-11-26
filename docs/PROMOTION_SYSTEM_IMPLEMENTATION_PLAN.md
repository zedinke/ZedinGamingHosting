# Akció Rendszer Implementációs Terv

## Jelenlegi Állapot

A rendszerben **NINCS** implementálva akció/promóció rendszer a szerverek bérlésére. 
- Van `Coupon` modell, de ez csak kupon kódokra szolgál
- Van `PricingPlan` modell az árazási csomagokhoz
- Nincs automatikus akció alkalmazása
- Nincs akció kezelő felület

## Követelmények

1. **Legalább 5 fajta akció típus:**
   - Százalékos kedvezmény (pl. 20% OFF)
   - Fix összegű kedvezmény (pl. 5000 HUF OFF)
   - "X hónap ingyen" (pl. 1 hónap ingyen)
   - "Vásárlás után Y% visszatérítés"
   - "Minimum X hónapra Y% kedvezmény"

2. **Akció hatókör:**
   - Globális (minden szerverre/játékra)
   - Játék-specifikus (pl. csak Palworld szerverekre)
   - Szerver-specifikus (konkrét szerverekre)
   - Csomag-specifikus (konkrét árazási csomagokra)

3. **Megjelenítés:**
   - Főoldalon (homepage)
   - Felhasználói vezérlőpultban (dashboard)
   - Árazási oldalon (pricing page)

4. **Email értesítés:**
   - Design-os email minden regisztrált felhasználónak
   - Játék-specifikus akció esetén játék kártya az emailben
   - Akció mértéke és lejárati dátum feltüntetése

## Implementációs Terv

### 1. Adatbázis Schema Bővítés

#### Új Promotion Modell

```prisma
model Promotion {
  id            String          @id @default(cuid())
  title         String          // Akció címe (pl. "Nagy Karácsonyi Akció")
  description   String?         @db.Text // Akció leírása
  promotionType PromotionType   // Akció típusa
  discountValue Float           // Kedvezmény értéke
  discountType  DiscountType    // PERCENTAGE vagy FIXED_AMOUNT
  minMonths     Int?            // Minimum hónapok száma (ha van)
  freeMonths    Int?            // Ingyenes hónapok száma (ha van)
  
  // Hatókör
  scope         PromotionScope  @default(GLOBAL)
  gameTypes     Json?           // Játék típusok tömbje (ha GAME_SPECIFIC)
  serverIds     Json?           // Szerver ID-k tömbje (ha SERVER_SPECIFIC)
  planIds       Json?           // Csomag ID-k tömbje (ha PLAN_SPECIFIC)
  
  // Időzítés
  validFrom     DateTime
  validUntil    DateTime
  isActive      Boolean         @default(true)
  
  // Email értesítés
  emailSent     Boolean         @default(false)
  emailSentAt   DateTime?
  
  // Meta
  imageUrl      String?         // Akció kép URL-je
  badgeText     String?         // Badge szöveg (pl. "ÚJ", "LIMITÁLT")
  priority      Int             @default(0) // Prioritás (magasabb = előrébb)
  
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
  
  @@map("promotions")
  @@index([isActive, validFrom, validUntil])
  @@index([scope])
}

enum PromotionType {
  PERCENTAGE_DISCOUNT      // Százalékos kedvezmény
  FIXED_DISCOUNT           // Fix összegű kedvezmény
  FREE_MONTHS              // Ingyenes hónapok
  CASHBACK                 // Visszatérítés
  MINIMUM_MONTHS_DISCOUNT  // Minimum hónapokra kedvezmény
}

enum PromotionScope {
  GLOBAL           // Mindenre
  GAME_SPECIFIC    // Játék-specifikus
  SERVER_SPECIFIC  // Szerver-specifikus
  PLAN_SPECIFIC    // Csomag-specifikus
}
```

### 2. Backend API Endpoints

#### Admin API-k

```
POST   /api/admin/promotions              - Új akció létrehozása
GET    /api/admin/promotions              - Akciók listázása
GET    /api/admin/promotions/[id]         - Akció részletei
PUT    /api/admin/promotions/[id]         - Akció frissítése
DELETE /api/admin/promotions/[id]         - Akció törlése
POST   /api/admin/promotions/[id]/send-email - Email küldés minden felhasználónak
```

#### Public API-k

```
GET    /api/promotions                    - Aktív akciók lekérése
GET    /api/promotions/active             - Aktív akciók (szűrt)
GET    /api/promotions/for-game/[gameType] - Akciók játék típusra
GET    /api/promotions/for-plan/[planId]   - Akciók csomagra
```

### 3. Admin Felület

#### Új Admin Oldalak

1. **Akciók Lista** (`/admin/promotions`)
   - Táblázat az összes akcióval
   - Szűrők: Aktív/Inaktív, Típus, Hatókör
   - Keresés
   - "Email küldés" gomb minden akcióhoz

2. **Akció Létrehozás/Szerkesztés** (`/admin/promotions/new`, `/admin/promotions/[id]`)
   - Form mezők:
     - Cím, Leírás
     - Akció típusa (dropdown)
     - Kedvezmény értéke és típusa
     - Hatókör választás (radio buttons)
     - Játékok/Szerverek/Csomagok kiválasztása (ha specifikus)
     - Érvényesség (validFrom, validUntil)
     - Kép feltöltés
     - Badge szöveg
     - Prioritás

3. **Email Küldés Felület**
   - Preview az emailtől
   - "Küldés minden regisztrált felhasználónak" gomb
   - Küldési státusz megjelenítés

### 4. Frontend Komponensek

#### Új Komponensek

1. **PromotionCard** (`components/promotions/PromotionCard.tsx`)
   - Akció kártya megjelenítés
   - Badge, kép, cím, leírás
   - Kedvezmény megjelenítés
   - Lejárati dátum
   - CTA gomb

2. **PromotionBanner** (`components/promotions/PromotionBanner.tsx`)
   - Banner stílusú akció megjelenítés
   - Főoldal tetején

3. **PromotionSection** (`components/promotions/PromotionSection.tsx`)
   - Akciók szekció a főoldalon és dashboard-on
   - Grid layout több akcióval

4. **GamePromotionCard** (`components/promotions/GamePromotionCard.tsx`)
   - Játék-specifikus akció kártya
   - Játék kép és információk
   - Akció részletek

### 5. Főoldal Integráció

#### Módosítások

1. **Homepage** (`app/[locale]/page.tsx`)
   - Aktív akciók lekérése
   - PromotionSection komponens hozzáadása
   - PromotionBanner a hero section alatt

2. **Pricing Page** (`app/[locale]/pricing/page.tsx`)
   - Aktív akciók megjelenítése
   - Kedvezményes árak számítása és megjelenítése

### 6. Dashboard Integráció

#### Módosítások

1. **Dashboard Page** (`app/[locale]/dashboard/page.tsx`)
   - Aktív akciók szekció hozzáadása
   - "Új akciók" kártya
   - Gyors link az árazási oldalra akcióval

### 7. Email Sablon

#### Új Email Sablon

1. **Promotion Email Template** (`lib/email-templates.ts`)
   - Design-os HTML email
   - Responsive design
   - Játék kártya (ha játék-specifikus)
   - Akció részletek (mérték, lejárat)
   - CTA gomb az árazási oldalra
   - Branding elemek

2. **Email Küldési Funkció**
   - Batch küldés (pl. 100 felhasználó/ciklus)
   - Progress tracking
   - Hiba kezelés
   - Retry mechanizmus

### 8. Árazás Számítás Logika

#### Új Funkciók

1. **Price Calculator** (`lib/price-calculator.ts`)
   - Aktív akciók lekérése
   - Akció alkalmazása az árakra
   - Kedvezményes ár számítása
   - Több akció kombinálása (ha szükséges)

2. **Checkout Integration**
   - Akció alkalmazása a checkout során
   - Kedvezmény mentése az invoice-ba

### 9. Implementációs Lépések

#### Fázis 1: Adatbázis és Backend
1. ✅ Prisma schema bővítés (Promotion modell)
2. ✅ Migration létrehozása
3. ✅ API endpoints implementálása
4. ✅ Price calculator logika

#### Fázis 2: Admin Felület
1. ✅ Admin oldalak létrehozása
2. ✅ Akció kezelő komponensek
3. ✅ Form validáció
4. ✅ Email küldési felület

#### Fázis 3: Frontend Integráció
1. ✅ Promotion komponensek
2. ✅ Főoldal integráció
3. ✅ Dashboard integráció
4. ✅ Pricing page integráció

#### Fázis 4: Email Rendszer
1. ✅ Email sablon design
2. ✅ Email küldési funkció
3. ✅ Batch processing
4. ✅ Error handling

#### Fázis 5: Tesztelés és Finomhangolás
1. ✅ Unit tesztek
2. ✅ Integration tesztek
3. ✅ UI/UX finomhangolás
4. ✅ Performance optimalizálás

### 10. Technikai Részletek

#### Akció Alkalmazási Logika

```typescript
function applyPromotion(price: number, promotion: Promotion): number {
  switch (promotion.promotionType) {
    case 'PERCENTAGE_DISCOUNT':
      return price * (1 - promotion.discountValue / 100);
    case 'FIXED_DISCOUNT':
      return Math.max(0, price - promotion.discountValue);
    case 'FREE_MONTHS':
      // Számítás: ha 3 hónapra vásárol, és 1 ingyen, akkor 2 hónap ára
      // Ez a checkout során történik
      return price;
    case 'CASHBACK':
      // Visszatérítés a fizetés után történik
      return price;
    case 'MINIMUM_MONTHS_DISCOUNT':
      // Minimum X hónapra Y% kedvezmény
      return price * (1 - promotion.discountValue / 100);
  }
}
```

#### Akció Szűrés Logika

```typescript
function getActivePromotions(filters?: {
  gameType?: GameType;
  planId?: string;
  serverId?: string;
}): Promise<Promotion[]> {
  // Aktív akciók lekérése
  // Hatókör alapján szűrés
  // Prioritás szerint rendezés
}
```

### 11. Email Sablon Struktúra

```html
<!DOCTYPE html>
<html>
<head>
  <!-- Responsive design -->
</head>
<body>
  <!-- Header with logo -->
  <!-- Hero section with promotion title -->
  <!-- Promotion details (discount, valid until) -->
  <!-- Game card (if game-specific) -->
  <!-- CTA button -->
  <!-- Footer -->
</body>
</html>
```

### 12. Biztonsági Megfontolások

1. **Admin jogosultság ellenőrzés** minden admin API-nál
2. **Rate limiting** az email küldésnél
3. **Validáció** az akció létrehozásánál
4. **SQL injection védelem** (Prisma használata)
5. **XSS védelem** (React automatikus escaping)

### 13. Performance Optimalizálás

1. **Caching** az aktív akciókhoz (Redis vagy Next.js cache)
2. **Batch email küldés** (queue system)
3. **Lazy loading** a komponenseknél
4. **Image optimization** az akció képeknél

### 14. Monitoring és Logging

1. **Email küldési statisztikák**
2. **Akció használati statisztikák**
3. **Hibák naplózása**
4. **Performance metrikák**

## Összefoglalás

Ez a terv egy teljes körű akció rendszert valósít meg, amely:
- ✅ Többféle akció típust támogat
- ✅ Globális és specifikus akciókat kezel
- ✅ Megjeleníti a főoldalon és dashboard-on
- ✅ Design-os emailt küld minden felhasználónak
- ✅ Integrálható a meglévő árazási rendszerbe

A megvalósítás kb. 15-20 óra munkát igényel, és fázisokban implementálható.

