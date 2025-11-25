# Email SPF és DKIM beállítás - Hestia CP

## Probléma

A Gmail (és más email szolgáltatók) visszautasítják az emaileket, mert a küldő domain (`zedgaminghosting.hu`) nincs hitelesítve. A hibaüzenet:

```
550-5.7.26 Your email has been blocked because the sender is unauthenticated.
550-5.7.26 Gmail requires all senders to authenticate with either SPF or DKIM.
DKIM = did not pass
SPF [zedgaminghosting.hu] with ip: [116.203.226.140] = did not pass
```

## Megoldás

Be kell állítani az **SPF** és **DKIM** DNS rekordokat a domain-hez.

---

## 1. SPF (Sender Policy Framework) beállítása

Az SPF megmondja az email szolgáltatóknak, hogy melyik IP címekről küldhetnek emailt a domain nevében.

### 1.1 Hestia CP-ben SPF beállítás

1. **Bejelentkezés a Hestia CP-be**
2. Menj a **Mail** menüpontra
3. Válaszd ki a domain-t (`zedgaminghosting.hu`)
4. Kattints a **DNS Records** vagy **DNS** fülre
5. Keress egy **TXT** típusú rekordot, ami tartalmazza az SPF-et

### 1.2 SPF rekord létrehozása

Ha nincs SPF rekord, hozd létre:

**Rekord típusa:** `TXT`  
**Név:** `@` (vagy üres, vagy `zedgaminghosting.hu`)  
**Érték:** 
```
v=spf1 a mx ip4:116.203.226.140 include:_spf.google.com ~all
```

**Magyarázat:**
- `v=spf1` - SPF verzió
- `a` - A domain A rekordjának IP-je engedélyezett
- `mx` - A domain MX rekordjainak IP-jei engedélyezettek
- `ip4:116.203.226.140` - A szerver IP címe (cseréld ki a saját IP-dre!)
- `include:_spf.google.com` - Ha Google-t is használsz (opcionális)
- `~all` - Minden más forrás "soft fail" (nem blokkolja, de gyanús)

**Egyszerűbb verzió (ha csak a saját szerveredről küldesz):**
```
v=spf1 a mx ip4:116.203.226.140 ~all
```

### 1.3 Hestia CP DNS rekord hozzáadása

1. A **DNS Records** résznél kattints az **Add Record** gombra
2. Válaszd ki:
   - **Type:** `TXT`
   - **Name:** `@` (vagy üres)
   - **Value:** `v=spf1 a mx ip4:116.203.226.140 ~all`
3. Mentsd el

---

## 2. DKIM (DomainKeys Identified Mail) beállítása

A DKIM digitális aláírást ad az emailekhez, így bizonyítja, hogy az email valóban a domain-től érkezett.

### 2.1 DKIM kulcs generálása Hestia CP-ben

A Hestia CP automatikusan generál DKIM kulcsokat a mail domain-ekhez.

1. Menj a **Mail** menüpontra
2. Válaszd ki a domain-t (`zedgaminghosting.hu`)
3. Kattints a **DNS Records** vagy **DKIM** fülre
4. Keress egy **TXT** típusú rekordot, ami így kezdődik: `v=DKIM1;`

### 2.2 DKIM rekord megtalálása

A Hestia CP általában automatikusan létrehozza a DKIM rekordot. Ha nem látod:

1. A **Mail** menüben válaszd ki a domain-t
2. Nézd meg a **DKIM** vagy **DNS** részt
3. A DKIM rekord formátuma:
   - **Név:** `default._domainkey` (vagy hasonló)
   - **Típus:** `TXT`
   - **Érték:** `v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...` (hosszú kulcs)

### 2.3 DKIM manuális beállítása (ha nincs)

Ha a Hestia CP nem generálta automatikusan, manuálisan is beállíthatod:

```bash
# SSH-n keresztül a szerveren
cd /usr/local/hestia/bin
./v-add-mail-domain-dkim zedgaminghosting.hu
```

Ez létrehozza a DKIM kulcsot és hozzáadja a DNS rekordokhoz.

---

## 3. DMARC (opcionális, de ajánlott)

A DMARC segít megvédeni a domain-t a phishing támadásoktól.

### 3.1 DMARC rekord hozzáadása

**Rekord típusa:** `TXT`  
**Név:** `_dmarc`  
**Érték:**
```
v=DMARC1; p=quarantine; rua=mailto:admin@zedgaminghosting.hu; ruf=mailto:admin@zedgaminghosting.hu; pct=100
```

**Magyarázat:**
- `v=DMARC1` - DMARC verzió
- `p=quarantine` - A nem hitelesített emaileket karanténba teszi (használhatod `none`-t is kezdetben)
- `rua=mailto:...` - Hová küldje a napi jelentéseket
- `ruf=mailto:...` - Hová küldje a hibajelentéseket
- `pct=100` - Hány százalékra alkalmazza (100 = minden emailre)

**Kezdeti beállítás (szigorúbb ellenőrzés nélkül):**
```
v=DMARC1; p=none; rua=mailto:admin@zedgaminghosting.hu
```

---

## 4. DNS rekordok ellenőrzése

### 4.1 Online eszközök

1. **SPF ellenőrzés:**
   - https://mxtoolbox.com/spf.aspx
   - Add meg: `zedgaminghosting.hu`

