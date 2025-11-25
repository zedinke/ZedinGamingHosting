# DKIM Beállítás - Részletes Útmutató

## Fontos információk

- **A Hestia CP parancsokat ROOT-ként kell futtatni** (nem a user-ként)
- A `ZedGamingHosting` user nem rendelkezik shell hozzáféréssel - ez normális
- A Hestia CP parancsoknak USER paraméterre is szükségük van

---

## 1. lépés: User megtalálása

```bash
# Navigálj a projekt könyvtárba
cd /home/ZedGamingHosting/web/zedgaminghosting.hu/public_html

# User keresése
bash scripts/find-hestia-user.sh zedgaminghosting.hu
```

**Várt eredmény:** `✅ Található user: ZedGamingHosting`

---

## 2. lépés: Jelenlegi DKIM állapot ellenőrzése

```bash
# DKIM információk megtekintése
/usr/local/hestia/bin/v-list-mail-domain-dkim ZedGamingHosting zedgaminghosting.hu
```

**Lehetséges eredmények:**

### A) Ha van DKIM:
```
DKIM key for zedgaminghosting.hu:
Selector: default
Public key: ...
```

### B) Ha nincs DKIM:
```
Error: DKIM key not found
```

---

## 3. lépés: DKIM generálása/újragenerálása

### Ha NINCS DKIM (első alkalom):

```bash
# DKIM generálása
/usr/local/hestia/bin/v-add-mail-domain-dkim ZedGamingHosting zedgaminghosting.hu
```

### Ha VAN DKIM (újragenerálás):

```bash
# 1. DKIM törlése
/usr/local/hestia/bin/v-delete-mail-domain-dkim ZedGamingHosting zedgaminghosting.hu

# 2. DKIM újragenerálása
/usr/local/hestia/bin/v-add-mail-domain-dkim ZedGamingHosting zedgaminghosting.hu
```

**Várt eredmény:**
```
DKIM key generated successfully
```

---

## 4. lépés: DKIM információk ellenőrzése

```bash
# DKIM információk megtekintése
/usr/local/hestia/bin/v-list-mail-domain-dkim ZedGamingHosting zedgaminghosting.hu
```

**Fontos információk:**
- **Selector:** `default` vagy `mail` (ezt jegyezd meg!)
- **Public key:** Hosszú kulcs

---

## 5. lépés: DNS rekord ellenőrzése

A Hestia CP **automatikusan létrehozza** a DKIM DNS rekordot. Ellenőrizd:

```bash
# Default selector (általában ezt használja)
dig TXT default._domainkey.zedgaminghosting.hu +short

# Mail selector (ha van)
dig TXT mail._domainkey.zedgaminghosting.hu +short
```

**Várt eredmény:**
```
"v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA..."
```

**Ha NINCS DNS rekord:**
1. Menj a Hestia CP-be (webes felület)
2. Mail → `zedgaminghosting.hu` → DNS Records
3. Nézd meg, hogy van-e `default._domainkey` vagy `mail._domainkey` TXT rekord
4. Ha nincs, a Hestia CP-nek létre kellene hoznia. Próbáld:
   ```bash
   /usr/local/hestia/bin/v-rebuild-dns-domains zedgaminghosting.hu
   ```

---

## 6. lépés: Exim4 újraindítása

```bash
# Exim4 újraindítása (hogy alkalmazza a DKIM változásokat)
systemctl restart exim4

# Exim4 állapot ellenőrzése
systemctl status exim4
```

**Várt eredmény:**
```
Active: active (running)
```

---

## 7. lépés: Email tesztelése

### A) Mail-tester használata

1. Menj a https://www.mail-tester.com/ oldalra
2. Másold ki a megadott email címet (pl. `test-xxxxx@mail-tester.com`)
3. Küldj egy emailt a rendszerből erre a címre
4. Várj 1-2 percet
5. Kattints a "Then check your score" gombra
6. **Cél: 8-10 pont** ✅

### B) Gmail teszt

1. Küldj egy emailt egy Gmail címre
2. Nyisd meg az emailt a Gmail-ben
3. Kattints a három pontra (⋮) → **"Show original"**
4. Nézd meg az **"Authentication-Results"** részt:
   ```
   dkim=pass (message was signed)
   spf=pass
   dmarc=pass
   ```

---

