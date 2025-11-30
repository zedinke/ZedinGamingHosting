# OAuth Beállítási Útmutató (Google és Discord)

Ez az útmutató leírja, hogyan kell beállítani a Google és Discord OAuth bejelentkezést a Zed Gaming Hosting rendszerben.

## Előfeltételek

1. A `.env` fájlban be kell állítani a következő változókat:
   - `NEXTAUTH_URL` - Az alkalmazás teljes URL-je (pl. `https://yourdomain.com` vagy `http://localhost:3000`)
   - `NEXTAUTH_SECRET` - Egy erős secret kulcs (generálás: `openssl rand -base64 32`)

## Google OAuth Beállítása

### 1. Google Cloud Console Beállítás

1. Menj a [Google Cloud Console](https://console.cloud.google.com/) oldalra
2. Válassz ki egy projektet vagy hozz létre újat
3. Menj az **APIs & Services** > **Credentials** menüpontra
4. Kattints a **Create Credentials** > **OAuth client ID** gombra
5. Válaszd ki az **Application type**-ot: **Web application**
6. Add meg a következő adatokat:
   - **Name**: Zed Gaming Hosting (vagy bármilyen nevet szeretnél)
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (fejlesztéshez)
     - `https://yourdomain.com` (production-hez)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/callback/google` (fejlesztéshez)
     - `https://yourdomain.com/api/auth/callback/google` (production-hez)

7. Kattints a **Create** gombra
8. Másold ki a **Client ID**-t és a **Client secret**-et

### 2. .env Fájl Frissítése

Add hozzá a következő sorokat a `.env` fájlhoz:

```env
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
```

## Discord OAuth Beállítása

### 1. Discord Developer Portal Beállítás

1. Menj a [Discord Developer Portal](https://discord.com/developers/applications) oldalra
2. Kattints a **New Application** gombra
3. Add meg az alkalmazás nevét (pl. "Zed Gaming Hosting")
4. Menj a **OAuth2** > **General** menüpontra
5. Add meg a következő **Redirects**:
   - `http://localhost:3000/api/auth/callback/discord` (fejlesztéshez)
   - `https://yourdomain.com/api/auth/callback/discord` (production-hez)

6. Kattints a **Save Changes** gombra
7. Másold ki a **Client ID**-t
8. Menj a **OAuth2** > **General** menüpontra
9. Kattints a **Reset Secret** gombra, majd másold ki az új **Client Secret**-et

### 2. .env Fájl Frissítése

Add hozzá a következő sorokat a `.env` fájlhoz:

```env
DISCORD_CLIENT_ID=your-discord-client-id-here
DISCORD_CLIENT_SECRET=your-discord-client-secret-here
```

## Fontos Megjegyzések

### Callback URL-ek

A callback URL-ek **pontosan** ezeknek kell lenniük:
- Google: `[NEXTAUTH_URL]/api/auth/callback/google`
- Discord: `[NEXTAUTH_URL]/api/auth/callback/discord`

Ahol `[NEXTAUTH_URL]` a `.env` fájlban beállított `NEXTAUTH_URL` értéke.

### Production Beállítások

Production környezetben:
1. **MINDIG** használj `https://` protokollt a `NEXTAUTH_URL`-ben
2. **MINDIG** használj `https://` protokollt a callback URL-ekben
3. Győződj meg róla, hogy a domain SSL tanúsítvány érvényes

### Fejlesztési Környezet

Fejlesztési környezetben:
- Használhatod a `http://localhost:3000` URL-t
- A callback URL-ek is `http://localhost:3000/api/auth/callback/[provider]` formátumúak

## Tesztelés

1. Indítsd újra a Next.js szervert (ha fut)
2. Menj a login oldalra: `http://localhost:3000/hu/login` (vagy a production URL)
3. Kattints a **Bejelentkezés Google-lal** vagy **Bejelentkezés Discord-dal** gombra
4. Engedélyezd a hozzáférést a provider oldalán
5. Sikeres bejelentkezés esetén át kell irányítania a dashboard oldalra

## Hibaelhárítás

### 404-es hiba a callback URL-en

Ha 404-es hibát kapsz a callback URL-en:
1. Ellenőrizd, hogy a `NEXTAUTH_URL` helyesen van-e beállítva a `.env` fájlban
2. Ellenőrizd, hogy a callback URL-ek pontosan egyeznek-e a provider beállításaival
3. Győződj meg róla, hogy a Next.js szerver fut
4. Ellenőrizd a böngésző konzolt és a szerver logokat hibákért

### "Invalid redirect URI" hiba

Ha "Invalid redirect URI" hibát kapsz:
1. Ellenőrizd, hogy a callback URL-ek pontosan egyeznek-e a provider beállításaival
2. Győződj meg róla, hogy a `NEXTAUTH_URL` helyesen van beállítva
3. Ellenőrizd, hogy nincs-e extra perjel vagy karakter a callback URL végén

### OAuth gomb nem működik

Ha az OAuth gomb nem működik:
1. Ellenőrizd a böngésző konzolt JavaScript hibákért
2. Ellenőrizd, hogy a `GOOGLE_CLIENT_ID` és `DISCORD_CLIENT_ID` be vannak-e állítva
3. Ellenőrizd a szerver logokat

## További Információk

- [NextAuth.js Dokumentáció](https://next-auth.js.org/)
- [Google OAuth Dokumentáció](https://developers.google.com/identity/protocols/oauth2)
- [Discord OAuth Dokumentáció](https://discord.com/developers/docs/topics/oauth2)

