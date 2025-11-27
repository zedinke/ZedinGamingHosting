/**
 * Grounded szerver parancsok
 */

export const commands = {
  startCommand: './GroundedServer.sh -Windowed=False',
  stopCommand: 'quit',
  restartCommand: 'restart',
  statusCommand: 'status',
  // Szerver control parancsok
  saveCommand: 'save',
  playerListCommand: 'players',
  playerKickCommand: 'kick {playerId}',
  playerBanCommand: 'ban {playerId}',
  playerUnbanCommand: 'unban {playerId}',
  adminAddCommand: 'admin add {playerId}',
  adminRemoveCommand: 'admin remove {playerId}',
  broadcastCommand: 'say {message}',
  setDifficultyCommand: 'difficulty {difficulty}',
  enablePvPCommand: 'pvp on',
  disablePvPCommand: 'pvp off',
  setPlayerLimitCommand: 'maxplayers {limit}',
  teleportCommand: 'teleport {playerId} {x} {y} {z}',
  healCommand: 'heal {playerId}',
};