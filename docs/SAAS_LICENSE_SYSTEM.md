# SaaS Bérleti Rendszer Dokumentáció

## Áttekintés

A SaaS bérleti rendszer lehetővé teszi, hogy a Zed Gaming System-et havidíjasan ki lehessen adni. A rendszer tartalmazza a license key generálást, számlázást, email küldést és admin felületi kezelést.

## Főbb Funkciók

### 1. SaaS Csomagok Kezelése
- Admin felületen SaaS csomagok létrehozása/szerkesztése
- Árazás beállítása (havi/éves)
- Funkciók listája
- Max felhasználók/szerverek korlátok

### 2. Megrendelés Rendszer
- Publikus oldal: `/zed-gaming-system`
- Csomagok megjelenítése
- Megrendelés űrlap
- Stripe/PayPal/Revolut fizetés integráció

### 3. License Key Generálás
- Automatikus generálás fizetés után
- Manuális generálás admin felületen
- Formátum: `ZED-XXXX-XXXX-XXXX-XXXX`
- SHA256 hash validáció

### 4. Számlázási Rendszer
- PDF számla generálás (Puppeteer)
- Automatikus email küldés
- Számla sablonok
- ÁFA számítás (27%)

### 5. Admin Felület
- License kezelés oldal: `/admin/license`
- Megrendelések listája
- License key generálás
- Számla küldés
- Dashboard-on license információk

## Adatbázis Séma

### SaaSPlan
- Csomag információk
- Árazás
- Funkciók listája
- Korlátok (felhasználók, szerverek)

### SaaSOrder
- Megrendelés információk
- Fizetés státusz
- License key
- Számlázás információk
- Előfizetés dátumok

## API Endpointok

### Publikus
- `POST /api/saas/orders` - Megrendelés létrehozása
- `GET /api/saas/orders` - Megrendelések listája (admin)

### Admin
- `POST /api/admin/license/generate` - License key generálás
- `POST /api/admin/license/send-invoice` - Számla küldés
- `GET /api/admin/license/info` - License információk
- `GET /api/admin/saas-plans` - Csomagok listája
- `POST /api/admin/saas-plans` - Új csomag
- `PATCH /api/admin/saas-plans/[id]` - Csomag frissítés
- `DELETE /api/admin/saas-plans/[id]` - Csomag törlés

## Webhook Integráció

### Stripe Webhook
- `checkout.session.completed` - Fizetés sikeres
  - Automatikus license key generálás
  - Számla generálás és email küldés
  - Megrendelés aktiválása

## Használat

### 1. SaaS Csomag Létrehozása

1. Admin Panel → CMS → SaaS Árazási Csomagok
2. "Új csomag" gomb
3. Töltse ki az adatokat:
   - Név (egyedi azonosító)
   - Megjelenített név
   - Ár
   - Időtartam (havi/éves)
   - Funkciók
4. Mentés

### 2. Megrendelés Folyamat

1. Felhasználó látogat: `/zed-gaming-system`
2. Csomag kiválasztása
3. Megrendelés űrlap kitöltése
4. Fizetés (Stripe/PayPal/Revolut)
5. Automatikus license key generálás
6. Számla küldés email-ben

### 3. License Key Manuális Generálás

1. Admin Panel → License Kezelés
2. Megrendelés kiválasztása
3. "Generálás" gomb
4. License key megjelenik
5. Számla küldés (opcionális)

### 4. Számla Küldés

1. Admin Panel → License Kezelés
2. Megrendelés kiválasztása (amelyiknek van license key-je)
3. "Számla küldés" gomb
4. PDF számla generálás és email küldés

## Dashboard License Információk

Az admin dashboard-on (`/admin`) megjelenik:
- Aktuális csomag
- License key (ha van)
- Kezdés dátum
- Lejárat dátum
- Hátralévő napok száma
- Státusz (aktív/inaktív)

## Fájlok

### Komponensek
- `components/saas/SaaSPlansSection.tsx` - Csomagok megjelenítése
- `components/saas/SaaSOrderForm.tsx` - Megrendelés űrlap
- `components/admin/LicenseManagement.tsx` - License kezelés
- `components/admin/LicenseInfo.tsx` - Dashboard license info
- `components/admin/cms/SAASPricingManagement.tsx` - Csomag kezelés
- `components/admin/cms/SAASPricingForm.tsx` - Csomag szerkesztés

### Oldalak
- `app/[locale]/zed-gaming-system/page.tsx` - Főoldal
- `app/[locale]/zed-gaming-system/order/page.tsx` - Megrendelés
- `app/[locale]/zed-gaming-system/success/page.tsx` - Sikeres megrendelés
- `app/[locale]/admin/license/page.tsx` - License kezelés
- `app/[locale]/admin/cms/saas-pricing/page.tsx` - Csomag kezelés

### API-k
- `app/api/saas/orders/route.ts` - Megrendelések API
- `app/api/admin/license/generate/route.ts` - License generálás
- `app/api/admin/license/send-invoice/route.ts` - Számla küldés
- `app/api/admin/license/info/route.ts` - License info
- `app/api/admin/saas-plans/route.ts` - Csomagok API

### Library
- `lib/license-generator.ts` - License key generálás
- `lib/invoice-pdf-generator.ts` - PDF számla generálás
- `lib/email-invoice.ts` - Email küldés számlával

## Telepítés

### 1. Adatbázis Migráció

```bash
# Prisma client generálás
npm run db:generate

# Adatbázis séma frissítés
npm run db:push
```

### 2. Környezeti Változók

Győződjön meg róla, hogy a következő változók be vannak állítva:
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` - Email beállítások

### 3. Alapvető Csomagok Létrehozása

Az admin felületen hozzon létre legalább egy SaaS csomagot:
- Starter
- Pro
- Enterprise

## Kód Védés

A license key generálás és ellenőrzés kódja:
- `lib/license-generator.ts` - Obfuscated lehet (jövőbeli fejlesztés)
- Server-side validáció minden kritikus műveletnél
- License key hash tárolás (SHA256)

## Jövőbeli Fejlesztések

- [ ] SystemLicense modell (külön license tárolás)
- [ ] License key obfuscation
- [ ] Automatikus lejárat kezelés
- [ ] License renewal rendszer
- [ ] Multi-license támogatás
- [ ] License transfer funkció

