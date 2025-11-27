/**
 * Satisfactory indító és leállító parancsok
 */

export const commands = {
  startCommand: 'cd FactoryGame/Binaries/Linux && ./FactoryGameServer -log -unattended -ServerQueryPort={queryPort} -BeaconPort={beaconPort} -Port={port}',
  stopCommand: 'quit', // Systemd automatikusan kezeli a leállítást, de a stopCommand mező kötelező
};

