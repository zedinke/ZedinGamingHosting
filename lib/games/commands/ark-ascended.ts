/**
 * ARK: Survival Ascended indító és leállító parancsok
 * 
 * MEGJEGYZÉS: Az ARK Survival Ascended csak Windows-os verzióban létezik!
 * Linux alatt Wine-t használunk a Windows szerverek futtatásához.
 */

export const commands = {
  // ARK Ascended: Wine-t használunk a Windows bináris futtatásához
  // ShooterGameServer.exe: Windows szerver executable
  startCommand: 'wine ./ShooterGame/Binaries/Win64/ShooterGameServer.exe TheIsland_WP?listen?SessionName="{name}"?Port={port}?QueryPort={queryPort}?ServerPassword=?AdminPassword={adminPassword}?MaxPlayers={maxPlayers} -server -log',
  stopCommand: 'quit',
};

