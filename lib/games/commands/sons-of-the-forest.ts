/**
 * Sons of the Forest szerver parancsok
 * Wine-based Windows server (native installation)
 */

export const commands = {
  // Wine alapú indítás/leállítás
  startCommand: 'bash /opt/servers/{serverId}/start-server.sh',
  stopCommand: 'bash /opt/servers/{serverId}/stop-server.sh',
  restartCommand: 'bash /opt/servers/{serverId}/stop-server.sh && sleep 2 && bash /opt/servers/{serverId}/start-server.sh',
  statusCommand: 'pgrep -f "SonsOfTheForestDS.exe" > /dev/null && echo "Running" || echo "Stopped"',
  
  // Szerver logok megtekintése
  logsCommand: 'tail -n 100 /opt/servers/{serverId}/logs/server.log',
  
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