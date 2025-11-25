# Email Beállítás - Összefoglaló

## ✅ Beállított rekordok

### 1. SPF rekord
- **Név:** `zedgaminghosting.hu` (vagy `@`)
- **Típus:** `TXT`
- **Érték:** `v=spf1 a mx ip4:116.203.226.140 -all`
- **Státusz:** ✅ Beállítva

### 2. DKIM rekord
- **Név:** `default._domainkey.zedgaminghosting.hu`
- **Típus:** `TXT`
- **Érték:** `v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...`
- **Státusz:** ✅ Beállítva és generálva
- **Selector:** `default`

### 3. DMARC rekord
- **Név:** `_dmarc.zedgaminghosting.hu`
- **Típus:** `TXT`
- **Érték:** `v=DMARC1; p=quarantine; pct=100`
- **Státusz:** ✅ Beállítva

### 4. Exim4
- **Státusz:** ✅ Fut és újraindítva
- **DKIM aláírás:** ✅ Aktív

---

## Következő lépések

### 1. DNS propagáció várása (1-2 óra)

A DNS változások propagálódása időt vesz igénybe. Ellenőrizd:

```bash
# Google DNS ellenőrzése
dig @8.8.8.8 TXT zedgaminghosting.hu +short | grep spf
dig @8.8.8.8 TXT default._domainkey.zedgaminghosting.hu +short

# Cloudflare DNS ellenőrzése
dig @1.1.1.1 TXT zedgaminghosting.hu +short | grep spf
dig @1.1.1.1 TXT default._domainkey.zedgaminghosting.hu +short
```

Ha mindkét DNS szerver látja a rekordokat, akkor propagálódott.

### 2. Email tesztelése

#### A) Mail-tester.com (ajánlott)

1. Menj a https://www.mail-tester.com/ oldalra
2. Másold ki a megadott email címet (pl. `test-xxxxx@mail-tester.com`)
3. Küldj egy emailt a rendszerből erre a címre:
   - Regisztráció során (email verifikáció)
   - Vagy használd a teszt endpoint-ot (ha van)
4. Várj 1-2 percet
5. Kattints a "Then check your score" gombra
6. **Cél: 8-10 pont** ✅

**Mit nézz:**
- SPF: ✅ PASS
- DKIM: ✅ PASS
- DMARC: ✅ PASS
- Reverse DNS: ✅ PASS

#### B) Gmail teszt

1. Küldj egy emailt egy Gmail címre
2. Nyisd meg az emailt a Gmail-ben
3. Kattints a három pontra (⋮) → **"Show original"**
4. Nézd meg az **"Authentication-Results"** részt:

```
Authentication-Results: mx.google.com;
       dkim=pass header.i=@zedgaminghosting.hu header.s=default;
       spf=pass (google.com: domain of info@zedgaminghosting.hu designates 116.203.226.140 as permitted sender) smtp.mailfrom=info@zedgaminghosting.hu;
       dmarc=pass (p=QUARANTINE sp=QUARANTINE dis=NONE) header.from=zedgaminghosting.hu
```

**Várt eredmény:**
- `dkim=pass` ✅
- `spf=pass` ✅
- `dmarc=pass` ✅

### 3. .env fájl ellenőrzése

Győződj meg róla, hogy a `.env` fájlban helyesen van beállítva:

```env
SMTP_HOST=localhost
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=info@zedgaminghosting.hu
SMTP_PASSWORD=email-jelszó
SMTP_FROM=info@zedgaminghosting.hu
```

**Fontos:** A `SMTP_FROM` címnek meg kell egyeznie a domain-nel (`@zedgaminghosting.hu`).

---

## Teljes ellenőrzési lista

- [x] SPF rekord beállítva
- [x] DKIM rekord beállítva és generálva
- [x] DMARC rekord beállítva
- [x] Exim4 fut és újraindítva
- [ ] DNS propagáció megtörtént (1-2 óra várás)
- [ ] Mail-tester.com score: 8-10 pont
- [ ] Gmail "Show original": `dkim=pass`, `spf=pass`, `dmarc=pass`
- [ ] `.env` fájlban helyes `SMTP_FROM` cím

---

## Ha még mindig nem működik

### 1. Várj tovább (24-48 óra)

A DNS propagáció és a Gmail cache akár 48 órát is igénybe vehet.

### 2. Ellenőrizd a mail logokat

```bash
# Exim4 logok
tail -50 /var/log/exim4/mainlog | grep -i dkim

# Vagy minden email kapcsolatos log
tail -100 /var/log/exim4/mainlog
```

### 3. DKIM selector ellenőrzése

```bash
# Jelenlegi selector
/usr/local/hestia/bin/v-list-mail-domain-dkim ZedGamingHosting zedgaminghosting.hu

# DNS rekord ellenőrzése
dig TXT default._domainkey.zedgaminghosting.hu +short
```

A selector-nek (`default`) meg kell egyeznie a DNS rekord nevével (`default._domainkey`).

### 4. SPF rekord formátum ellenőrzése

```bash
# SPF rekord
dig TXT zedgaminghosting.hu +short | grep spf

# Online ellenőrzés
# https://mxtoolbox.com/spf.aspx
```

**Helyes formátum:**
```
v=spf1 a mx ip4:116.203.226.140 -all
```

### 5. Email küldés tesztelése parancssorban

```bash
# Küldj egy teszt emailt
echo "Test email" | mail -s "DKIM Test" -a "From: info@zedgaminghosting.hu" your-email@gmail.com

# Nézd meg a logokat
tail -f /var/log/exim4/mainlog
```

---

## Sikeres beállítás jelei

1. **Mail-tester.com:** 8-10 pont
2. **Gmail "Show original":**
   - `dkim=pass`
   - `spf=pass`
   - `dmarc=pass`
3. **Email megérkezik** (nem spam mappába)
4. **Nincs bounce-back** email

---

## További segítség

- **Mail-tester:** https://www.mail-tester.com/
- **MXToolbox SPF:** https://mxtoolbox.com/spf.aspx
- **MXToolbox DKIM:** https://mxtoolbox.com/dkim.aspx
- **MXToolbox DMARC:** https://mxtoolbox.com/dmarc.aspx

---

**Jelenlegi állapot:** ✅ Minden rekord be van állítva! Várj 1-2 órát a DNS propagációra, majd teszteld! 🚀

