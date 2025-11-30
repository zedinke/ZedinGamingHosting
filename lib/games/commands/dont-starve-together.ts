/**
 * Don't Starve Together szerver parancsok
 */

export const commands = {
  startCommand: './dontstarve_dedicated_server_nullrenderer -console -port {port} -persistent_storage_root ~/.klei -persistent_storage_mod_root ~/.klei/DoNotStarveTogether',
  stopCommand: 'stop',
  restartCommand: 'restart',
  statusCommand: 'status',
  // Szerver control parancsok
  saveCommand: 'save',
  playerListCommand: 'listplayers',
  playerKickCommand: 'kick {username}',
  playerBanCommand: 'ban {username}',
  playerUnbanCommand: 'unban {username}',
  adminAddCommand: 'admin add {username}',
  adminRemoveCommand: 'admin remove {username}',
  broadcastCommand: 'say {message}',
  setDifficultyCommand: 'difficulty {difficulty}',
  setPauseCommand: 'pause {0|1}',
  setGameModeCommand: 'gamemode {gamemode}',
  regenerateCommand: 'regenerate',
};