# ZedinGamingHosting - Teljes Funkciólista

Ez a dokumentum részletesen felsorolja a rendszer összes funkcióját és képességét.

## 📋 Tartalomjegyzék

1. [Autentikáció és Felhasználókezelés](#1-autentikáció-és-felhasználókezelés)
2. [Admin Vezérlőpult](#2-admin-vézérlőpult)
3. [Felhasználói Dashboard](#3-felhasználói-dashboard)
4. [Szerver Kezelés](#4-szerver-kezelés)
5. [Számlázás és Fizetés](#5-számlázás-és-fizetés)
6. [CMS (Content Management System)](#6-cms-content-management-system)
7. [Támogatási Rendszer](#7-támogatási-rendszer)
8. [Rendszerbeállítások és Karbantartás](#8-rendszerbeállítások-és-karbantartás)
9. [Agent-Based Architektúra](#9-agent-based-architektúra)
10. [Monitoring és Analytics](#10-monitoring-és-analytics)
11. [Biztonsági Funkciók](#11-biztonsági-funkciók)
12. [Többnyelvűség](#12-többnyelvűség)

---

## 1. Autentikáció és Felhasználókezelés

### 1.1 Felhasználói Regisztráció
- ✅ Email/jelszó alapú regisztráció
- ✅ Email verifikáció (email megerősítés szükséges)
- ✅ OAuth bejelentkezés (Google, Discord)
- ✅ Jelszó validáció (erősség ellenőrzés)
- ✅ Automatikus email küldés verifikációhoz

### 1.2 Bejelentkezés
- ✅ Email/jelszó bejelentkezés
- ✅ OAuth bejelentkezés (Google, Discord)
- ✅ Session kezelés (JWT, 30 napos érvényesség)
- ✅ "Emlékezz rám" funkció
- ✅ Automatikus redirect bejelentkezés után

### 1.3 Jelszó Kezelés
- ✅ Jelszó visszaállítás (forgot password)
- ✅ Email alapú reset token generálás
- ✅ Biztonságos jelszó reset flow
- ✅ Jelszó változtatás bejelentkezés után
- ✅ Bcrypt hashelés

### 1.4 Felhasználói Profil
- ✅ Profil adatok szerkesztése
- ✅ Avatar feltöltés
- ✅ Email cím módosítás
- ✅ Jelszó változtatás
- ✅ Kétfaktoros autentikáció (2FA) támogatás (séma szinten)

### 1.5 Szerepkörök és Jogosultságok
- ✅ **USER** - Alapvető felhasználói jogosultságok
- ✅ **MODERATOR** - Moderátori jogosultságok
- ✅ **ADMIN** - Teljes admin hozzáférés
- ✅ Szerepkör alapú route védelem
- ✅ Szerepkör alapú UI megjelenítés

---

## 2. Admin Vezérlőpult

### 2.1 Főoldal (Dashboard)
- ✅ Összesített statisztikák:
  - Összes felhasználó száma
  - Összes szerver száma
  - Aktív előfizetések száma
  - Összes bevétel (fizetett számlák)
  - Nyitott support ticketek száma
- ✅ Rendszer egészség állapota
- ✅ Legutóbbi felhasználók listája
- ✅ Legutóbbi szerverek listája

### 2.2 Felhasználókezelés
- ✅ Felhasználók listázása (paginációval)
- ✅ Felhasználó keresés
- ✅ Felhasználó részletek megtekintése
- ✅ Felhasználó szerkesztése
- ✅ Szerepkör módosítás
- ✅ Email verifikáció állapot kezelés
- ✅ Felhasználó törlése

### 2.3 Szerver Kezelés (Admin)
- ✅ Összes szerver listázása
- ✅ Szerver keresés (név, tulajdonos alapján)
- ✅ Státusz szűrés (ONLINE, OFFLINE, stb.)
- ✅ Szerver részletes információk:
  - Játék típus
  - IP cím és port
  - Játékosok száma
  - Előfizetés állapota
  - Tulajdonos információk
- ✅ Szerver műveletek (start, stop, restart)
- ✅ Szerver konfiguráció szerkesztése
- ✅ Resource limits beállítása
- ✅ Szerver törlése

### 2.4 Szerver Részletek (Admin)
- ✅ Szerver információk megjelenítése
- ✅ Valós idejű monitoring (SSE)
- ✅ Fájlkezelő (file manager)
- ✅ Konzol hozzáférés
- ✅ Logok megtekintése
- ✅ Metrikák (CPU, RAM, Disk)
- ✅ Backup kezelés
- ✅ Szerver sablonok

### 2.5 Előfizetés Kezelés
- ✅ Előfizetések listázása
- ✅ Előfizetés státusz kezelés
- ✅ Előfizetés megszakítás
- ✅ Előfizetés módosítás
- ✅ Fizetési provider kezelés (Stripe, Revolut, PayPal)

### 2.6 Számlázás Kezelés
- ✅ Számlák listázása
- ✅ Számla részletek
- ✅ Számla státusz kezelés
- ✅ Számla újraküldés email-ben
- ✅ PDF generálás (séma szinten)
- ✅ Számla exportálás

### 2.7 Support Ticket Kezelés
- ✅ Ticketek listázása
- ✅ Ticket keresés
- ✅ Státusz szűrés (OPEN, IN_PROGRESS, CLOSED)
- ✅ Prioritás szűrés (LOW, MEDIUM, HIGH, URGENT)
- ✅ Kategória szűrés (TECHNICAL, BILLING, GENERAL, SERVER_ISSUE)
- ✅ Ticket részletek megtekintése
- ✅ Válasz küldése ticketre
- ✅ Ticket státusz módosítás
- ✅ Prioritás módosítás
- ✅ Ticket lezárása

### 2.8 CMS Kezelés
Lásd: [6. CMS (Content Management System)](#6-cms-content-management-system)

### 2.9 Rendszerbeállítások
- ✅ Karbantartási mód be/kikapcsolása
- ✅ Rendszer frissítés ellenőrzése
- ✅ Rendszer frissítés végrehajtása
- ✅ Frissítés progress követése
- ✅ Rendszer statisztikák
- ✅ Cron job kezelés
- ✅ Agent offline ellenőrzés

### 2.10 Szerver Gépek Kezelés
- ✅ Szerver gépek (machines) listázása
- ✅ Új szerver gép hozzáadása
- ✅ SSH kapcsolat tesztelése
- ✅ Agent telepítés
- ✅ Gép státusz monitoring
- ✅ Resource kapacitás megtekintése
- ✅ Gép részletek szerkesztése

### 2.11 Agent Kezelés
- ✅ Agentek listázása
- ✅ Agent részletek
- ✅ Agent API kulcs regenerálás
- ✅ Agent státusz monitoring
- ✅ Agent verzió követés
- ✅ Agent képességek megtekintése

### 2.12 Task Kezelés
- ✅ Taskek listázása
- ✅ Task státusz követés
- ✅ Task végrehajtás
- ✅ Task eredmények megtekintése
- ✅ Sikertelen taskek újrafuttatása

### 2.13 Audit Logok
- ✅ Rendszeresemények naplózása
- ✅ Felhasználói műveletek követése
- ✅ Audit logok keresése
- ✅ Szűrés (felhasználó, akció, erőforrás típus)
- ✅ IP cím és user agent naplózás

### 2.14 Monitoring Dashboard
- ✅ Valós idejű rendszer monitoring
- ✅ Health check endpoint
- ✅ Monitoring stream (SSE)
- ✅ Rendszer metrikák

### 2.15 Analytics
- ✅ Analytics dashboard (oldal létezik)
- ✅ Statisztikák és jelentések
- ✅ Szerver jelentések

### 2.16 Webhook Kezelés
- ✅ Webhook-ok listázása
- ✅ Webhook létrehozása
- ✅ Webhook szerkesztése
- ✅ Webhook tesztelése
- ✅ Webhook aktiválás/deaktiválás

### 2.17 Téma Szerkesztő
- ✅ Téma beállítások kezelése
- ✅ Színválasztó
- ✅ Betűtípus beállítások

### 2.18 Debug Eszközök
- ✅ Debug oldal
- ✅ Rendszer információk
- ✅ Port ellenőrzés

---

## 3. Felhasználói Dashboard

### 3.1 Főoldal
- ✅ Üdvözlő üzenet
- ✅ Statisztikák:
  - Szervereim száma
  - Aktív előfizetések
  - Online szerverek
  - Offline szerverek
- ✅ Gyors műveletek:
  - Új szerver rendelés
  - Számlázás
  - Támogatás
- ✅ Szervereim listája

### 3.2 Szerver Kezelés (Felhasználó)
- ✅ Szervereim listázása
- ✅ Szerver részletek megtekintése
- ✅ Szerver műveletek:
  - Indítás (start)
  - Leállítás (stop)
  - Újraindítás (restart)
- ✅ Szerver státusz követés
- ✅ Előfizetés információk

### 3.3 Szerver Részletek (Felhasználó)
- ✅ Szerver információk
- ✅ Szerver műveletek
- ✅ Előfizetés információk
- ✅ Kapcsolódási információk (IP:Port)

### 3.4 Számlázás
- ✅ Számlák listázása
- ✅ Előfizetések listázása
- ✅ Számla részletek
- ✅ Számla letöltés (ha PDF elérhető)
- ✅ Fizetési információk

### 3.5 Beállítások
- ✅ Profil szerkesztés
- ✅ Jelszó változtatás
- ✅ Email módosítás
- ✅ Avatar feltöltés

### 3.6 Támogatás
- ✅ Ticketek listázása
- ✅ Új ticket létrehozása
- ✅ Ticket részletek
- ✅ Válasz küldése ticketre
- ✅ Ticket státusz követés

---

## 4. Szerver Kezelés

### 4.1 Szerver Rendelés
- ✅ Játék típus választás:
  - ARK
  - MINECRAFT
  - CSGO
  - RUST
  - VALHEIM
  - SEVEN_DAYS_TO_DIE
  - OTHER
- ✅ Árazási csomag választás
- ✅ Szerver név megadása
- ✅ Maximum játékosok száma
- ✅ Port automatikus generálás
- ✅ Szerver létrehozás

### 4.2 Szerver Provisioning
- ✅ Automatikus szerver provisioning
- ✅ Agent kiválasztás
- ✅ Machine kiválasztás
- ✅ Task létrehozás
- ✅ Háttérben feldolgozás

### 4.3 Szerver Műveletek
- ✅ **START** - Szerver indítása
- ✅ **STOP** - Szerver leállítása
- ✅ **RESTART** - Szerver újraindítása
- ✅ **UPDATE** - Szerver frissítése
- ✅ **BACKUP** - Backup készítése
- ✅ **DELETE** - Szerver törlése

### 4.4 Szerver Monitoring
- ✅ Valós idejű státusz követés (SSE)
- ✅ Resource használat (CPU, RAM, Disk)
- ✅ Játékosok száma
- ✅ Szerver metrikák
- ✅ Logok streamelése

### 4.5 Szerver Konfiguráció
- ✅ Konfiguráció szerkesztése
- ✅ JSON alapú konfiguráció
- ✅ Resource limits beállítása
- ✅ Szerver sablonok

### 4.6 Fájlkezelés
- ✅ Fájlkezelő (file manager)
- ✅ Fájlok listázása
- ✅ Fájl feltöltés
- ✅ Fájl letöltés
- ✅ Fájl törlés
- ✅ Fájl szerkesztés

### 4.7 Konzol Hozzáférés
- ✅ Szerver konzol megtekintése
- ✅ Parancs küldése
- ✅ Valós idejű output

### 4.8 Backup Kezelés
- ✅ Backup készítése
- ✅ Backup-ok listázása
- ✅ Backup letöltése
- ✅ Backup visszaállítása
- ✅ Backup törlése

### 4.9 Szerver Logok
- ✅ Logok megtekintése
- ✅ Logok streamelése
- ✅ Log szűrés
- ✅ Log exportálás

---

## 5. Számlázás és Fizetés

### 5.1 Fizetési Provider-ek
- ✅ **Stripe** integráció
- ✅ **Revolut** támogatás (séma szinten)
- ✅ **PayPal** támogatás (séma szinten)

### 5.2 Előfizetések
- ✅ Előfizetés létrehozása
- ✅ Előfizetés státusz követés:
  - ACTIVE
  - CANCELED
  - PAST_DUE
  - UNPAID
  - TRIALING
- ✅ Előfizetés megszakítás
- ✅ Előfizetés módosítás
- ✅ Automatikus megújítás
- ✅ Periódus kezelés (havi/éves)

### 5.3 Számlázás
- ✅ Automatikus számla generálás
- ✅ Számla státusz követés:
  - PENDING
  - PAID
  - FAILED
  - REFUNDED
  - CANCELED
- ✅ Számla szám generálás
- ✅ ÁFA kezelés (tax amount, tax rate)
- ✅ Nettó/bruttó összeg
- ✅ Számla tételek (JSON)
- ✅ Számla újraküldés email-ben

### 5.4 Számlázási Adatok
- ✅ Céginformációk kezelése:
  - Cégnév
  - Adószám
  - ÁFA szám
  - Cím
- ✅ Számlázási cím
- ✅ Fizetési információk
- ✅ Fizetési referencia

### 5.5 Kuponok
- ✅ Kupon kód rendszer
- ✅ Kupon típusok:
  - PERCENTAGE (százalékos kedvezmény)
  - FIXED_AMOUNT (fix összeg kedvezmény)
- ✅ Kupon érvényesség (validFrom, validUntil)
- ✅ Maximum használat száma
- ✅ Használat számlálás

### 5.6 PDF Generálás
- ✅ Számla PDF generálás (séma szinten)
- ✅ PDF URL tárolás

---

## 6. CMS (Content Management System)

### 6.1 Oldalak Kezelése
- ✅ Statikus oldalak létrehozása
- ✅ Oldal szerkesztése
- ✅ Slug (URL) kezelés
- ✅ Rich text content (JSON)
- ✅ Publikálás/elrejtés
- ✅ SEO beállítások (title, description)
- ✅ Többnyelvű támogatás

### 6.2 Blog Kezelés
- ✅ Blog bejegyzések létrehozása
- ✅ Blog szerkesztése
- ✅ Slug kezelés
- ✅ Excerpt (rövid leírás)
- ✅ Cover image
- ✅ Rich text content
- ✅ Publikálás/elrejtés
- ✅ Publikálási dátum
- ✅ Szerző hozzárendelés
- ✅ SEO beállítások
- ✅ Többnyelvű támogatás

### 6.3 FAQ Kezelés
- ✅ Kérdés-válasz párok létrehozása
- ✅ FAQ szerkesztése
- ✅ Sorrend beállítás (order)
- ✅ Aktiválás/deaktiválás
- ✅ Többnyelvű támogatás

### 6.4 Árazási Csomagok
- ✅ Árazási terv létrehozása
- ✅ Árazási terv szerkesztése
- ✅ Név és leírás
- ✅ Ár beállítás (price, currency)
- ✅ Intervallum (havi/éves)
- ✅ Stripe price ID
- ✅ Features lista (JSON)
- ✅ Sorrend beállítás
- ✅ Aktiválás/deaktiválás

### 6.5 Testimonials (Vélemények)
- ✅ Vélemény létrehozása
- ✅ Vélemény szerkesztése
- ✅ Név, szerep
- ✅ Tartalom
- ✅ Avatar
- ✅ Értékelés (rating 1-5)
- ✅ Sorrend beállítás
- ✅ Aktiválás/deaktiválás
- ✅ Többnyelvű támogatás

### 6.6 Team Tagok
- ✅ Team member létrehozása
- ✅ Team member szerkesztése
- ✅ Név, szerep
- ✅ Bio (életrajz)
- ✅ Avatar
- ✅ Email
- ✅ Social links (JSON)
- ✅ Sorrend beállítás
- ✅ Aktiválás/deaktiválás

### 6.7 Kezdőoldal Szekciók
- ✅ Homepage section létrehozása
- ✅ Section típusok:
  - hero
  - features
  - stats
  - cta
  - slideshow
- ✅ Title, subtitle
- ✅ Content (JSON)
- ✅ Image
- ✅ Button (text, link)
- ✅ Sorrend beállítás
- ✅ Aktiválás/deaktiválás
- ✅ Többnyelvű támogatás

### 6.8 Slideshow
- ✅ Slide létrehozása
- ✅ Slide szerkesztése
- ✅ Title, subtitle
- ✅ Media típus (image/video)
- ✅ Image vagy video URL
- ✅ Link
- ✅ Button text
- ✅ Sorrend beállítás
- ✅ Aktiválás/deaktiválás
- ✅ Többnyelvű támogatás

### 6.9 Játékok és Kategóriák
- ✅ Játék kategória létrehozása
- ✅ Kategória szerkesztése
- ✅ Kategória név, slug
- ✅ Leírás
- ✅ Icon
- ✅ Szín (hex color)
- ✅ Sorrend beállítás
- ✅ Aktiválás/deaktiválás
- ✅ Játék létrehozása
- ✅ Játék szerkesztése
- ✅ Játék név, slug
- ✅ Leírás
- ✅ Image
- ✅ Kategória hozzárendelés
- ✅ Sorrend beállítás
- ✅ Aktiválás/deaktiválás
- ✅ Többnyelvű támogatás

### 6.10 Téma Beállítások
- ✅ Téma konfiguráció kezelése
- ✅ Key-value alapú beállítások
- ✅ JSON alapú konfiguráció

### 6.11 Fájl Feltöltés
- ✅ Kép feltöltés
- ✅ Video feltöltés
- ✅ Uploads mappa kezelés

---

## 7. Támogatási Rendszer

### 7.1 Ticket Kezelés
- ✅ Új ticket létrehozása
- ✅ Ticket kategóriák:
  - TECHNICAL
  - BILLING
  - GENERAL
  - SERVER_ISSUE
- ✅ Ticket státusz:
  - OPEN
  - IN_PROGRESS
  - WAITING_FOR_USER
  - CLOSED
- ✅ Prioritás:
  - LOW
  - MEDIUM
  - HIGH
  - URGENT
- ✅ Subject (tárgy)
- ✅ Üzenetek kezelése

### 7.2 Üzenetek
- ✅ Válasz küldése ticketre
- ✅ Admin válaszok
- ✅ Felhasználói válaszok
- ✅ Üzenet időbélyeg
- ✅ Üzenet tartalom

### 7.3 Ticket Listázás
- ✅ Ticketek listázása
- ✅ Szűrés (státusz, prioritás, kategória)
- ✅ Keresés
- ✅ Rendezés

---

## 8. Rendszerbeállítások és Karbantartás

### 8.1 Karbantartási Mód
- ✅ Karbantartási mód be/kikapcsolása
- ✅ Maintenance page megjelenítése
- ✅ Session ellenőrzés
- ✅ Admin hozzáférés karbantartás alatt

### 8.2 Rendszer Frissítés
- ✅ Frissítés ellenőrzése (Git)
- ✅ Frissítés végrehajtása
- ✅ Progress követés
- ✅ Frissítés státusz
- ✅ Frissítés logok
- ✅ Frissítés reset

### 8.3 Rendszer Statisztikák
- ✅ Rendszer információk
- ✅ Verzió információk
- ✅ Commit információk

### 8.4 Cron Job Kezelés
- ✅ Cron job végrehajtás
- ✅ Task feldolgozás
- ✅ Automatikus háttér folyamatok

### 8.5 Agent Monitoring
- ✅ Offline agentek ellenőrzése
- ✅ Heartbeat követés
- ✅ Agent státusz monitoring

### 8.6 Port Kezelés
- ✅ Port ellenőrzés
- ✅ Port foglaltság ellenőrzése

---

## 9. Agent-Based Architektúra

### 9.1 Agent Regisztráció
- ✅ Agent regisztráció API
- ✅ Agent ID kezelés
- ✅ API kulcs generálás
- ✅ Verzió követés

### 9.2 Agent Heartbeat
- ✅ Heartbeat endpoint
- ✅ Last heartbeat követés
- ✅ Offline detektálás

### 9.3 Agent Képességek
- ✅ Capabilities JSON
- ✅ Docker támogatás
- ✅ Systemd támogatás
- ✅ Egyéb képességek

### 9.4 Task Feldolgozás
- ✅ Task létrehozás
- ✅ Task végrehajtás
- ✅ Task státusz követés
- ✅ Task eredmények
- ✅ Hiba kezelés

### 9.5 Machine Kezelés
- ✅ Szerver gépek (machines) kezelése
- ✅ SSH kapcsolat
- ✅ SSH kulcs kezelés
- ✅ Machine státusz
- ✅ Resource kapacitás

---

## 10. Monitoring és Analytics

### 10.1 Valós Idejű Monitoring
- ✅ Server-Sent Events (SSE)
- ✅ Resource monitoring stream
- ✅ Szerver státusz stream
- ✅ Health check endpoint

### 10.2 Analytics Dashboard
- ✅ Analytics oldal (implementálva)
- ✅ Statisztikák
- ✅ Grafikonok (tervezett)

### 10.3 Jelentések
- ✅ Szerver jelentések
- ✅ Felhasználói jelentések
- ✅ Pénzügyi jelentések

### 10.4 Metrikák
- ✅ CPU használat
- ✅ RAM használat
- ✅ Disk használat
- ✅ Hálózati forgalom

---

## 11. Biztonsági Funkciók

### 11.1 Autentikáció
- ✅ Jelszó hashelés (bcrypt)
- ✅ Session kezelés (JWT)
- ✅ Email verifikáció
- ✅ Jelszó reset token
- ✅ OAuth integráció

### 11.2 Autentikáció
- ✅ Szerepkör alapú hozzáférés (RBAC)
- ✅ Route védelem
- ✅ API endpoint védelem
- ✅ Admin jogosultság ellenőrzés

### 11.3 Audit Logging
- ✅ Felhasználói műveletek naplózása
- ✅ Rendszeresemények naplózása
- ✅ IP cím naplózás
- ✅ User agent naplózás
- ✅ Timestamp naplózás

### 11.4 Biztonsági Beállítások
- ✅ 2FA támogatás (séma szinten)
- ✅ Two factor secret tárolás
- ✅ Session timeout
- ✅ Secure cookie beállítások

---

## 12. Többnyelvűség

### 12.1 Nyelvek
- ✅ Magyar (hu) - alapértelmezett
- ✅ Angol (en)

### 12.2 Lokalizáció
- ✅ Middleware alapú nyelvváltás
- ✅ URL alapú nyelv kezelés (`/hu/...`, `/en/...`)
- ✅ Server-side fordítások
- ✅ Client-side fordítások
- ✅ Email fordítások

### 12.3 Fordítási Fájlok
- ✅ `public/locales/hu/common.json`
- ✅ `public/locales/en/common.json`
- ✅ Dinamikus fordítás betöltés

---

## 13. További Funkciók

### 13.1 Email Rendszer
- ✅ Nodemailer integráció
- ✅ Hestia CP SMTP konfiguráció
- ✅ Email sablonok:
  - Verifikációs email
  - Jelszó reset email
  - Számla email
- ✅ Többnyelvű email támogatás

### 13.2 API Dokumentáció
- ✅ API v1 endpoint
- ✅ API dokumentáció (tervezett)

### 13.3 Webhook Rendszer
- ✅ Webhook konfiguráció
- ✅ Webhook események
- ✅ Webhook tesztelés
- ✅ Secret kezelés

### 13.4 Szerver Sablonok
- ✅ Szerver sablonok kezelése
- ✅ Sablon alapú provisioning

### 13.5 Debug Eszközök
- ✅ Debug oldal
- ✅ Rendszer információk
- ✅ Port ellenőrzés

---

## 📊 Összefoglaló Statisztikák

### Adatbázis Modell
- **25+ modell** a Prisma sémában
- **10+ enum** típus
- **Teljes kapcsolatok** (relations) kezelése

### API Endpoint-ok
- **100+ API route** implementálva
- RESTful API design
- Server-Sent Events (SSE) támogatás

### Frontend Komponensek
- **80+ React komponens**
- Admin komponensek
- Felhasználói komponensek
- CMS komponensek
- UI komponensek

### Oldalak
- **50+ oldal** (routes)
- Admin oldalak
- Felhasználói oldalak
- Publikus oldalak
- API oldalak

---

## 🎯 Főbb Képességek

1. ✅ **Teljes körű CMS** - Dinamikus tartalomkezelés
2. ✅ **Szerver Hosting** - Gaming szerver kezelés
3. ✅ **Számlázás** - Több provider támogatással
4. ✅ **Admin Vezérlőpult** - Teljes rendszerkezelés
5. ✅ **Támogatás** - Ticket rendszer
6. ✅ **Monitoring** - Valós idejű követés
7. ✅ **Agent Architektúra** - Skálázható szerver kezelés
8. ✅ **Többnyelvűség** - Magyar/Angol
9. ✅ **Biztonság** - RBAC, audit logging
10. ✅ **Automatizáció** - Task feldolgozás, cron jobs

---

## 📝 Megjegyzések

- ✅ = Implementálva és működik
- ⏳ = Tervezett vagy részben implementálva
- 🔧 = Szükséges konfiguráció vagy beállítás

---

**Utolsó frissítés:** 2024


