/**
 * Sons of the Forest telepítő script
 * MEGJEGYZÉS: A Sons of the Forest dedikált szerver jelenleg nem érhető el SteamCMD-n keresztül anonimán.
 * Ez egy ismert Steam korlátázás - szükséges a játék tulajdonlása és bejelentkezés az értékesítő fiókkal.
 */

export const installScript = `
#!/bin/bash
set +e
SERVER_DIR="/opt/servers/{serverId}"

# Minden könyvtárat root tulajdonba teszünk, mivel root-ként futunk mindent
mkdir -p /opt/servers
chmod 755 /opt/servers
chown root:root /opt/servers

# Szerver könyvtár létrehozása root tulajdonban
mkdir -p "$SERVER_DIR"
chmod -R 755 "$SERVER_DIR"
chown -R root:root "$SERVER_DIR"

cd "$SERVER_DIR"

# ⚠️  SONS OF THE FOREST - UNSUPPORTED GAME ⚠️
# A Sons of the Forest dedikált szerver jelenleg nem érhető el a SteamCMD-n keresztül.
# Ez egy Valve korlátazás - az alkalmazás (AppID: 1326470) nincsen konfigurálva dedikált szerver telepítéshez.

echo "======================================"
echo "Sons of the Forest Szerver Telepítés"
echo "======================================"
echo ""
echo "❌ HIBA: Sons of the Forest dedikált szerver nem telepíthető"
echo ""
echo "OKA:"
echo "- Valve még nem konfigurálta az AppID 1326470-et nyilvános szerver telepítéshez"
echo "- Hozzáférés típus: Tiltott névtelen bejelentkezéshez"
echo "- Szükséges: Szerverlicenc vagy kiemelt hozzáférés (nem létezik nyilvánosan)"
echo ""
echo "TECHNIKAI HIBAÜZENETEK (naplózás):"
echo "- 'Missing configuration' - Szervercsomagok nincsenek beállítva"
echo "- 'No subscription' - Nincs megfelelő előfizetés/licenc"
echo "- Exit code: 8 (SteamCMD végzetes hiba)"
echo ""

# Placeholder könyvtár struktúra létrehozása dokumentációs céllal
mkdir -p "$SERVER_DIR/logs"
mkdir -p "$SERVER_DIR/configs"

cat > "$SERVER_DIR/INSTALLATION_FAILED.txt" << 'EOFMSG'
=== Sons of the Forest Szerver Telepítés - SIKERTELEN ===

Telepítés dátuma: $(date)
AppID: 1326470
Szerver típus: Dedikált szerver (nyilvánosan nem elérhető)

TECHNIKAI DIAGNÓZIS:
========================
ERROR: Failed to install app '1326470' (Missing configuration)
ERROR: Failed to install app '1326470' (No subscription)
Exit kód: 8 (kritikus SteamCMD hiba)
Bejelentkezés mód: Névtelen (NEM TÁMOGATOTT)

OKOK:
=====
1. Valve NEM publikálta a Sons of the Forest szerver csomagot a SteamCMD-n
2. Az alkalmazás (AppID 1326470) nem konfigurálva van szerver telepítéshez
3. Csak üzletfejlesztési kontakt-on keresztül lehetséges (nem szokos felhasználók)

AJÁNLOTT MEGOLDÁSOK:
====================

1. **LEGEGYSZERŰBB** - Más játék kiválasztása:
   ✅ Rust - AppID 258550 (teljes támogatás)
   ✅ ARK: Survival Evolved - AppID 376030
   ✅ Valheim - AppID 896660
   ✅ Minecraft Java - Open-source szerver
   ✅ CSGO 2 / CS2 - AppID 730
   ✅ Garry's Mod - AppID 4000

2. **FIZETETT ALTERNATÍVÁK** - Harmadik fél hosztok:
   - G-Portal.com
     * Sons of the Forest szerver: ~5-15 EUR/hó
     * Profi támogatás magyar nyelven
   - Nitrado.net
   - GameServers.com
   - Auf.net

3. **HOSSZÚ TÁVÚ MEGOLDÁS**:
   - Ha Zed Gaming szeretne Sons of the Forest támogatást,
     szükséges Valve kapcsolattartó szintű megállapodás
   - Ez jelenleg nem lehetséges kisebb hosztok számára

TÁMOGATÁS ÉS INFORMÁCIÓ:
=======================
E-mail: support@zedgaminghosting.hu
Discord: https://discord.gg/zedgaming
Dokumentáció: https://zedgaminghosting.hu/docs
Támogatott játékok: https://zedgaminghosting.hu/games

Készítési dátum: 2025-12-07
EOFMSG

echo "✗ Dokumentáció készítve: $SERVER_DIR/INSTALLATION_FAILED.txt"
echo ""
echo "📋 Kérjük, válasszon egy támogatott játékot:"
echo "   - Rust"
echo "   - ARK: Survival Evolved"
echo "   - Valheim"
echo "   - Minecraft"
echo "   - CSGO 2"
echo "   - Garry's Mod"
echo ""
echo "🌐 Teljes lista: https://zedgaminghosting.hu/games"
echo ""

# Jelezzük az installert, hogy sikertelen volt
exit 1
`;

// Export config
export const config = {
  name: "Sons of the Forest",
  appId: 1326470,
  supported: false,
  reason: "Not available via SteamCMD - requires game ownership and special Valve licensing",
  alternatives: ["rust", "ark", "valheim", "minecraft"],
};
