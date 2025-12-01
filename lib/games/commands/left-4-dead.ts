/**
 * Left 4 Dead indító és leállító parancsok
 */

export const commands = {
  startCommand: './srcds_run -game left4dead -console -port {port} +maxplayers {maxPlayers}',
  stopCommand: 'quit',
};

