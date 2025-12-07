# Translation TODO List - Comprehensive

## Status: IN PROGRESS
Last Updated: 2025-12-07

---

## Pages & Routes to Translate

### ✅ COMPLETED
- [ ] /[locale]/page.tsx (Home) - FIXED ✅
- [ ] /[locale]/pricing/page.tsx - FIXED ✅
- [ ] /[locale]/games/page.tsx - FIXED ✅
- [ ] /[locale]/admin/page.tsx - FIXED ✅

### 🔴 IN PROGRESS / TODO
- [ ] /[locale]/servers/new/page.tsx - Hero section ("Új Szerver Rendelése", "Töltsd ki...")
- [ ] /[locale]/zed-gaming-system/page.tsx - System page content
- [ ] /[locale]/dashboard/page.tsx - Dashboard (title, etc)
- [ ] /[locale]/login/page.tsx - Login page
- [ ] /[locale]/register/page.tsx - Register page ("Hozz létre egy új fiókot")
- [ ] /[locale]/forgot-password/page.tsx
- [ ] /[locale]/reset-password/page.tsx - ("Hiba")
- [ ] /app/error.tsx - ("Hiba történt", "Ismeretlen hiba")
- [ ] /app/layout.tsx - Meta description ("Teljes körű gaming szerver hosting platform")

### Components to Fix
- [ ] /components/home/CTASection.tsx - ("Regisztrálj most...", "Ingyenes Regisztráció")
- [ ] /components/Loading.tsx - ("Betöltés...")
- [ ] /components/dashboard/NotificationsPanel.tsx - ("Betöltés...", "Nincs értesítés", "További értesítések")
- [ ] /components/dashboard/NotificationsList.tsx - ("Betöltés...", "Nincs értesítés")
- [ ] /zedingaming-saas/components/admin/LicenseInfo.tsx - ("License információk betöltése...", "License nincs aktiválva", "Max Felhasználók", "Max Szerverek")
- [ ] /zedingaming-saas/components/admin/UpdateInfo.tsx - Error messages
- [ ] /app/dashboard/servers/[id]/mods/page.tsx - Multiple error messages ("Szerver nem található", "Ez az oldal csak Rust szerverekhez elérhető", "Hiba a szerver betöltésekor", "Hiba")
- [ ] /zedingaming-saas/app/admin/license/page.tsx - ("License aktiválás sikertelen", "License sikeresen aktiválva!", "Hiba történt", "Vissza a dashboard-ra", "Mégse")
- [ ] /zedingaming-saas/app/admin/page.tsx - ("Beállítások", "Rendszer beállítások")

---

## Hardcoded Strings to Extract

### Error Messages
- "Szerver nem található"
- "Ez az oldal csak Rust szerverekhez elérhető"
- "Hiba a szerver betöltésekor"
- "Hiba"
- "Hiba történt"
- "Ismeretlen hiba történt"
- "License aktiválás sikertelen"
- "Hiba történt a license aktiválása során"
- "Hiba történt a frissítések ellenőrzése során"
- "Nincs elérhető frissítés"
- "Frissítés telepítés sikertelen"
- "Hiba történt a frissítés telepítése során"

### Loading/Empty States
- "Betöltés..."
- "License információk betöltése..."
- "Nincs értesítés"
- "Nincs elérhető frissítés"

### Buttons & Actions
- "Mégse"
- "Vissza a dashboard-ra"

### Forms & Labels
- "Hozz létre egy új fiókot"

### Success Messages
- "License sikeresen aktiválva!"

### Page Titles & Descriptions
- "Új Szerver Rendelése"
- "Töltsd ki az alábbi űrlapot és szervered percek alatt készen áll"
- "Teljes körű gaming szerver hosting platform"
- "Beállítások"
- "Rendszer beállítások"
- "Regisztrálj most és kapj 24 órás ingyenes próbaidőt!"
- "Ingyenes Regisztráció"

