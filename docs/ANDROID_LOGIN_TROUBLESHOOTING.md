# Android Bejelentkezési Problémák Hibaelhárítása

## 🔍 Gyakori Problémák és Megoldások

### 1. "Hibás email cím vagy jelszó" hiba

**Lehetséges okok:**
- A jelszó nem egyezik
- Az email cím nem egyezik (kis/nagybetű érzékeny)
- Az email cím nincs megerősítve

**Megoldás:**
1. Ellenőrizd a weboldalon, hogy be tudsz-e jelentkezni ugyanazokkal az adatokkal
2. Ellenőrizd, hogy az email cím megerősítve van-e (nézd meg az emailt)
3. Próbáld meg újra a bejelentkezést

### 2. "Kérjük, erősítsd meg az email címedet" hiba

**Ok:** Az email cím nincs megerősítve

**Megoldás:**
1. Menj a weboldalra
2. Jelentkezz be
3. Nézd meg az emailt és kattints a megerősítő linkre
4. Próbáld meg újra az Android alkalmazásban

### 3. "Hálózati hiba" vagy "Connection refused"

**Lehetséges okok:**
- A backend nem fut
- Rossz API_BASE_URL
- Internetkapcsolat probléma

**Megoldás:**
1. Ellenőrizd a `gradle.properties` fájlban az `API_BASE_URL`-t:
   ```properties
   API_BASE_URL=https://zedgaminghosting.hu
   ```
2. Ellenőrizd, hogy a backend fut-e
3. Teszteld a böngészőben: `https://zedgaminghosting.hu/api/auth/mobile-login`
4. Ha emulátorban vagy, használd: `http://10.0.2.2:3000` (ha localhost-on fut)

### 4. Bejelentkezés sikeres, de nem marad bejelentkezve

**Ok:** Session cookie nem mentődik el helyesen

**Megoldás:**
1. Ellenőrizd az Android Studio Logcat-ot hibákért
2. Nézd meg, hogy a cookie-k mentésre kerülnek-e
3. Próbáld meg újraindítani az alkalmazást

### 5. "401 Unauthorized" hiba az API hívásoknál

**Ok:** Session cookie nem küldődik el a kérésekben

**Megoldás:**
1. Ellenőrizd, hogy a bejelentkezés után a cookie-k mentésre kerülnek-e
2. Nézd meg az ApiClient cookie kezelését
3. Próbáld meg újra bejelentkezni

## 🧪 Tesztelési Lépések

### 1. Backend API Tesztelése

Teszteld a mobile-login endpoint-ot curl-lal:

```bash
curl -X POST https://zedgaminghosting.hu/api/auth/mobile-login \
  -H "Content-Type: application/json" \
  -d '{"email":"teszt@example.com","password":"jelszo123"}' \
  -v
```

Ellenőrizd:
- Visszaadja-e a `success: true`-t
- Van-e `Set-Cookie` header a válaszban
- Milyen hibaüzenetet ad vissza

### 2. Android Studio Logcat

Nézd meg az Android Studio Logcat-ot:
1. Android Studio → View → Tool Windows → Logcat
2. Szűrj: `ZedGamingHosting` vagy `ApiClient`
3. Nézd meg a hibaüzeneteket

### 3. Network Inspector

Használd az Android Studio Network Inspector-t:
1. Run → Edit Configurations
2. Profiling → Enable advanced profiling
3. Futtasd az alkalmazást
4. Nézd meg a hálózati kéréseket

## 🔧 Debug Mód

Az alkalmazásban engedélyezd a debug módot:

1. Nyisd meg: `app/src/main/java/com/zedingaming/hosting/data/api/ApiClient.kt`
2. Ellenőrizd, hogy a `loggingInterceptor` be van-e kapcsolva:
   ```kotlin
   level = if (BuildConfig.DEBUG) {
       HttpLoggingInterceptor.Level.BODY
   }
   ```
3. Build debug változatot
4. Nézd meg a Logcat-ot a teljes HTTP válaszokért

## 📝 Ellenőrző Lista

- [ ] Backend fut és elérhető
- [ ] API_BASE_URL helyesen van beállítva
- [ ] Email cím megerősítve van
- [ ] Jelszó helyes
- [ ] Internetkapcsolat működik
- [ ] Android Studio Logcat-ot nézted
- [ ] Cookie-k mentésre kerülnek
- [ ] Session cookie küldésre kerül a kérésekben

## 🆘 További Segítség

Ha még mindig nem működik:

1. **Nézd meg a backend logokat:**
   - Ha PM2-vel fut: `pm2 logs`
   - Ha npm run dev: nézd meg a terminált

2. **Teszteld a weboldalt:**
   - Be tudsz-e jelentkezni a weboldalon?
   - Működik-e a weboldal?

3. **Ellenőrizd a környezeti változókat:**
   - `NEXTAUTH_SECRET` be van-e állítva?
   - `NEXTAUTH_URL` helyes-e?

4. **Nézd meg a hálózati kéréseket:**
   - Android Studio Network Inspector
   - Chrome DevTools (ha webview-t használsz)

---

**Ha továbbra sem működik, küldj egy screenshot-ot a hibaüzenetről!** 📸

