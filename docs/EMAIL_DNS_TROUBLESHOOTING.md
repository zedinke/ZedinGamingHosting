# Email DNS Hibakeresés - SPF/DKIM nem működik

## Probléma

A Gmail még mindig azt mondja, hogy az SPF és DKIM nem passzol, annak ellenére, hogy beállítottad a rekordokat.

## Gyors ellenőrzés

### 1. DNS rekordok ellenőrzése parancssorban

SSH-n keresztül a szerveren:

```bash
# SPF ellenőrzés
dig TXT zedgaminghosting.hu +short

# DKIM ellenőrzés (mail selector)
dig TXT mail._domainkey.zedgaminghosting.hu +short

# DKIM ellenőrzés (default selector - próbáld ezt is!)
dig TXT default._domainkey.zedgaminghosting.hu +short

# DMARC ellenőrzés
dig TXT _dmarc.zedgaminghosting.hu +short
```

**Várt eredmény:**
- SPF: `"v=spf1 a mx ip4:116.203.226.140 ~all"`
- DKIM: `"v=DKIM1; k=rsa; p=..."`
- DMARC: `"v=DMARC1; p=none; rua=mailto:admin@zedgaminghosting.hu"`

### 2. Online ellenőrzés

1. **MXToolbox SPF Checker:**
   - https://mxtoolbox.com/spf.aspx
   - Add meg: `zedgaminghosting.hu`
   - Nézd meg, hogy látható-e az SPF rekord

2. **MXToolbox DKIM Checker:**
   - https://mxtoolbox.com/dkim.aspx
   - Domain: `zedgaminghosting.hu`
   - Selector: `mail` (vagy `default`)
   - Nézd meg, hogy van-e DKIM rekord

3. **Mail-tester:**
   - https://www.mail-tester.com/
   - Küldj egy emailt a megadott címre
   - Nézd meg a pontszámot (8+/10 kellene)

---

## Gyakori problémák és megoldások

### Probléma 1: SPF rekord neve rossz

**Hiba:** Az SPF rekord neve `zedgaminghosting.hu` helyett `@` kellene legyen.

**Megoldás:**
1. Hestia CP → Mail → `zedgaminghosting.hu` → DNS Records
2. Töröld a jelenlegi SPF rekordot (ha a neve `zedgaminghosting.hu`)
3. Hozz létre újat:
   - **Név:** `@` (vagy üresen hagy)
   - **Típus:** `TXT`
   - **Érték:** `v=spf1 a mx ip4:116.203.226.140 ~all`

**Ellenőrzés:**
```bash
dig TXT zedgaminghosting.hu +short
```
Látnod kellene: `"v=spf1 a mx ip4:116.203.226.140 ~all"`

---

### Probléma 2: DKIM selector nem egyezik

A Hestia CP általában `default._domainkey` selector-t használ, de lehet, hogy `mail._domainkey`-t hoztad létre.

**Ellenőrzés:**
```bash
# Nézd meg, hogy melyik selector létezik
dig TXT default._domainkey.zedgaminghosting.hu +short
dig TXT mail._domainkey.zedgaminghosting.hu +short
```

**Megoldás 1: Hestia CP DKIM újragenerálása**

SSH-n keresztül:
```bash
# DKIM törlése (ha van)
/usr/local/hestia/bin/v-delete-mail-domain-dkim zedgaminghosting.hu

# DKIM újragenerálása
/usr/local/hestia/bin/v-add-mail-domain-dkim zedgaminghosting.hu

# DKIM kulcs megtekintése
/usr/local/hestia/bin/v-list-mail-domain-dkim zedgaminghosting.hu
```

**Megoldás 2: Postfix konfiguráció ellenőrzése**

Nézd meg, hogy a Hestia CP milyen selector-t használ:
```bash
grep -r "domainkey" /etc/postfix/
grep -r "dkim" /etc/postfix/
```

---

### Probléma 3: DNS propagáció még nem történt meg

A DNS változások propagálódása **akár 48 órát is igénybe vehet**, bár általában 1-2 órán belül aktív.

**Ellenőrzés:**
```bash
# Nézd meg, hogy a DNS szervered látja-e a rekordokat
dig @8.8.8.8 TXT zedgaminghosting.hu +short
dig @1.1.1.1 TXT zedgaminghosting.hu +short
```

Ha a Google DNS (8.8.8.8) és Cloudflare DNS (1.1.1.1) is látja a rekordokat, akkor propagálódott.

---

### Probléma 4: Hestia CP mail szerver nem aláírja a DKIM-et

A Hestia CP Postfix-et használ, amit be kell állítani a DKIM aláírásra.

**Ellenőrzés:**
```bash
# Postfix DKIM konfiguráció
cat /etc/postfix/dkim.conf
ls -la /etc/postfix/dkim/

# Opendkim állapot
systemctl status opendkim
```

**Ha nincs DKIM konfigurálva:**
A Hestia CP általában automatikusan beállítja, de ha nem:

1. Ellenőrizd a Hestia CP mail domain beállításait
2. Nézd meg, hogy van-e DKIM kulcs generálva
3. Indítsd újra a Postfix-et:
   ```bash
   systemctl restart postfix
   systemctl restart opendkim
   ```

---

### Probléma 5: SPF rekord formátuma rossz