2. **DKIM ellenőrzés:**
   - https://mxtoolbox.com/dkim.aspx
   - Add meg: `zedgaminghosting.hu` és a selector-t (általában `default`)

3. **DMARC ellenőrzés:**
   - https://mxtoolbox.com/dmarc.aspx
   - Add meg: `zedgaminghosting.hu`

4. **Átfogó ellenőrzés:**
   - https://www.mail-tester.com/
   - Küldj egy emailt a megadott címre, és kapj részletes jelentést

### 4.2 Parancssorban ellenőrzés

```bash
# SPF ellenőrzés
dig TXT zedgaminghosting.hu +short

# DKIM ellenőrzés (selector: default)
dig TXT default._domainkey.zedgaminghosting.hu +short

# DMARC ellenőrzés
dig TXT _dmarc.zedgaminghosting.hu +short
```

---

## 5. Szerver IP cím meghatározása

A hibaüzenetben látható IP: `116.203.226.140`

Ellenőrizd, hogy ez a helyes IP:

```bash
# Szerver IP cím
hostname -I

# Vagy
ip addr show

# Vagy külső IP (ha NAT mögött vagy)
curl ifconfig.me
```

**Fontos:** Ha a szerver IP-je változik, frissítsd az SPF rekordot!

---

## 6. Email tesztelés

### 6.1 Mail-tester használata

1. Menj a https://www.mail-tester.com/ oldalra
2. Másold ki a megadott email címet
3. Küldj egy emailt a rendszerből erre a címre
4. Kattints a "Then check your score" gombra
5. Nézd meg az eredményt (10/10 a cél)

### 6.2 Gmail teszt

1. Küldj egy emailt egy Gmail címre
2. Ellenőrizd, hogy megérkezett-e (nem a spam mappába)
3. Nézd meg az email fejlécét (Show original) - ott láthatod az SPF/DKIM státuszt

---

## 7. Hestia CP specifikus lépések

### 7.1 DNS rekordok hozzáadása Hestia CP-ben

1. **Bejelentkezés:** https://your-server-ip:8083
2. **Mail menü** → Válaszd ki a domain-t
3. **DNS Records** fül
4. **Add Record** gomb

**SPF rekord:**
- Type: `TXT`
- Name: `@`
- Value: `v=spf1 a mx ip4:116.203.226.140 ~all`

**DMARC rekord:**
- Type: `TXT`
- Name: `_dmarc`
- Value: `v=DMARC1; p=none; rua=mailto:admin@zedgaminghosting.hu`

### 7.2 DKIM automatikus generálás

A Hestia CP általában automatikusan létrehozza a DKIM-et. Ha nem:

```bash
# SSH-n keresztül
ssh root@your-server

# DKIM generálás
/usr/local/hestia/bin/v-add-mail-domain-dkim zedgaminghosting.hu
```

### 7.3 DNS propagáció

A DNS változások propagálódása **24-48 órát** is igénybe vehet. Általában **1-2 órán belül** aktív lesz.

Ellenőrizd:
```bash
dig TXT zedgaminghosting.hu +short
```

---

## 8. Gyakori problémák és megoldások

### 8.1 SPF "too many DNS lookups" hiba

Ha túl sok `include` van az SPF-ben, egyszerűsítsd:

**Rossz:**
```
v=spf1 include:_spf.google.com include:sendgrid.net include:mailgun.org ~all
```

**Jó:**
```
v=spf1 a mx ip4:116.203.226.140 ~all
```

### 8.2 DKIM nem található

1. Ellenőrizd, hogy a Hestia CP létrehozta-e:
   ```bash
   /usr/local/hestia/bin/v-list-mail-domain-dkim zedgaminghosting.hu
   ```

2. Ha nincs, generáld:
   ```bash
   /usr/local/hestia/bin/v-add-mail-domain-dkim zedgaminghosting.hu
   ```

### 8.3 Email még mindig spam

1. Várj 24-48 órát a DNS propagációra
2. Ellenőrizd a mail-tester.com-ot
3. Nézd meg, hogy minden rekord helyesen van-e beállítva
4. Ellenőrizd, hogy a `SMTP_FROM` a `.env`-ben megegyezik a domain-nel

---

## 9. .env fájl ellenőrzése

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

## 10. Végleges ellenőrzési lista

- [ ] SPF rekord hozzáadva (`v=spf1 a mx ip4:YOUR_IP ~all`)
- [ ] DKIM rekord létezik és aktív
- [ ] DMARC rekord hozzáadva (opcionális, de ajánlott)
- [ ] DNS propagáció befejeződött (24-48 óra)
- [ ] Mail-tester.com score: 8+/10
- [ ] `.env` fájlban helyes `SMTP_FROM` cím
- [ ] Email teszt küldése sikeres
- [ ] Gmail-ben nem spam mappába kerül

---

## További segítség

- **Hestia CP dokumentáció:** https://docs.hestiacp.com/
- **SPF rekord építő:** https://www.spf-record.com/
- **Mail-tester:** https://www.mail-tester.com/
- **MXToolbox:** https://mxtoolbox.com/

---

**Megjegyzés:** A DNS változások propagálódása akár 48 órát is igénybe vehet. Türelemmel! 🚀

