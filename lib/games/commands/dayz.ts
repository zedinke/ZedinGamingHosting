/**
 * DayZ szerver parancsok
 */

export const commands = {
  startCommand: './DayZServer -config=serverDZ.cfg -port={port}',
  stopCommand: '#shutdown 300',
  restartCommand: '#restart 300',
  statusCommand: '#monitor',
  // Szerver control parancsok
  saveCommand: '#savedata',
  playerListCommand: '#players',
  playerKickCommand: '#kick {steamId} {reason}',
  playerBanCommand: '#ban {steamId} {reason}',
  playerUnbanCommand: '#unban {steamId}',
  adminAddCommand: '#admins add {steamId}',
  adminRemoveCommand: '#admins remove {steamId}',
  broadcastCommand: '#say -1 {message}',
  lockCommand: '#lock',
  unlockCommand: '#unlock',
  whitelistEnableCommand: '#whitelist enable',
  whitelistDisableCommand: '#whitelist disable',
  whitelistAddCommand: '#whitelist add {steamId}',
  whitelistRemoveCommand: '#whitelist remove {steamId}',
};