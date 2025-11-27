/**
 * Valheim indító és leállító parancsok
 */

export const commands = {
  startCommand: './valheim_server.x86_64 -nographics -batchmode -name "{name}" -port {port} -world "{world}" -password "{password}" -public {public}',
  stopCommand: 'quit',
};

