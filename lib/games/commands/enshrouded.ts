/**
 * Enshrouded szerver parancsok
 */

export const commands = {
  startCommand: './enshrouded --serverName "{ServerName}" --port {port}',
  stopCommand: 'stop',
  restartCommand: 'restart',
  statusCommand: 'status',
  // Szerver control parancsok
  saveCommand: 'save',
  playerListCommand: 'listplayers',
  playerKickCommand: 'kick {playerId} {reason}',
  playerBanCommand: 'ban {playerId} {reason}',
  playerUnbanCommand: 'unban {playerId}',
  adminAddCommand: 'addadmin {playerId}',
  adminRemoveCommand: 'removeadmin {playerId}',
  broadcastCommand: 'broadcast {message}',
  setDifficultyCommand: 'difficulty {difficulty}',
  teleportCommand: 'teleport {playerId} {x} {y} {z}',
  healCommand: 'heal {playerId}',
  giveItemCommand: 'give {playerId} {itemId} {quantity}',
};