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
  startCommand: './FactoryServer.sh -log -unattended',
  stopCommand: 'quit', // Systemd automatikusan kezeli a leállítást, de a stopCommand mező kötelező
};

