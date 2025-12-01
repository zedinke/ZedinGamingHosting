# ZedinGamingHosting SaaS

Letölthető, moduláris gaming hosting platform SaaS előfizetéssel.

## Főbb jellemzők

- ✅ **Minimális telepítés** - SQLite adatbázis, nincs szükség külső adatbázis szerverre
- ✅ **Moduláris rendszer** - Telepítsd csak azt, amit használsz
- ✅ **SaaS előfizetés** - Havi/éves előfizetés kezelés
- ✅ **License rendszer** - Automatikus license ellenőrzés
- ✅ **Update rendszer** - Automatikus frissítések
- ✅ **Windows & Linux** - Mindkét platformon működik

## Telepítés

### Windows

1. Futtasd a `install.bat` fájlt
2. Add meg az admin email és jelszót
3. Várd meg a telepítés befejezését

### Linux

1. Futtasd a `install.sh` scriptet:
   ```bash
   chmod +x install.sh
   ./install.sh
   ```
2. Add meg az admin email és jelszót
3. Várd meg a telepítés befejezését

## Első bejelentkezés

1. Nyisd meg a böngészőt: `http://localhost:3000`
2. Jelentkezz be az admin felhasználóval
3. Aktiváld a license-t az Admin Panel → License menüben
4. Telepítsd a szükséges modulokat az Admin Panel → System Installation menüben

## Modulok

### Adatbázis modulok
- MySQL
- PostgreSQL
- MongoDB

### Kommunikációs modulok
- Email rendszer (SMTP)
- SMS (jövőbeli)

### Fizetési modulok
- Stripe
- PayPal
- Revolut

## License aktiválás

1. Vásárolj egy license-t a [ZedinGamingHosting weboldalon](https://zedingaming.com)
2. Kapsz egy license key-t email-ben
3. Az Admin Panel → License menüben add meg a license key-t
4. A rendszer automatikusan ellenőrzi és aktiválja

## Frissítések

A rendszer automatikusan ellenőrzi a frissítéseket. Manuális ellenőrzés:
- Admin Panel → Dashboard → Update Check

## Támogatás

- Email: support@zedingaming.com
- Dokumentáció: [docs.zedingaming.com](https://docs.zedingaming.com)

