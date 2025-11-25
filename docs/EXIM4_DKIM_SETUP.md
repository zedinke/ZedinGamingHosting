# Exim4 DKIM beállítás - Hestia CP

## Probléma

A Hestia CP **Exim4**-et használ mail szerverként (nem Postfix-et), és a DKIM aláírás nem működik.

## Gyors ellenőrzés

### 1. Exim4 állapot

```bash
systemctl status exim4
```

Ha nem fut, indítsd el:
```bash
systemctl start exim4
systemctl enable exim4
```

### 2. DKIM konfiguráció ellenőrzése

**Fontos:** A Hestia CP parancsoknak USER paraméterre is szükségük van!

Először találd meg a domain tulajdonos user-t:
```bash
# User keresése domain alapján
bash scripts/find-hestia-user.sh zedgaminghosting.hu

# Vagy manuálisan a könyvtárak alapján
ls -la /home/*/web/zedgaminghosting.hu
ls -la /home/*/mail/zedgaminghosting.hu
```

Példa: Ha a user `ZedGamingHosting`, akkor:
```bash
# Hestia CP DKIM információk
/usr/local/hestia/bin/v-list-mail-domain-dkim ZedGamingHosting zedgaminghosting.hu

# DKIM kulcs fájlok
ls -la /usr/local/hestia/data/ssl/dkim/
```

### 3. DNS rekord ellenőrzése

```bash
# Mail selector
dig TXT mail._domainkey.zedgaminghosting.hu +short

# Default selector
dig TXT default._domainkey.zedgaminghosting.hu +short
```

---

## Hestia CP DKIM beállítása

### 1. DKIM újragenerálása

**Fontos:** Cseréld ki a `USER` paramétert a tényleges Hestia CP user nevére!

Ha a DKIM nem működik, töröld és generáld újra:

```bash
# USER megtalálása (pl. 'ZedGamingHosting')
# Nézd meg: /home/*/web/zedgaminghosting.hu vagy /home/*/mail/zedgaminghosting.hu

# DKIM törlése (USER = a Hestia CP user neve)
/usr/local/hestia/bin/v-delete-mail-domain-dkim USER zedgaminghosting.hu

# DKIM újragenerálása
/usr/local/hestia/bin/v-add-mail-domain-dkim USER zedgaminghosting.hu

# DKIM információk megtekintése
/usr/local/hestia/bin/v-list-mail-domain-dkim USER zedgaminghosting.hu
```

**Példa:**
```bash
# Ha a user 'ZedGamingHosting'
/usr/local/hestia/bin/v-delete-mail-domain-dkim ZedGamingHosting zedgaminghosting.hu
/usr/local/hestia/bin/v-add-mail-domain-dkim ZedGamingHosting zedgaminghosting.hu
/usr/local/hestia/bin/v-list-mail-domain-dkim ZedGamingHosting zedgaminghosting.hu
```

### 2. DNS rekord hozzáadása

A Hestia CP automatikusan létrehozza a DKIM DNS rekordot. Ellenőrizd a Hestia CP DNS Records-ban, hogy van-e:

- **Név:** `mail._domainkey` (vagy `default._domainkey`)
- **Típus:** `TXT`
- **Érték:** `v=DKIM1; k=rsa; p=...` (hosszú kulcs)

Ha nincs, manuálisan is hozzáadhatod a Hestia CP-ben.

### 3. Exim4 újraindítása

A DKIM változások után indítsd újra az Exim4-et:

```bash
systemctl restart exim4
```

---

## Exim4 DKIM konfiguráció ellenőrzése

### 1. Exim4 konfiguráció fájlok

A Hestia CP általában automatikusan beállítja az Exim4 DKIM konfigurációját. Ellenőrizd:

```bash
# Exim4 konfiguráció
cat /etc/exim4/exim4.conf.template | grep -i dkim

# Vagy a teljes konfiguráció
cat /etc/exim4/exim4.conf | grep -i dkim
```

### 2. DKIM router ellenőrzése

Az Exim4 konfigurációban kell lennie egy DKIM router-nek. Nézd meg:

```bash
grep -A 10 "dkim" /etc/exim4/exim4.conf.template
```

**Várt konfiguráció:**
```
dkim_domain = ${lc:${domain:$h_from:}}
dkim_selector = mail
dkim_private_key = /usr/local/hestia/data/ssl/dkim/zedgaminghosting.hu/mail.private
```

### 3. DKIM kulcs fájlok ellenőrzése

```bash
# DKIM kulcs könyvtár
ls -la /usr/local/hestia/data/ssl/dkim/

# Domain specifikus kulcsok
ls -la /usr/local/hestia/data/ssl/dkim/zedgaminghosting.hu/
```

Kellene lennie:
- `mail.private` - privát kulcs (Exim4 ezt használja)
- `mail.txt` - DNS rekord tartalma

---

## Hestia CP Exim4 konfiguráció frissítése

