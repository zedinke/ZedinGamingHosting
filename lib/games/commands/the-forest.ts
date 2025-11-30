/**
 * The Forest indító és leállító parancsok
 */

export const commands = {
  // Linux natív verzió parancs (ha van .x86_64 fájl)
  startCommand: './TheForestDedicatedServer.x86_64 -batchmode -nographics -savefolderpath ./saves/ -configfilepath ./server.cfg -servergameport {port} -serverqueryport {queryPort} -serversteamport {steamPeerPort} -servername "{name}" -serverplayers {maxPlayers} -serverautosaveinterval {serverautosaveinterval} -difficulty {difficulty} -inittype {inittype} -serverpassword "{password}" -enableVAC {enableVAC}',
  // Windows verzió parancs (ha csak .exe fájl van, Wine szükséges)
  // Fontos: a portokat az adatbázisból kinyerjük és itt használjuk
  startCommandWindows: 'xvfb-run --auto-servernum --server-args="-screen 0 640x480x24:32" wine ./TheForestDedicatedServer.exe -batchmode -nographics -savefolderpath "Z:\\home\\forest{serverId}\\server\\saves" -configfilepath "Z:\\home\\forest{serverId}\\server\\server.cfg" -servergameport {port} -serverqueryport {queryPort} -serversteamport {steamPeerPort} -serverip {serverip} -servername "{name}" -serverplayers {maxPlayers} -serverautosaveinterval {serverautosaveinterval} -difficulty {difficulty} -inittype {inittype} -slot {slot} -serverpassword "{password}" -enableVAC {enableVAC}',
  stopCommand: 'quit',
};

