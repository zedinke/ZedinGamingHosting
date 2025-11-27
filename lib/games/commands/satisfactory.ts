/**
 * Satisfactory indító és leállító parancsok
 * 
 * FONTOS: A Satisfactory-nak NINCS hivatalos Linux szerver verziója!
 * A szerver Windows binárist használ, ami Wine-n keresztül fut.
 * 
 * A bináris fájl: FactoryServer.exe (Windows bináris)
 * Elérési út: FactoryGame/Binaries/Win64/FactoryServer.exe
 * 
 * A telepítő script létrehoz egy start-server.sh fájlt a Win64 könyvtárban,
 * amit a systemd service használ.
 */

export const commands = {
  // A telepítő script létrehozza a start-server.sh fájlt a Win64 könyvtárban
  // Ez a script kezeli a Wine-t és az xvfb-t
  startCommand: 'cd FactoryGame/Binaries/Win64 && ./start-server.sh',
  stopCommand: 'quit', // Systemd automatikusan kezeli a leállítást, de a stopCommand mező kötelező
};

