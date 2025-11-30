/**
 * The Forest indító és leállító parancsok
 */

export const commands = {
  // Linux natív verzió parancs (ha van .x86_64 fájl)
  startCommand: './TheForestDedicatedServer.x86_64 -batchmode -nographics -savefolderpath ./savefilesserver/ -configfilepath ./server.cfg -servergameport {port} -serverqueryport {queryPort} -servername "{name}" -serverplayers {maxPlayers} -serverautosaveinterval {serverautosaveinterval} -difficulty {difficulty} -inittype {inittype} -serverpassword "{password}" -enableVAC {enableVAC}',
  // Windows verzió parancs (ha csak .exe fájl van, Wine szükséges)
  startCommandWindows: 'xvfb-run --auto-servernum --server-args="-screen 0 640x480x24:32" wine ./TheForestDedicatedServer.exe -batchmode -dedicated -nosteamclient -serversteamport {steamPeerPort} -servergameport {port} -serverqueryport {queryPort} -serverip {serverip} -servername "{name}" -serverplayers {maxPlayers} -serverautosaveinterval {serverautosaveinterval} -difficulty {difficulty} -inittype {inittype} -slot {slot} -serverpassword "{password}" -enableVAC {enableVAC}',
  stopCommand: 'quit',
};

