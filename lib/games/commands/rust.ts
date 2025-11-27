/**
 * Rust indító és leállító parancsok
 */

export const commands = {
  startCommand: './RustDedicated -batchmode -server.port {port} -server.queryport {queryPort} -server.maxplayers {maxPlayers} -server.hostname "{name}" -server.identity "{name}"',
  stopCommand: 'quit',
};

