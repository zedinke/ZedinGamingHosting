/**
 * Project Zomboid szerver parancsok
 */

export const commands = {
  startCommand: 'java -Xmx2048m -jar ProjectZomboid64.jar',
  stopCommand: 'serverstop',
  restartCommand: 'serverrestart',
  statusCommand: 'info',
  // Szerver control parancsok
  saveCommand: 'save',
  playerListCommand: 'players',
  playerKickCommand: 'kick {username} {reason}',
  playerBanCommand: 'ban {username} {reason}',
  playerUnbanCommand: 'unban {username}',
  adminAddCommand: 'adduser {username} password {password}',
  adminRemoveCommand: 'removeuser {username}',
  broadcastCommand: 'servermsg {message}',
  playerKillCommand: 'grantadmin {username}',
  playerRemoveAdminCommand: 'removeadmin {username}',
  setDifficultyCommand: 'difficulty {difficulty}',
  setPvPCommand: 'pvp {0|1}',
  setZombieMultiplierCommand: 'zombiemultiplier {multiplier}',
};