# Quick Start Guide

## Telepítés

### Windows
```bash
install.bat
```

### Linux
```bash
chmod +x install.sh
./install.sh
```

## Első indítás

```bash
npm run dev
```

Nyisd meg: `http://localhost:3000`

## Bejelentkezés

1. Használd az install script során megadott admin email és jelszót
2. Bejelentkezés után az Admin Dashboard jelenik meg

## License aktiválás

1. Menj az **Admin Dashboard** → **License kezelés** menübe
2. Add meg a vásárolt license key-t (formátum: `ZED-XXXX-XXXX-XXXX-XXXX`)
3. Kattints az **Aktiválás** gombra

## Modul telepítés

1. Menj az **Admin Dashboard** → **Modul telepítés** menübe
2. Válassz egy modult (pl. MySQL, Email)
3. Add meg a szükséges beállításokat
4. Kattints a **Telepítés** gombra

## Elérhető modulok

### Adatbázis
- MySQL
- PostgreSQL
- MongoDB

### Kommunikáció
- Email (SMTP)

### Fizetés
- Stripe
- PayPal

## Production build

```bash
npm run build
npm start
```

## License ellenőrzés

```bash
npm run check:license
```

## További információk

- [Telepítési útmutató](docs/INSTALLATION.md)
- [Implementáció státusz](IMPLEMENTATION_STATUS.md)

