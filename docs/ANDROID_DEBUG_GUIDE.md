# Android Alkalmazás Debug Útmutató

## 🔍 "Hibás kérés" (400 Bad Request) Hiba

Ez a hiba azt jelenti, hogy a kérés elérte a szervert, de a szerver nem tudja feldolgozni.

## 📋 Ellenőrző Lista

### 1. API Base URL Ellenőrzése

**Android Studio-ban:**
1. Nyisd meg: `app/build.gradle.kts`
2. Nézd meg a `buildConfigField` sort
3. Ellenőrizd a `gradle.properties` fájlt:
   ```properties
   API_BASE_URL=https://zedgaminghosting.hu
   ```

**Fontos**: Az URL-nek `/`-re kell végződnie, vagy NEM kell `/` a végén (Retrofit automatikusan hozzáadja).

### 2. Logcat Ellenőrzése

**Android Studio → Logcat:**
1. Szűrj: `AuthViewModel` vagy `OkHttp`
2. Nézd meg a következő log üzeneteket:
   - `Login attempt: email=...`
   - `API Base URL: ...`
   - `Response code: ...`
   - `Response body: ...` vagy `Error body: ...`

### 3. Backend Logok Ellenőrzése

**Backend terminálban vagy PM2 logokban:**
```bash
pm2 logs zedingaming
# vagy
npm run dev
```

Nézd meg:
- `Mobile login request received`
- `Request body: ...`
- Bármilyen hibaüzenet

## 🧪 Manuális Tesztelés

### Backend Endpoint Tesztelése

```bash
curl -X POST https://zedgaminghosting.hu/api/auth/mobile-login \
  -H "Content-Type: application/json" \
  -d '{"email":"geleako@gmail.com","password":"jelszo123"}' \
  -v
```

**Várt válasz:**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "geleako@gmail.com",
    "name": "...",
    "role": "USER",
    "image": null
  },
  "error": null
}
```

### Android Logcat Várt Üzenetek

**Sikeres kérés:**
```
AuthViewModel: Login attempt: email=geleako@gmail.com
AuthViewModel: API Base URL: https://zedgaminghosting.hu
OkHttp: --> POST https://zedgaminghosting.hu/api/auth/mobile-login
OkHttp: Content-Type: application/json
OkHttp: {"email":"geleako@gmail.com","password":"..."}
OkHttp: <-- 200 OK
OkHttp: {"success":true,"user":{...},"error":null}
AuthViewModel: Response code: 200
AuthViewModel: Response isSuccessful: true
```

**Hiba esetén:**
```
AuthViewModel: Login attempt: email=geleako@gmail.com
OkHttp: --> POST https://zedgaminghosting.hu/api/auth/mobile-login
OkHttp: <-- 400 Bad Request
OkHttp: {"success":false,"error":"Email és jelszó megadása kötelező","user":null}
AuthViewModel: HTTP Error: 400
AuthViewModel: Error body: {"success":false,"error":"..."}
AuthViewModel: Final error message: ...
```

## 🐛 Gyakori Problémák

### 1. API_BASE_URL Rossz

**Tünet**: Connection refused vagy timeout

**Megoldás**: 
- Ellenőrizd a `gradle.properties` fájlt
- Rebuild Project
- Ellenőrizd, hogy a backend fut-e

### 2. Kérés Body Üres

**Tünet**: 400 Bad Request, "Email és jelszó megadása kötelező"

**Megoldás**:
- Nézd meg a Logcat-ban az OkHttp logokat
- Ellenőrizd, hogy a kérés body tartalmazza-e az email és password mezőket

### 3. Content-Type Hiányzik

**Tünet**: 400 Bad Request

**Megoldás**: 
- A Retrofit automatikusan beállítja, de ellenőrizd a Logcat-ban

### 4. CORS vagy SSL Probléma

**Tünet**: Network error vagy SSL handshake failed

**Megoldás**:
- Ellenőrizd, hogy HTTPS-t használsz-e
- Ellenőrizd a backend CORS beállításokat

## 📸 Debug Információk Küldése

Ha továbbra sem működik, küldj:

1. **Logcat teljes output:**
   - Szűrj: `AuthViewModel` vagy `OkHttp`
   - Másold ki az összes releváns sort

2. **Backend logok:**
   - PM2: `pm2 logs zedingaming --lines 50`
   - vagy npm run dev output

3. **API_BASE_URL értéke:**
   - Logcat-ban: `API Base URL: ...`

4. **curl teszt eredménye:**
   - A fenti curl parancs output-ja

---

**Most nézd meg a Logcat-ot és küldj a részletes hibaüzeneteket!** 🔍

