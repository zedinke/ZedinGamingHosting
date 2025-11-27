/**
 * Conan Exiles szerver parancsok
 */

export const commands = {
  startCommand: './ConanSandboxServer.sh -log',
  stopCommand: 'Quit',
  restartCommand: 'RestartServer',
  statusCommand: 'info',
  // Szerver control parancsok
  saveCommand: 'SaveWorld',
  playerListCommand: 'ListPlayers',
  playerKickCommand: 'KickPlayer {steamId}',
  playerBanCommand: 'BanPlayer {steamId} {reason}',
  playerUnbanCommand: 'UnbanPlayer {steamId}',
  adminAddCommand: 'AddAdmin {steamId}',
  adminRemoveCommand: 'RemoveAdmin {steamId}',
  broadcastCommand: 'Broadcast {message}',
  setClanMaxSizeCommand: 'SetMaxClanSize {size}',
  setPvPCommand: 'SetPvP {0|1}',
};