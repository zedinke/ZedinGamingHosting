/**
 * Satisfactory indító és leállító parancsok
 * 
 * FONTOS: A Satisfactory-nak NINCS hivatalos Linux szerver verziója!
 * A szerver Windows binárist használ, ami Wine-n keresztül fut.
 * 
 * A bináris fájl: FactoryServer.exe (Windows bináris)
 * Elérési út: FactoryGame/Binaries/Win64/FactoryServer.exe
 */

export const commands = {
  // Wine-n keresztül indítjuk a Windows binárist
  // xvfb-run szükséges, mert a Wine-nek szüksége van egy display-re
  startCommand: 'cd FactoryGame/Binaries/Win64 && xvfb-run -a wine FactoryServer.exe -log -unattended -multihome=0.0.0.0 -Port={port} -BeaconPort={beaconPort} -ServerQueryPort={queryPort}',
  stopCommand: 'quit', // Systemd automatikusan kezeli a leállítást, de a stopCommand mező kötelező
};