Ha a Hestia CP nem állította be automatikusan a DKIM-et:

### 1. Exim4 konfiguráció újraépítése

```bash
# Hestia CP mail domain újraépítése
/usr/local/hestia/bin/v-rebuild-mail-domain-dkim zedgaminghosting.hu

# Vagy teljes mail domain újraépítés
/usr/local/hestia/bin/v-rebuild-mail-domains zedgaminghosting.hu
```

### 2. Exim4 konfiguráció manuális ellenőrzése

```bash
# Exim4 konfiguráció tesztelése
exim4 -bV

# Konfiguráció szintaxis ellenőrzése
exim4 -C /etc/exim4/exim4.conf -bV
```

---

## Email küldés tesztelése

### 1. Teszt email küldése

```bash
# Küldj egy teszt emailt
echo "Test email" | mail -s "DKIM Test" -a "From: info@zedgaminghosting.hu" your-email@gmail.com

# Nézd meg a logokat
tail -f /var/log/exim4/mainlog
```

### 2. Log ellenőrzése

```bash
# Utolsó email küldések
tail -50 /var/log/exim4/mainlog | grep -i dkim

# Vagy minden DKIM kapcsolatos bejegyzés
grep -i dkim /var/log/exim4/mainlog | tail -20
```

**Várt log bejegyzés:**
```
DKIM: signed domain=zedgaminghosting.hu selector=mail
```

### 3. Gmail "Show original" ellenőrzése

1. Küldj egy emailt egy Gmail címre
2. Nyisd meg az emailt
3. Kattints a három pontra (⋮) → "Show original"
4. Nézd meg az "Authentication-Results" részt:
   ```
   dkim=pass
   ```

---

## Gyakori problémák és megoldások

### Probléma 1: DKIM selector nem egyezik

**Hiba:** A DNS-ben `mail._domainkey` van, de az Exim4 `default._domainkey`-t használ.

**Megoldás:**
1. Nézd meg, hogy melyik selector-t használja az Exim4:
   ```bash
   grep -i "dkim_selector" /etc/exim4/exim4.conf
   ```

2. Ha `default`, akkor:
   - Vagy változtasd az Exim4 konfigurációban `mail`-re
   - Vagy hozz létre `default._domainkey` DNS rekordot is

### Probléma 2: DKIM kulcs fájlok hiányoznak

**Hiba:** A `/usr/local/hestia/data/ssl/dkim/` könyvtárban nincs kulcs.

**Megoldás:**
```bash
# USER megtalálása
bash scripts/find-hestia-user.sh zedgaminghosting.hu

# DKIM újragenerálása (USER = a Hestia CP user neve)
/usr/local/hestia/bin/v-delete-mail-domain-dkim USER zedgaminghosting.hu
/usr/local/hestia/bin/v-add-mail-domain-dkim USER zedgaminghosting.hu

# Ellenőrzés
ls -la /usr/local/hestia/data/ssl/dkim/zedgaminghosting.hu/
```

### Probléma 3: Exim4 nem aláírja az emaileket

**Hiba:** Az Exim4 logban nincs DKIM információ.

**Megoldás:**
1. Ellenőrizd, hogy az Exim4 konfigurációban van-e DKIM router:
   ```bash
   grep -A 5 "dkim" /etc/exim4/exim4.conf
   ```

2. Ha nincs, a Hestia CP-nek kellene beállítania. Próbáld:
   ```bash
   /usr/local/hestia/bin/v-rebuild-mail-domains zedgaminghosting.hu
   systemctl restart exim4
   ```

### Probléma 4: DNS propagáció

**Hiba:** A DNS rekordok még nem propagálódtak.

**Megoldás:**
- Várj 1-2 órát
- Ellenőrizd különböző DNS szerverekkel:
  ```bash
  dig @8.8.8.8 TXT mail._domainkey.zedgaminghosting.hu +short
  dig @1.1.1.1 TXT mail._domainkey.zedgaminghosting.hu +short
  ```

---

## Végleges ellenőrzési lista

- [ ] Exim4 fut (`systemctl status exim4`)
- [ ] DKIM kulcsok léteznek (`/usr/local/hestia/data/ssl/dkim/`)
- [ ] DKIM DNS rekord létezik (`mail._domainkey` vagy `default._domainkey`)
- [ ] Exim4 konfigurációban van DKIM router
- [ ] Exim4 log mutatja a DKIM aláírást
- [ ] DNS propagáció megtörtént
- [ ] Gmail "Show original" mutatja: `dkim=pass`

---

## További segítség

- **Hestia CP dokumentáció:** https://docs.hestiacp.com/
- **Exim4 dokumentáció:** https://www.exim.org/docs.html
- **Hestia CP fórum:** https://forum.hestiacp.com/

---

**Fontos:** A Hestia CP általában automatikusan beállítja a DKIM-et. Ha nem működik, próbáld újragenerálni a DKIM kulcsokat! 🚀