### Special Content
- "📌 Egy kattintással telepítsd a modokat a szerveredre"
- "Bizonyosítsd meg, hogy az Oxide framework telepített a szerveren."

### System Messages
- "Max Felhasználók"
- "Max Szerverek"
- "License nincs aktiválva"
- "Szerver:"
- "További értesítések megtekintése ({count})"

---

## Translation Keys Structure

### errors.*
- errors.serverNotFound: "Server not found"
- errors.rustServerOnly: "This page is only available for Rust servers"
- errors.loadingServer: "Error loading server"
- errors.general: "Error"
- errors.occurred: "An error occurred"
- errors.unknown: "Unknown error occurred"
- errors.licenseActivationFailed: "License activation failed"
- errors.licenseActivationError: "Error occurred during license activation"
- errors.checkUpdatesError: "Error checking for updates"
- errors.noUpdatesAvailable: "No updates available"
- errors.installUpdateFailed: "Update installation failed"
- errors.installUpdateError: "Error occurred during update installation"

### loading.*
- loading.text: "Loading..."
- loading.licenseInfo: "Loading license information..."

### empty.*
- empty.noNotifications: "No notifications"
- empty.noUpdates: "No updates available"

### buttons.*
- buttons.cancel: "Cancel"
- buttons.backToDashboard: "Back to dashboard"

### forms.*
- forms.createNewAccount: "Create a new account"

### success.*
- success.licenseActivated: "License activated successfully!"

### pages.servers.new.*
- pages.servers.new.title: "Order New Server"
- pages.servers.new.subtitle: "Fill in the form below and your server will be ready in minutes"

### pages.layout.*
- pages.layout.description: "Complete gaming server hosting platform"

### pages.settings.*
- pages.settings.title: "Settings"
- pages.settings.description: "System settings"

### pages.register.*
- pages.register.createAccount: "Create a new account"

### pages.cta.*
- pages.cta.registerNow: "Register now and get 24 hours free trial!"
- pages.cta.freeRegistration: "Free Registration"

### admin.*
- admin.mods.subtitle: "📌 Install mods on your server with one click"
- admin.mods.oxideWarning: "Make sure the Oxide framework is installed on your server."

### server.*
- server.label: "Server:"
- server.maxPlayers: "Max Players"

### license.*
- license.info: "License Information"
- license.notActivated: "License is not activated"
- license.maxUsers: "Max Users"
- license.maxServers: "Max Servers"

---

## Priority

### HIGH (Used on main pages)
1. Error messages
2. Loading states
3. Form labels
4. Button text
5. Page titles

### MEDIUM (Component specific)
1. Modal/Dialog messages
2. Notification messages
3. Status messages

### LOW (Rarely used)
1. Admin-only messages
2. System messages

---

## Implementation Steps

1. [x] Update all 3 translation JSON files with new keys
2. [ ] Update /[locale]/servers/new/page.tsx
3. [ ] Update /[locale]/zed-gaming-system/page.tsx
4. [ ] Update /[locale]/dashboard/page.tsx
5. [ ] Update /[locale]/login/page.tsx
6. [ ] Update /[locale]/register/page.tsx
7. [ ] Update /[locale]/forgot-password/page.tsx
8. [ ] Update /[locale]/reset-password/page.tsx
9. [ ] Update /app/error.tsx
10. [ ] Update /app/layout.tsx
11. [ ] Update all components with hardcoded strings
12. [ ] Test all 3 languages (HU, EN, ES)
13. [ ] Build & Deploy
14. [ ] Final verification on live site

---

## Notes

- All hardcoded strings should be moved to translation files
- Use nested structure: `pages.name.key`, `errors.key`, `components.name.key`
- Always provide fallback values in components
- Test in all 3 languages: Hungarian (HU), English (EN), Spanish (ES)
- Update German (DE) and French (FR) if in scope

