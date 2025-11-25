# Új Funkciók Implementálása - Útmutató

Ez a dokumentum leírja az új funkciók implementálásának folyamatát.

## ✅ Elkészült (Alapok)

1. **Prisma Schema bővítés**
   - HomepageSection modell
   - SlideshowSlide modell
   - GameCategory és Game modell
   - ThemeSetting modell

2. **Admin oldalak**
   - `/admin/cms/homepage` - Homepage sections kezelés
   - `/admin/cms/slideshow` - Slideshow kezelés
   - `/admin/cms/games` - Játékok és kategóriák
   - `/admin/invoices` - Számlák kezelés (újraküldés funkcióval)
   - `/admin/analytics` - Statisztikák és analytics
   - `/admin/theme` - Téma szerkesztő

3. **API Route-ok**
   - `/api/admin/invoices/[id]/resend` - Számla újraküldés

4. **Email funkciók**
   - `sendInvoiceEmail` - Számla email küldés

## 📋 Még implementálandó

### 1. Homepage Sections CMS

**Komponensek:**
- `components/admin/cms/HomepageSectionsManagement.tsx` - Listázó komponens
- `components/admin/cms/HomepageSectionForm.tsx` - Szerkesztő form
- `app/[locale]/admin/cms/homepage/new/page.tsx` - Új szekció
- `app/[locale]/admin/cms/homepage/[id]/page.tsx` - Szerkesztő oldal

**API Route-ok:**
- `app/api/admin/cms/homepage/route.ts` - GET, POST
- `app/api/admin/cms/homepage/[id]/route.ts` - GET, PUT, DELETE

**Frontend komponensek módosítása:**
- `components/home/HeroSection.tsx` - Adatbázisból töltse az adatokat
- `components/home/FeaturesSection.tsx` - Adatbázisból töltse az adatokat
- `components/home/StatsSection.tsx` - Adatbázisból töltse az adatokat
- `components/home/CTASection.tsx` - Adatbázisból töltse az adatokat

### 2. Slideshow

**Komponensek:**
- `components/admin/cms/SlideshowManagement.tsx` - Listázó komponens
- `components/admin/cms/SlideshowForm.tsx` - Szerkesztő form
- `components/home/SlideshowSection.tsx` - Frontend slideshow komponens
- `app/[locale]/admin/cms/slideshow/new/page.tsx` - Új slide
- `app/[locale]/admin/cms/slideshow/[id]/page.tsx` - Szerkesztő oldal

**API Route-ok:**
- `app/api/admin/cms/slideshow/route.ts` - GET, POST
- `app/api/admin/cms/slideshow/[id]/route.ts` - GET, PUT, DELETE

**Frontend integráció:**
- `app/[locale]/page.tsx` - Slideshow hozzáadása a kezdőoldalhoz

### 3. Games & Categories

**Komponensek:**
- `components/admin/cms/GamesManagement.tsx` - Játékok listázása
- `components/admin/cms/GameForm.tsx` - Játék szerkesztő
- `components/admin/cms/GameCategoryForm.tsx` - Kategória szerkesztő
- `app/[locale]/admin/cms/games/new/page.tsx` - Új játék
- `app/[locale]/admin/cms/games/[id]/page.tsx` - Játék szerkesztő
- `app/[locale]/admin/cms/games/categories/new/page.tsx` - Új kategória
- `app/[locale]/admin/cms/games/categories/[id]/page.tsx` - Kategória szerkesztő

**API Route-ok:**
- `app/api/admin/cms/games/route.ts` - GET, POST
- `app/api/admin/cms/games/[id]/route.ts` - GET, PUT, DELETE
- `app/api/admin/cms/games/categories/route.ts` - GET, POST
- `app/api/admin/cms/games/categories/[id]/route.ts` - GET, PUT, DELETE

**Frontend módosítás:**
- `app/[locale]/games/page.tsx` - Kategóriák szerint szűrés
- `components/games/GameGrid.tsx` - Kategória megjelenítés

### 4. Invoice Management

**Komponensek:**
- `components/admin/InvoiceManagement.tsx` - Számlák listázása újraküldés gombbal
- `components/admin/InvoiceResendButton.tsx` - Újraküldés gomb komponens

**Frontend módosítás:**
- `app/[locale]/dashboard/billing/page.tsx` - Számla letöltés/újraküldés

### 5. Analytics Dashboard

**Komponensek:**
- `components/admin/AnalyticsDashboard.tsx` - Fő analytics komponens
- `components/admin/analytics/StatCard.tsx` - Statisztika kártya
- `components/admin/analytics/RevenueChart.tsx` - Bevétel grafikon
- `components/admin/analytics/UserGrowthChart.tsx` - Felhasználó növekedés
- `components/admin/analytics/PeriodSelector.tsx` - Időszak választó

**Chart library:**
- Telepíteni kell: `recharts` vagy `chart.js`

### 6. Theme Editor

**Komponensek:**
- `components/admin/ThemeEditor.tsx` - Fő téma szerkesztő
- `components/admin/theme/ColorPicker.tsx` - Színválasztó
- `components/admin/theme/FontSelector.tsx` - Betűtípus választó
- `components/admin/theme/PreviewPanel.tsx` - Előnézet panel

**API Route-ok:**
- `app/api/admin/theme/route.ts` - GET, PUT

**Frontend integráció:**
- Dinamikus CSS változók generálása a téma beállításokból
- `app/layout.tsx` - Téma CSS betöltése

### 7. Többnyelvűség

**Fordítási fájlok bővítése:**
- `public/locales/hu/common.json` - Minden új szöveg hozzáadása
- `public/locales/en/common.json` - Minden új szöveg hozzáadása

**Admin panel fordítások:**
- `public/locales/hu/admin.json` - Admin panel fordítások
- `public/locales/en/admin.json` - Admin panel fordítások

## 🚀 Implementációs sorrend

1. **Első fázis (Alapok):**
   - Homepage Sections API route-ok
   - Slideshow API route-ok
   - Games API route-ok
   - Invoice Management komponens

2. **Második fázis (Frontend):**
   - Homepage Sections komponensek
   - Slideshow komponens
   - Games komponensek
   - Frontend integráció

3. **Harmadik fázis (Advanced):**
   - Analytics Dashboard
   - Theme Editor
   - Többnyelvűség bővítés

## 📝 Megjegyzések

- Minden új funkciót teljes CRUD műveletekkel kell implementálni
- Validáció Zod-dal
- Admin jogosultság ellenőrzés minden API route-on
- Responsive design
- Error handling
- Loading states
- Toast notifications

## 🔧 Technikai követelmények

- **Chart library:** `recharts` vagy `chart.js` telepítése
- **Color picker:** `react-color` vagy natív HTML5 color input
- **Image upload:** Cloudinary vagy helyi storage
- **PDF generation:** `pdfkit` vagy `puppeteer` számlákhoz

