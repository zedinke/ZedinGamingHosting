/**
 * Counter-Strike 2 szerver parancsok
 */

export const commands = {
  startCommand: './srcds_run -game csgo -console -usercon -port 27015 +exec server.cfg',
  stopCommand: 'quit',
  restartCommand: 'changelevel {mapname}',
  statusCommand: 'status',
  // Szerver control parancsok
  saveCommand: 'save',
  playerListCommand: 'status',
  playerKickCommand: 'kick {userId} {reason}',
  playerBanCommand: 'banid 0 {userId} kick',
  playerUnbanCommand: 'removeid {userId}',
  adminAddCommand: 'sv_addedit {steamId} 99 immunity',
  adminRemoveCommand: 'sv_removeedit {steamId}',
  broadcastCommand: 'say {message}',
  setMaxPlayersCommand: 'sv_maxplayers {maxplayers}',
  changeMapCommand: 'changelevel {mapname}',
  rconCommand: 'rcon_password {password}',
  setHostnameCommand: 'hostname "{hostname}"',
  restartRoundCommand: 'mp_restartgame 1',
  endRoundCommand: 'mp_forcewin 2',
};