## 8. lépés: DNS propagáció várása

A DNS változások propagálódása **1-48 órát** is igénybe vehet (általában 1-2 óra).

**Ellenőrzés különböző DNS szerverekkel:**
```bash
# Google DNS
dig @8.8.8.8 TXT default._domainkey.zedgaminghosting.hu +short

# Cloudflare DNS
dig @1.1.1.1 TXT default._domainkey.zedgaminghosting.hu +short
```

Ha mindkét DNS szerver látja a rekordot, akkor propagálódott.

---

## Gyors ellenőrzési lista

- [ ] User megtalálva: `ZedGamingHosting`
- [ ] DKIM generálva: `/usr/local/hestia/bin/v-list-mail-domain-dkim` mutatja
- [ ] DNS rekord létezik: `default._domainkey` vagy `mail._domainkey`
- [ ] Exim4 fut: `systemctl status exim4`
- [ ] Exim4 újraindítva: `systemctl restart exim4`
- [ ] DNS propagáció megtörtént (1-2 óra várás)
- [ ] Mail-tester score: 8-10 pont
- [ ] Gmail "Show original": `dkim=pass`

---

## Gyakori problémák és megoldások

### Probléma 1: "Error: user USER doesn't exist"

**Megoldás:**
- Használd a helyes user nevet: `ZedGamingHosting` (nem `USER`)
- Ellenőrizd: `bash scripts/find-hestia-user.sh zedgaminghosting.hu`

### Probléma 2: "DKIM key not found"

**Megoldás:**
```bash
/usr/local/hestia/bin/v-add-mail-domain-dkim ZedGamingHosting zedgaminghosting.hu
```

### Probléma 3: DNS rekord nem létezik

**Megoldás:**
```bash
# DNS rekordok újraépítése
/usr/local/hestia/bin/v-rebuild-dns-domains zedgaminghosting.hu

# Vagy manuálisan a Hestia CP webes felületén
```

### Probléma 4: DKIM selector nem egyezik

**Hiba:** A DNS-ben `default._domainkey` van, de az Exim4 `mail._domainkey`-t használ.

**Megoldás:**
1. Nézd meg, hogy melyik selector-t használja:
   ```bash
   /usr/local/hestia/bin/v-list-mail-domain-dkim ZedGamingHosting zedgaminghosting.hu
   ```
2. Ha `default`, akkor a DNS-ben is `default._domainkey` kell legyen
3. Ha `mail`, akkor a DNS-ben is `mail._domainkey` kell legyen

### Probléma 5: Email még mindig nem működik

**Ellenőrzés:**
1. Várj 1-2 órát a DNS propagációra
2. Ellenőrizd a mail-tester.com-ot
3. Nézd meg a Gmail "Show original" részleteit
4. Ellenőrizd az Exim4 logokat:
   ```bash
   tail -50 /var/log/exim4/mainlog | grep -i dkim
   ```

---

## Teljes parancsok sorozata (copy-paste)

```bash
# 1. Navigálj a projekt könyvtárba
cd /home/ZedGamingHosting/web/zedgaminghosting.hu/public_html

# 2. User megtalálása
bash scripts/find-hestia-user.sh zedgaminghosting.hu

# 3. DKIM állapot ellenőrzése
/usr/local/hestia/bin/v-list-mail-domain-dkim ZedGamingHosting zedgaminghosting.hu

# 4. DKIM generálása (ha nincs)
/usr/local/hestia/bin/v-add-mail-domain-dkim ZedGamingHosting zedgaminghosting.hu

# 5. DKIM információk
/usr/local/hestia/bin/v-list-mail-domain-dkim ZedGamingHosting zedgaminghosting.hu

# 6. DNS rekord ellenőrzése
dig TXT default._domainkey.zedgaminghosting.hu +short

# 7. Exim4 újraindítása
systemctl restart exim4

# 8. Exim4 állapot
systemctl status exim4
```

---

## További segítség

- **Hestia CP dokumentáció:** https://docs.hestiacp.com/
- **Hestia CP fórum:** https://forum.hestiacp.com/
- **Mail-tester:** https://www.mail-tester.com/

---

**Fontos:** Minden parancsot **ROOT-ként** futtass! A `ZedGamingHosting` user nem rendelkezik shell hozzáféréssel, ez normális. 🚀

