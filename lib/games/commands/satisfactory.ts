/**
 * Satisfactory indító és leállító parancsok (Natív Linux szerver)
 * 
 * A Satisfactory-nak van natív Linux szerver verziója, ami FactoryServer.sh scriptet használ.
 * A script a SteamCMD telepítés során automatikusan letöltődik.
 * 
 * Elérési út: /opt/servers/{serverId}/FactoryServer.sh
 * 
 * A szerver a Game.ini fájlban beállított portot használja (alapértelmezett: 15777).
 * A Game.ini fájl: ~/.config/Epic/FactoryGame/Saved/Config/LinuxServer/Game.ini
 */

export const commands = {
  // Natív Linux szerver, FactoryServer.sh script használata
  // Portok paraméterként: -Port={gamePort} -ServerQueryPort={queryPort} -BeaconPort={beaconPort}
  // A {gamePort}, {queryPort} és {beaconPort} placeholder-eket a rendszer cseréli le az indításkor
  startCommand: './FactoryServer.sh -Port={gamePort} -ServerQueryPort={queryPort} -BeaconPort={beaconPort} -log -unattended',
  stopCommand: 'quit', // Systemd automatikusan kezeli a leállítást, de a stopCommand mező kötelező
};

