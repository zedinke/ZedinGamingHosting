# ZedinGamingHosting SaaS - Telepítési útmutató

## Követelmények

- Node.js 18+ 
- npm vagy yarn
- Windows 10+ vagy Linux

## Telepítés

### Windows

1. Nyisd meg a `zedingaming-saas` mappát
2. Futtasd a `install.bat` fájlt
3. Add meg az admin email és jelszót
4. Várd meg a telepítés befejezését

### Linux

1. Nyisd meg a `zedingaming-saas` mappát
2. Futtasd a telepítő scriptet:
   ```bash
   chmod +x install.sh
   ./install.sh
   ```
3. Add meg az admin email és jelszót
4. Várd meg a telepítés befejezését

## Első indítás

```bash
npm run dev
```

Nyisd meg a böngészőt: `http://localhost:3000`

## License aktiválás

1. Jelentkezz be az admin felhasználóval
2. Menj az Admin Panel → License menübe
3. Add meg a license key-t
4. Kattints az "Aktiválás" gombra

## Modul telepítés

1. Menj az Admin Panel → System Installation menübe
2. Válassz ki egy modult (pl. MySQL, Email)
3. Add meg a szükséges beállításokat
4. Kattints a "Telepítés" gombra

## Production build

```bash
npm run build
npm start
```

## Frissítések

A rendszer automatikusan ellenőrzi a frissítéseket. Manuális ellenőrzés:
- Admin Panel → Dashboard → Update Check