**Rossz formátumok:**
```
v=spf1 ip4:116.203.226.140 ~all  # Hiányzik az 'a' és 'mx'
v=spf1 a mx ~all  # Hiányzik az IP
```

**Helyes formátum:**
```
v=spf1 a mx ip4:116.203.226.140 ~all
```

**Ellenőrzés:**
- https://mxtoolbox.com/spf.aspx
- Add meg: `zedgaminghosting.hu`
- Nézd meg, hogy nincs-e hibaüzenet

---

## Részletes hibakeresési lépések

### 1. lépés: DNS rekordok ellenőrzése

```bash
# SSH-n keresztül
ssh root@your-server

# SPF
echo "=== SPF ==="
dig TXT zedgaminghosting.hu +short

# DKIM (különböző selector-ökkel)
echo "=== DKIM (default) ==="
dig TXT default._domainkey.zedgaminghosting.hu +short

echo "=== DKIM (mail) ==="
dig TXT mail._domainkey.zedgaminghosting.hu +short

# DMARC
echo "=== DMARC ==="
dig TXT _dmarc.zedgaminghosting.hu +short
```

### 2. lépés: Hestia CP DKIM állapot

```bash
# DKIM kulcsok listázása
/usr/local/hestia/bin/v-list-mail-domain-dkim zedgaminghosting.hu

# Mail domain információk
/usr/local/hestia/bin/v-list-mail-domain zedgaminghosting.hu
```

### 3. lépés: Postfix/Opendkim állapot

```bash
# Opendkim szolgáltatás
systemctl status opendkim

# Postfix szolgáltatás
systemctl status postfix

# Opendkim logok
tail -f /var/log/mail.log | grep dkim
```

### 4. lépés: Email küldés tesztelése

```bash
# Küldj egy teszt emailt
echo "Test email" | mail -s "Test" -a "From: info@zedgaminghosting.hu" geleako@gmail.com

# Nézd meg a logokat
tail -f /var/log/mail.log
```

---

## Hestia CP specifikus megoldások

### DKIM újragenerálása

```bash
# DKIM törlése
/usr/local/hestia/bin/v-delete-mail-domain-dkim zedgaminghosting.hu

# DKIM újragenerálása
/usr/local/hestia/bin/v-add-mail-domain-dkim zedgaminghosting.hu

# DNS rekordok frissítése (ha szükséges)
/usr/local/hestia/bin/v-rebuild-dns-domains zedgaminghosting.hu
```

### Mail domain újraépítése

```bash
# Mail domain törlése és újra létrehozása (VIGYÁZAT: törli az emaileket!)
# Csak akkor használd, ha minden más megoldás nem működött!

# Először készíts biztonsági másolatot!
```

---

## Email küldés tesztelése

### 1. Mail-tester használata

1. Menj a https://www.mail-tester.com/ oldalra
2. Másold ki a megadott email címet (pl. `test-xxxxx@mail-tester.com`)
3. Küldj egy emailt a rendszerből erre a címre
4. Várj 1-2 percet
5. Kattints a "Then check your score" gombra
6. Nézd meg az eredményt:
   - **8-10 pont:** Jó! ✅
   - **5-7 pont:** Van még mit javítani ⚠️
   - **0-4 pont:** Súlyos problémák vannak ❌

### 2. Gmail "Show original" ellenőrzés

1. Küldj egy emailt egy Gmail címre
2. A Gmail-ben nyisd meg az emailt
3. Kattints a három pontra (⋮) → "Show original"
4. Nézd meg az "Authentication-Results" részt:
   ```
   spf=pass
   dkim=pass
   dmarc=pass
   ```

---

## Várható időtartam

- **DNS propagáció:** 1-48 óra (általában 1-2 óra)
- **Gmail cache:** Akár 24-48 óra is lehet
- **Más email szolgáltatók:** Általában gyorsabban frissülnek

**Tipp:** Ha 24 óra után sem működik, akkor valószínűleg nem a propagáció a probléma.

---

## Végleges ellenőrzési lista

- [ ] SPF rekord létezik és helyes formátumú (`v=spf1 a mx ip4:IP ~all`)
- [ ] SPF rekord neve `@` vagy üres (nem `zedgaminghosting.hu`)
- [ ] DKIM rekord létezik (`v=DKIM1; k=rsa; p=...`)
- [ ] DKIM selector egyezik a Hestia CP konfigurációval (`default` vagy `mail`)
- [ ] DMARC rekord létezik
- [ ] DNS propagáció befejeződött (ellenőrizd különböző DNS szerverekkel)
- [ ] Postfix/Opendkim fut és aláírja az emaileket
- [ ] `.env` fájlban helyes `SMTP_FROM` cím (`info@zedgaminghosting.hu`)
- [ ] Mail-tester.com score: 8+/10
- [ ] Gmail "Show original" mutatja: `spf=pass`, `dkim=pass`

---

## További segítség

Ha minden fentit ellenőrizted és még mindig nem működik:

1. **Hestia CP fórum:** https://forum.hestiacp.com/
2. **Hestia CP dokumentáció:** https://docs.hestiacp.com/
3. **Postfix DKIM dokumentáció:** https://www.postfix.org/DKIM_README.html

---

**Fontos:** A DNS változások propagálódása időt vesz igénybe. Türelemmel! 🚀

