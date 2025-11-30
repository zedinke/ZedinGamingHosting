/**
 * Sons of the Forest szerver parancsok
 */

export const commands = {
  startCommand: './SonsOfTheForest.sh -dedicated -port {port} -queryPort {queryPort}',
  stopCommand: 'stop',
  restartCommand: 'restart',
  statusCommand: 'status',
  // Szerver control parancsok
  saveCommand: 'save',
  playerListCommand: 'listplayers',
  playerKickCommand: 'kick {playerId}',
  playerBanCommand: 'ban {playerId}',
  playerUnbanCommand: 'unban {playerId}',
  adminAddCommand: 'addadmin {playerId}',
  adminRemoveCommand: 'removeadmin {playerId}',
  broadcastCommand: 'say {message}',
  setDifficultyCommand: 'difficulty {difficulty}',
  enablePvPCommand: 'pvp enable',
  disablePvPCommand: 'pvp disable',
  setPlayerLimitCommand: 'playerlimit {limit}',
  giveItemCommand: 'give {playerId} {itemId}',
};