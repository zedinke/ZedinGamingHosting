/**
 * ARK: Survival Ascended indító és leállító parancsok
 * 
 * MEGJEGYZÉS: Az ARK Survival Ascended csak Windows-os verzióban létezik!
 * Linux alatt Wine-t (vagy Proton) használunk a Windows szerverek futtatásához.
 * 
 * KRITIKUS: Az ArkAscendedServer.exe Windows bináris, amely Wine-n futtatódik!
 * Az elérési út: ShooterGame/Binaries/Win64/ArkAscendedServer.exe
 */

export const commands = {
  // ARK Ascended: Wine/Proton-t használunk a Windows bináris futtatásához
  // ArkAscendedServer.exe: Windows szerver executable
  
  // Indítás: Wine environment + virtuális kijelző (Xvfb) + szerver paraméterek
  startCommand: `
#!/bin/bash
cd "$(dirname "$0")" || exit 1

# Wine Environment
export WINEPREFIX="$(pwd)/.wine"
export WINE_CPU_TOPOLOGY=4:2
export DISPLAY=:99

# Xvfb virtuális kijelző (szükséges Wine grafikus hívásaihoz)
Xvfb :99 -screen 0 1024x768x24 > /dev/null 2>&1 &
XVFB_PID=$!
sleep 1

# Szerver indítása Wine-on keresztül
wine64 ShooterGame/Binaries/Win64/ArkAscendedServer.exe \\
  "{name}?listen?SessionName=\\"{name}\\"?Port={port}?QueryPort={queryPort}?ServerPassword=?AdminPassword={adminPassword}?MaxPlayers={maxPlayers}" \\
  -server \\
  -log \\
  > "logs/ark-server.log" 2>&1 &

SERVER_PID=$!
echo $SERVER_PID > ".pid"

# Cleanup trap
cleanup() {
  echo "[$(date)] Szerver leállítása (PID: $SERVER_PID)"
  kill $SERVER_PID 2>/dev/null || true
  sleep 2
  kill $XVFB_PID 2>/dev/null || true
}

trap cleanup EXIT SIGTERM SIGINT
wait $SERVER_PID
  `.trim(),

  // Leállítás: RCON parancs vagy process kill
  // KRITIKUS: ARK ASA-nál a "quit" parancs működik az RCON-on
  stopCommand: `
#!/bin/bash
PID_FILE=".pid"

if [ -f "$PID_FILE" ]; then
  PID=$(cat "$PID_FILE")
  if kill -0 "$PID" 2>/dev/null; then
    echo "[$(date)] Szerver leállítása (PID: $PID)"
    kill -TERM "$PID"
    
    # Várakozás a graceful shutdown-ra (max 30 másodperc)
    for i in {1..30}; do
      if ! kill -0 "$PID" 2>/dev/null; then
        echo "[$(date)] Szerver leállt"
        rm -f "$PID_FILE"
        exit 0
      fi
      sleep 1
    done
    
    # Ha még fut, force kill
    echo "[$(date)] Force kill alkalmazása"
    kill -9 "$PID" 2>/dev/null || true
    rm -f "$PID_FILE"
  else
    echo "[$(date)] Szerver már nem fut (PID: $PID)"
    rm -f "$PID_FILE"
  fi
else
  echo "[$(date)] Nincs PID fájl, szerver valószínűleg már nem fut"
  # pkill-t használunk az összes wine-related process leállításához
  pkill -f "ArkAscendedServer.exe" || true
fi
  `.trim(),
};


