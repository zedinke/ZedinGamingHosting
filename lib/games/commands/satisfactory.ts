/**
 * Satisfactory indító és leállító parancsok
 * 
 * Megjegyzés: A Satisfactory dedikált szerver binárisa lehet:
 * - FactoryServer.sh (wrapper script)
 * - FactoryGameServer (bináris)
 * - FactoryServer (bináris)
 * - Vagy másik helyen a FactoryGame könyvtárban
 */

export const commands = {
  // A startCommand a game-server-installer.ts-ben lesz dinamikusan módosítva
  // hogy megtalálja a tényleges bináris fájlt
  // Megjegyzés: A Satisfactory binárisa lehet FactoryGameServer vagy FactoryServer.sh
  // A game-server-installer.ts automatikusan ellenőrzi és kiválasztja a megfelelőt
  startCommand: 'cd FactoryGame/Binaries/Linux && ./FactoryGameServer -log -unattended -ServerQueryPort={queryPort} -BeaconPort={beaconPort} -Port={port}',
  stopCommand: 'quit', // Systemd automatikusan kezeli a leállítást, de a stopCommand mező kötelező
};

