/**
 * Sons of the Forest szerver parancsok
 * Docker-based Windows server with Wine
 */

export const commands = {
  // Docker container alapú indítás/leállítás
  startCommand: 'bash /opt/servers/{serverId}/start-server.sh',
  stopCommand: 'bash /opt/servers/{serverId}/stop-server.sh',
  restartCommand: 'bash /opt/servers/{serverId}/stop-server.sh && sleep 2 && bash /opt/servers/{serverId}/start-server.sh',
  statusCommand: 'docker ps -f name=sotf-server-{serverId} --format "{{.Status}}"',
  
  // Szerver logok megtekintése
  logsCommand: 'docker logs sotf-server-{serverId} --tail 100',
  
  // Szerver console parancsok (RCON-on keresztül ha van)
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