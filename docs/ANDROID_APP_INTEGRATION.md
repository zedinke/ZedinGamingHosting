# Android Alkalmazás Integráció - Beállítási Útmutató

Ez a dokumentum leírja, hogyan kell beállítani az Android alkalmazást és a backend integrációt.

## ✅ Elvégzett Módosítások

### Backend Módosítások

1. **Prisma Séma Bővítés**
   - `PushToken` modell hozzáadva
   - `User` modellhez `pushTokens` kapcsolat hozzáadva
   - Migráció szükséges: `npm run db:push`

2. **API Endpoint-ok**
   - `/api/user/push-token` - Push token regisztrálása/törlése
   - `/api/auth/mobile-login` - Mobile app bejelentkezés

3. **Firebase Admin SDK Integráció**
   - `lib/push-notifications.ts` - Push notification küldő szolgáltatás
   - `package.json` - `firebase-admin` függőség hozzáadva

4. **Push Notification Küldés**
   - Szerver állapot változásoknál automatikus push notification
   - Notification létrehozás adatbázisban
   - Admin és user route-okban is implementálva

### Android Alkalmazás

1. **Session Kezelés**
   - NextAuth session cookie kezelés
   - CookieJar implementáció
   - Mobile login endpoint használata

2. **API Integráció**
   - AuthService - Bejelentkezés, regisztráció
   - ServerService - Szerver kezelés
   - PushTokenService - Push token regisztráció
   - NotificationService - Értesítések

3. **Firebase FCM**
   - FcmService - Push notification fogadás
   - Automatikus token regisztráció bejelentkezés után

## 🔧 Beállítási Lépések

### 1. Adatbázis Migráció

```bash
# Prisma client generálása
npm run db:generate

# Adatbázis séma frissítése
npm run db:push
```

### 2. Firebase Beállítás

#### A) Firebase Projekt Létrehozása

1. Menj a [Firebase Console](https://console.firebase.google.com/)-ba
2. Hozz létre egy új projektet vagy használj egy meglévőt
3. Add hozzá az Android alkalmazást

#### B) Service Account Kulcs Letöltése

1. Firebase Console → Project Settings → Service Accounts
2. Kattints a "Generate new private key" gombra
3. Töltsd le a JSON fájlt
4. Másold a tartalmát a `.env` fájlba:

```env
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'
```

**FONTOS**: A JSON-t egyetlen sorban kell beilleszteni, escape karakterekkel!

#### C) Firebase Admin SDK Telepítése

```bash
npm install firebase-admin
```

### 3. Android Alkalmazás Beállítása

#### A) Firebase Beállítás Android Studio-ban

1. Nyisd meg a `ZedGamingHosting-Android` projektet Android Studio-ban
2. Firebase Console → Project Settings → Your apps → Android
3. Add meg a package name-t: `com.zedingaming.hosting`
4. Töltsd le a `google-services.json` fájlt
5. Helyezd el az `app/` mappába

#### B) API Base URL Beállítása

Szerkeszd a `gradle.properties` fájlt:

```properties
API_BASE_URL=https://zedgaminghosting.hu
```

Vagy ha másik szervert használsz:

```properties
API_BASE_URL=https://your-domain.com
```

### 4. Tesztelés

#### Backend Tesztelés

1. Indítsd el a backend szervert: `npm run dev`
2. Teszteld a push token API-t:
   ```bash
   curl -X POST http://localhost:3000/api/user/push-token \
     -H "Content-Type: application/json" \
     -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
     -d '{"token":"test-token","platform":"android"}'
   ```

#### Android Alkalmazás Tesztelés

1. Build és install az Android Studio-ban
2. Bejelentkezés tesztelése
3. Szerverek listázása
4. Szerver indítás/leállítás
5. Push notification tesztelése (backend-en indítsd el/állítsd le egy szervert)

## 🔔 Push Notification Tesztelése

### Manuális Teszt

1. Bejelentkezz az Android alkalmazásba
2. A push token automatikusan regisztrálódik
3. A backend-en indítsd el vagy állítsd le egy szervert
4. Az Android eszközön meg kell jelennie egy push notification-nek

### Firebase Console-ból Tesztelés

1. Firebase Console → Cloud Messaging
2. "Send test message"
3. Add meg az FCM token-t (az alkalmazás logjában látható)
4. Küldj egy teszt üzenetet

## 🐛 Hibaelhárítás

### Backend Hibák

**Hiba**: `FIREBASE_SERVICE_ACCOUNT nincs beállítva`
- **Megoldás**: Ellenőrizd a `.env` fájlt, hogy tartalmazza-e a `FIREBASE_SERVICE_ACCOUNT` változót

**Hiba**: `firebase-admin nincs telepítve`
- **Megoldás**: Futtasd: `npm install firebase-admin`

**Hiba**: Prisma séma hiba
- **Megoldás**: Futtasd: `npm run db:generate && npm run db:push`

### Android Hibák

**Hiba**: `google-services.json not found`
- **Megoldás**: Töltsd le a fájlt a Firebase Console-ból és helyezd el az `app/` mappába

**Hiba**: Bejelentkezés nem működik
- **Megoldás**: 
  - Ellenőrizd az API_BASE_URL-t
  - Ellenőrizd, hogy a backend fut-e
  - Nézd meg a logokat

**Hiba**: Push notifications nem jönnek
- **Megoldás**:
  - Ellenőrizd, hogy a Firebase be van-e állítva
  - Ellenőrizd, hogy a push token regisztrálva van-e
  - Ellenőrizd az Android eszközön a notification engedélyeket

## 📝 Következő Lépések

1. **Adatbázis migráció futtatása**: `npm run db:push`
2. **Firebase beállítása**: Service account kulcs hozzáadása
3. **Android Studio**: Projekt megnyitása és `google-services.json` hozzáadása
4. **Tesztelés**: Build és futtatás Android Studio-ban

## 🔐 Biztonsági Megjegyzések

- A `FIREBASE_SERVICE_ACCOUNT` soha ne legyen commitolva a git repository-ba
- A `google-services.json` fájl sem legyen commitolva (már benne van a .gitignore-ban)
- Használj HTTPS-t production környezetben
- A session cookie-k httpOnly flag-gel vannak beállítva biztonsági okokból

## 📞 Támogatás

Ha problémáid vannak:
1. Ellenőrizd a backend logokat
2. Ellenőrizd az Android Studio logcat-ot
3. Nézd meg a Firebase Console-t
4. Ellenőrizd a dokumentációt

---

**Sikeres integrációt!** 🚀

