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
  startCommand: 'cd FactoryGame/Binaries/Linux && ./FactoryServer.sh -log -unattended -ServerQueryPort={queryPort} -BeaconPort={beaconPort} -Port={port}',
  stopCommand: 'quit', // Systemd automatikusan kezeli a leállítást, de a stopCommand mező kötelező
};

