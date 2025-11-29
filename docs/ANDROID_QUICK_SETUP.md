# Android Alkalmazás Gyors Beállítás - Hol Találod?

## 📍 1. google-services.json Fájl

### Hol találod?

**Firebase Console-ból kell letölteni:**

1. Menj a [Firebase Console](https://console.firebase.google.com/)-ba
2. Válaszd ki a projektet (vagy hozz létre egy újat)
3. Kattints a **⚙️ Project Settings** (fogaskerék ikon) gombra (bal oldali menüben)
4. Görgess le a **Your apps** szekcióhoz
5. Ha nincs Android app, kattints az **Add app** → **Android** ikonra
6. Add meg:
   - **Package name**: `com.zedingaming.hosting`
   - **App nickname**: ZedinGaming Hosting (opcionális)
7. Kattints a **Register app** gombra
8. Töltsd le a **google-services.json** fájlt
9. Helyezd el a fájlt: `ZedGamingHosting-Android/app/google-services.json`

### Ha már van Firebase projekt:

1. Firebase Console → Project Settings
2. Görgess le a **Your apps** szekcióhoz
3. Ha van Android app, kattints rá
4. Töltsd le újra a `google-services.json` fájlt

---

## 📍 2. API Base URL

### Hol találod?

A **production URL** a README.md fájlban van megadva:

**Production URL**: `https://zedgaminghosting.hu`

### Hova kell beírni?

1. Nyisd meg a `ZedGamingHosting-Android/gradle.properties` fájlt
2. Keress rá erre a sorra:
   ```properties
   API_BASE_URL=https://zedgaminghosting.hu
   ```
3. Ha nincs benne, add hozzá:
   ```properties
   API_BASE_URL=https://zedgaminghosting.hu
   ```

### Fejlesztéshez (localhost):

Ha a saját gépeden tesztelsz, használd:
```properties
API_BASE_URL=http://10.0.2.2:3000
```
*(Az `10.0.2.2` az Android emulátorban a localhost-ot jelenti)*

---

## 📋 Gyors Checklist

- [ ] Firebase Console → Project Settings → google-services.json letöltése
- [ ] `google-services.json` elhelyezése: `ZedGamingHosting-Android/app/`
- [ ] `gradle.properties` fájlban: `API_BASE_URL=https://zedgaminghosting.hu`

---

## 🎯 Lépésről Lépésre

### 1. Firebase beállítás (5 perc)

```
1. Menj: https://console.firebase.google.com/
2. Válaszd ki/hozz létre projektet
3. Project Settings (⚙️ ikon)
4. Add app → Android
5. Package name: com.zedingaming.hosting
6. Download google-services.json
7. Másold: ZedGamingHosting-Android/app/google-services.json
```

### 2. API URL beállítás (1 perc)

```
1. Nyisd meg: ZedGamingHosting-Android/gradle.properties
2. Add hozzá vagy módosítsd:
   API_BASE_URL=https://zedgaminghosting.hu
```

### 3. Build és tesztelés

```
1. Android Studio → Open → ZedGamingHosting-Android
2. Várj a Gradle szinkronizálásra
3. Run (Shift+F10)
```

---

## ❓ Gyakori Kérdések

**Q: Nincs Firebase projektem, mit csináljak?**
A: Hozz létre egy újat a Firebase Console-ban. Ingyenes és 5 perc.

**Q: Melyik Firebase projektet használjam?**
A: Bármelyiket, vagy hozz létre egy újat csak az Android app-hoz.

**Q: A localhost URL nem működik?**
A: Android emulátorban használd: `http://10.0.2.2:3000`
   Valós eszközön: `http://[SAJAT_IP_CÍMED]:3000`

**Q: Hol van a gradle.properties fájl?**
A: `ZedGamingHosting-Android/gradle.properties` (projekt gyökérben)

---

## 🔗 Hasznos Linkek

- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Dokumentáció](https://firebase.google.com/docs/android/setup)
- Production URL: https://zedgaminghosting.hu

---

**Kész! Most már tudod, hol találod ezeket!** ✅

