/**
 * Seven Days to Die szerver parancsok
 * Több szerver futtatására optimalizálva - portok paraméterként az indító parancsban
 */

export const commands = {
  // Portok paraméterként: -ServerPort={port} -TelnetPort={telnetPort}
  // A {port}, {telnetPort} és {name} placeholder-eket a rendszer cseréli le az indításkor
  // A portok közvetlenül az indító parancsban vannak megadva, nem a config fájlban
  startCommand: './7DaysToDieServer.x86_64 -configfile=serverconfig.xml -ServerPort={port} -TelnetPort={telnetPort} -ServerName="{name}" -logfile output_log.txt -quit -batchmode -nographics -dedicated',
  stopCommand: 'shutdown',
  restartCommand: 'restart',
  statusCommand: 'info',
  // Szerver control parancsok
  saveCommand: 'save',
  playerListCommand: 'lpi',
  playerKickCommand: 'kick {playerId} {reason}',
  playerBanCommand: 'ban {playerId} {reason}',
  adminAddCommand: 'admin add {steamId}',
  adminRemoveCommand: 'admin remove {steamId}',
  broadcastCommand: 'say {message}',
  setDifficultyCommand: 'setgamepref GameDifficulty {difficulty}',
  setLootCommand: 'setgamepref LootRespawnDays {days}',
};