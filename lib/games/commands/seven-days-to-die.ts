/**
 * Seven Days to Die szerver parancsok
 */

export const commands = {
  startCommand: './7DaysToDieServer.sh -configfile=serverconfig.xml -logfile console.log',
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