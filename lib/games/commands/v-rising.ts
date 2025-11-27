/**
 * V Rising szerver parancsok
 */

export const commands = {
  startCommand: './VRisingServer.exe',
  stopCommand: 'stop',
  restartCommand: 'restart',
  statusCommand: 'status',
  // Szerver control parancsok
  saveCommand: 'save',
  playerListCommand: 'listplayers',
  playerKickCommand: 'kick {playerId} {reason}',
  playerBanCommand: 'ban {playerId} {reason}',
  playerUnbanCommand: 'unban {playerId}',
  adminAddCommand: 'addadmin {steamId}',
  adminRemoveCommand: 'removeadmin {steamId}',
  broadcastCommand: 'broadcast {message}',
  setDifficultyCommand: 'difficulty {difficulty}',
  enablePvPCommand: 'pvp enable',
  disablePvPCommand: 'pvp disable',
  setPlayerLimitCommand: 'maxplayers {limit}',
  giveItemCommand: 'give {playerId} {itemId} {quantity}',
  teleportCommand: 'teleport {playerId} {x} {y} {z}',
};