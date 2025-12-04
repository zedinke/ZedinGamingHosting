/**
 * ============================================================================
 * GAME SERVER INSTALLATION & CONFIGURATION COMMANDS
 * ============================================================================
 * 
 * Ez a fájl tartalmazza az összes szerver telepítési és indítási parancsait
 */

// ============================================================================
// CALL OF DUTY - Telepítési és indítási parancsok
// ============================================================================

export const callOfDutyCommands = {
  'COD_MODERN_WARFARE_2024': {
    installCommand: `
      mkdir -p /opt/servers/{serverId}
      cd /opt/servers/{serverId}
      
      # Steam AppID: 2149880
      /usr/games/steamcmd +login anonymous +app_update 2149880 validate +quit
      
      # Szerver konfiguráció
      cat > server.cfg << 'EOF'
sv_pure 1
sv_cheats 0
sv_allowdownload 1
sv_alltalk 0
sv_maxrate 30000
sv_minrate 20000
rate 25000
sv_maxunlag 1.0
EOF
    `,
    startCommand: 'wine ./cod_server.exe +map mp_terminal +maxplayers 32 +exec server.cfg',
    stopCommand: 'stop',
    configDirectory: '/opt/servers/{serverId}/configs',
  },

  'COD_WARZONE_2': {
    installCommand: `
      mkdir -p /opt/servers/{serverId}
      cd /opt/servers/{serverId}
      
      # Warzone 2.0 - AppID: 1958861
      /usr/games/steamcmd +login anonymous +app_update 1958861 validate +quit
      
      cat > warzone.cfg << 'EOF'
sv_pure 1
sv_cheats 0
sv_maxclients 150
sv_allowdownload 1
EOF
    `,
    startCommand: 'wine ./warzone_server.exe +maxplayers 150 +exec warzone.cfg',
    stopCommand: 'stop',
    configDirectory: '/opt/servers/{serverId}/configs',
  },

  'COD_BLACK_OPS_6': {
    installCommand: `
      mkdir -p /opt/servers/{serverId}
      cd /opt/servers/{serverId}
      
      # Black Ops 6 - AppID: 2084520
      /usr/games/steamcmd +login anonymous +app_update 2084520 validate +quit
    `,
    startCommand: 'wine ./bo6_server.exe +map nuketown +maxplayers 32',
    stopCommand: 'stop',
    configDirectory: '/opt/servers/{serverId}/configs',
  },

  'COD_COLD_WAR': {
    installCommand: `
      mkdir -p /opt/servers/{serverId}
      cd /opt/servers/{serverId}
      
      # Black Ops Cold War - AppID: 1357840
      /usr/games/steamcmd +login anonymous +app_update 1357840 validate +quit
    `,
    startCommand: 'wine ./coldwar_server.exe +map nuketown_island +maxplayers 32',
    stopCommand: 'stop',
    configDirectory: '/opt/servers/{serverId}/configs',
  },

  'COD_VANGUARD': {
    installCommand: `
      mkdir -p /opt/servers/{serverId}
      cd /opt/servers/{serverId}
      
      # Vanguard - AppID: 1687720
      /usr/games/steamcmd +login anonymous +app_update 1687720 validate +quit
    `,
    startCommand: 'wine ./vanguard_server.exe +map mp_diner +maxplayers 32',
    stopCommand: 'stop',
    configDirectory: '/opt/servers/{serverId}/configs',
  },

  'COD_INFINITE_WARFARE': {
    installCommand: `
      mkdir -p /opt/servers/{serverId}
      cd /opt/servers/{serverId}
      
      # Infinite Warfare - AppID: 292730
      /usr/games/steamcmd +login anonymous +app_update 292730 validate +quit
    `,
    startCommand: 'wine ./iw_server.exe +map mp_frontier +maxplayers 32',
    stopCommand: 'stop',
    configDirectory: '/opt/servers/{serverId}/configs',
  },
};

// ============================================================================
// COUNTER-STRIKE - Telepítési és indítási parancsok
// ============================================================================

export const counterStrikeCommands = {
  'CS2': {
    installCommand: `
      mkdir -p /opt/servers/{serverId}
      cd /opt/servers/{serverId}
      
      # Counter-Strike 2 - AppID: 730
      /usr/games/steamcmd +login anonymous +app_update 730 validate +quit
      
      # SRCDS indítóscript
      cat > start_cs2.sh << 'EOF'
#!/bin/bash
./srcds_run \\
  -game csgo \\
  -console \\
  -usercon \\
  +game_type 0 \\
  +game_mode 1 \\
  +mapgroup mg_active \\
  +map de_dust2 \\
  +maxplayers 32 \\
  -port 27015 \\
  -tv_port 27020
EOF
chmod +x start_cs2.sh
    `,
    startCommand: './start_cs2.sh',
    stopCommand: 'quit',
    configDirectory: '/opt/servers/{serverId}/csgo/cfg',
  },

  'CSGO': {
    installCommand: `
      mkdir -p /opt/servers/{serverId}
      cd /opt/servers/{serverId}
      
      # CS:GO Legacy - AppID: 740
      /usr/games/steamcmd +login anonymous +app_update 740 validate +quit
      
      cat > start_csgo.sh << 'EOF'
#!/bin/bash
./srcds_run \\
  -game csgo \\
  -console \\
  -usercon \\
  +game_type 0 \\
  +game_mode 1 \\
  +mapgroup mg_active \\
  +map de_dust2 \\
  +maxplayers 32 \\
  -port 27015
EOF
chmod +x start_csgo.sh
    `,
    startCommand: './start_csgo.sh',
    stopCommand: 'quit',
    configDirectory: '/opt/servers/{serverId}/csgo/cfg',
  },

  'CS_SOURCE': {
    installCommand: `
      mkdir -p /opt/servers/{serverId}
      cd /opt/servers/{serverId}
      
      # Counter-Strike: Source - AppID: 232330
      /usr/games/steamcmd +login anonymous +app_update 232330 validate +quit
      
      cat > start_css.sh << 'EOF'
#!/bin/bash
./srcds_run \\
  -game cstrike \\
  -console \\
  +map de_dust2 \\
  +maxplayers 32 \\
  -port 27015
EOF
chmod +x start_css.sh
    `,
    startCommand: './start_css.sh',
    stopCommand: 'quit',
    configDirectory: '/opt/servers/{serverId}/cstrike/cfg',
  },

  'CS_1_6': {
    installCommand: `
      mkdir -p /opt/servers/{serverId}
      cd /opt/servers/{serverId}
      
      # Counter-Strike 1.6 - AppID: 90
      /usr/games/steamcmd +login anonymous +app_update 90 validate +quit
      
      cat > start_cs16.sh << 'EOF'
#!/bin/bash
wine hlds.exe \\
  -game cstrike \\
  +map de_dust2 \\
  +maxplayers 32 \\
  -port 27015
EOF
chmod +x start_cs16.sh
    `,
    startCommand: './start_cs16.sh',
    stopCommand: 'quit',
    configDirectory: '/opt/servers/{serverId}/cstrike/cfg',
  },
};

// ============================================================================
// TOP 30 STEAM GAMES - Telepítési és indítási parancsok
// ============================================================================

export const steamGamesCommands = {
  'DOTA_2': {
    installCommand: `
      mkdir -p /opt/servers/{serverId}
      cd /opt/servers/{serverId}
      
      # Dota 2 - AppID: 570 (szerver nem igényel, kliens szinkron)
      # Dota 2 a Valve indexbe van integrálva
      echo "Dota 2 szerver automatikusan telepítve"
    `,
    startCommand: 'echo "Dota 2 szerver már fut (cloud-based)"',
    stopCommand: 'echo "Dota 2 szerver stop"',
  },

  'PUBG': {
    installCommand: `
      mkdir -p /opt/servers/{serverId}
      cd /opt/servers/{serverId}
      
      # PUBG Battlegrounds - AppID: 578080
      /usr/games/steamcmd +login anonymous +app_update 578080 validate +quit
      
      cat > start_pubg.sh << 'EOF'
#!/bin/bash
./TslGame/Binaries/Linux/TslGameServer \\
  -Port=7777 \\
  -QueryPort=27015 \\
  -maxplayers=100
EOF
chmod +x start_pubg.sh
    `,
    startCommand: './start_pubg.sh',
    stopCommand: 'stop',
  },

  'RUST': {
    installCommand: `
      mkdir -p /opt/servers/{serverId}
      cd /opt/servers/{serverId}
      
      # Rust - AppID: 258550
      /usr/games/steamcmd +login anonymous +app_update 258550 validate +quit
      
      cat > start_rust.sh << 'EOF'
#!/bin/bash
screen -S rust_server -d -m ./RustDedicated \\
  -batchmode \\
  +server.port 28015 \\
  +server.queryport 28016 \\
  +server.maxplayers 300 \\
  +server.level "Procedural Map" \\
  +server.seed 12345 \\
  +server.worldsize 3500 \\
  +server.hostname "ZedGaming {serverId}"
EOF
chmod +x start_rust.sh
    `,
    startCommand: './start_rust.sh',
    stopCommand: 'screen -S rust_server -X quit',
  },

  'TF2': {
    installCommand: `
      mkdir -p /opt/servers/{serverId}
      cd /opt/servers/{serverId}
      
      # Team Fortress 2 - AppID: 232250
      /usr/games/steamcmd +login anonymous +app_update 232250 validate +quit
      
      mkdir -p tf/cfg
      cat > tf/cfg/server.cfg << 'EOF'
hostname "ZedGaming TF2 {serverId}"
sv_pure 2
sv_gravity 800
mp_maxplayers 32
mp_friendlyfire 0
EOF
    `,
    startCommand: './srcds_run -game tf -console +map ctf_2fort +maxplayers 32',
    stopCommand: 'exit',
  },

  'L4D2': {
    installCommand: `
      mkdir -p /opt/servers/{serverId}
      cd /opt/servers/{serverId}
      
      # Left 4 Dead 2 - AppID: 500
      /usr/games/steamcmd +login anonymous +app_update 500 validate +quit
      
      mkdir -p left4dead2/cfg
      cat > left4dead2/cfg/server.cfg << 'EOF'
hostname "ZedGaming L4D2 {serverId}"
sv_pure 2
mp_maxplayers 8
sv_alltalk 0
EOF
    `,
    startCommand: './srcds_run -game left4dead2 -console +map c1m1_hotel +maxplayers 8',
    stopCommand: 'exit',
  },

  'GARRYSMOD': {
    installCommand: `
      mkdir -p /opt/servers/{serverId}
      cd /opt/servers/{serverId}
      
      # Garry's Mod - AppID: 4000
      /usr/games/steamcmd +login anonymous +app_update 4000 validate +quit
      
      mkdir -p garrysmod/cfg
      cat > garrysmod/cfg/server.cfg << 'EOF'
hostname "ZedGaming Gmod {serverId}"
sv_pure 0
sv_gravity 600
sv_alltalk 1
EOF
    `,
    startCommand: './srcds_run -game garrysmod -console +map gm_construct +maxplayers 64',
    stopCommand: 'exit',
  },

  'VALHEIM': {
    installCommand: `
      mkdir -p /opt/servers/{serverId}
      cd /opt/servers/{serverId}
      
      # Valheim - AppID: 896660
      /usr/games/steamcmd +login anonymous +app_update 896660 validate +quit
      
      mkdir -p valheim_data
      cat > start_valheim.sh << 'EOF'
#!/bin/bash
./valheim_server.x86_64 \\
  -nographics \\
  -batchmode \\
  -name "ZedGaming Valheim" \\
  -port 2456 \\
  -world "Dedicated"
EOF
chmod +x start_valheim.sh
    `,
    startCommand: './start_valheim.sh',
    stopCommand: 'stop',
  },

  'MINECRAFT_JAVA': {
    installCommand: `
      mkdir -p /opt/servers/{serverId}
      cd /opt/servers/{serverId}
      
      # Minecraft Java - Paperspigot szerver
      wget https://papermc.io/api/v2/projects/paper/versions/latest/builds/latest/downloads/paper-latest.jar
      
      cat > eula.txt << 'EOF'
eula=true
EOF
      
      cat > server.properties << 'EOF'
server-port=25565
max-players=128
level-name=world
gamemode=survival
difficulty=2
view-distance=10
server-ip=0.0.0.0
EOF
    `,
    startCommand: 'java -Xmx2048M -Xms1024M -jar paper-latest.jar nogui',
    stopCommand: 'stop',
  },

  'FACTORIO': {
    installCommand: `
      mkdir -p /opt/servers/{serverId}
      cd /opt/servers/{serverId}
      
      # Factorio szerver
      wget https://www.factorio.com/download/latest/headless
      tar -xzf factorio-latest.tar.xz
      
      mkdir -p factorio/saves
      cat > factorio/config-path.cfg << 'EOF'
read-data=/opt/servers/{serverId}/factorio/data
use-system-read-paths=false
write-data=/opt/servers/{serverId}/factorio
EOF
    `,
    startCommand: './factorio/bin/x64/factorio --start-server factorio/saves/server.zip --server-settings factorio/server-settings.json',
    stopCommand: 'stop',
  },

  'THE_FOREST': {
    installCommand: `
      mkdir -p /opt/servers/{serverId}
      cd /opt/servers/{serverId}
      
      # The Forest - AppID: 242760
      /usr/games/steamcmd +login anonymous +app_update 242760 validate +quit
    `,
    startCommand: 'wine ./theforest_server.exe -server -port 8766',
    stopCommand: 'stop',
  },

  'TERRARIA': {
    installCommand: `
      mkdir -p /opt/servers/{serverId}
      cd /opt/servers/{serverId}
      
      # Terraria - AppID: 105600
      /usr/games/steamcmd +login anonymous +app_update 105600 validate +quit
      
      cat > serverconfig.txt << 'EOF'
#this file might be used for server側切configuration.
maxplayers=255
world=/opt/servers/{serverId}/Terraria/Worlds/world1.wld
seed=random
difficulty=1
port=7777
EOF
    `,
    startCommand: './TerrariaServer.bin.x86_64 -config serverconfig.txt',
    stopCommand: 'stop',
  },

  'STARDEW_VALLEY': {
    installCommand: `
      mkdir -p /opt/servers/{serverId}
      cd /opt/servers/{serverId}
      
      # Stardew Valley - AppID: 413150
      /usr/games/steamcmd +login anonymous +app_update 413150 validate +quit
    `,
    startCommand: 'wine ./Stardew\ Valley.exe /server',
    stopCommand: 'stop',
  },

  'PORTAL_2': {
    installCommand: `
      mkdir -p /opt/servers/{serverId}
      cd /opt/servers/{serverId}
      
      # Portal 2 - AppID: 620
      /usr/games/steamcmd +login anonymous +app_update 620 validate +quit
    `,
    startCommand: './srcds_run -game portal2 -console +map mp_coop_lobby_3 +maxplayers 2',
    stopCommand: 'exit',
  },

  'DONT_STARVE_TOGETHER': {
    installCommand: `
      mkdir -p /opt/servers/{serverId}
      cd /opt/servers/{serverId}
      
      # Don't Starve Together - AppID: 343050
      /usr/games/steamcmd +login anonymous +app_update 343050 validate +quit
    `,
    startCommand: './bin/dontstarve_dedicated_server_nullrenderer -cluster MyCluster -shard Master',
    stopCommand: 'stop',
  },

  'SATISFACTORY': {
    installCommand: `
      mkdir -p /opt/servers/{serverId}
      cd /opt/servers/{serverId}
      
      # Satisfactory - AppID: 526870
      /usr/games/steamcmd +login anonymous +app_update 526870 validate +quit
      
      mkdir -p Factory/Saved/SaveGames
    `,
    startCommand: 'wine ./Engine/Binaries/Win64/FactoryServer.exe -multihome=0.0.0.0 -port=15777',
    stopCommand: 'stop',
  },

  'GROUNDED': {
    installCommand: `
      mkdir -p /opt/servers/{serverId}
      cd /opt/servers/{serverId}
      
      # Grounded - AppID: 962130
      /usr/games/steamcmd +login anonymous +app_update 962130 validate +quit
    `,
    startCommand: 'wine ./Grounded/Binaries/Win64/GroundedServer-Win64-Shipping.exe -server -log',
    stopCommand: 'stop',
  },

  'SUBNAUTICA': {
    installCommand: `
      mkdir -p /opt/servers/{serverId}
      cd /opt/servers/{serverId}
      
      # Subnautica - AppID: 264710
      /usr/games/steamcmd +login anonymous +app_update 264710 validate +quit
    `,
    startCommand: 'wine ./Subnautica.exe -server',
    stopCommand: 'stop',
  },

  'DEEP_ROCK_GALACTIC': {
    installCommand: `
      mkdir -p /opt/servers/{serverId}
      cd /opt/servers/{serverId}
      
      # Deep Rock Galactic - AppID: 548430
      /usr/games/steamcmd +login anonymous +app_update 548430 validate +quit
    `,
    startCommand: 'wine ./DRG/Binaries/Win64/FSD-Server.exe -log',
    stopCommand: 'stop',
  },

  'PROJECT_ZOMBOID': {
    installCommand: `
      mkdir -p /opt/servers/{serverId}
      cd /opt/servers/{serverId}
      
      # Project Zomboid - AppID: 108600
      /usr/games/steamcmd +login anonymous +app_update 108600 validate +quit
      
      mkdir -p Zomboid/Saves
      cat > server.ini << 'EOF'
ServerName=ZedGaming Zomboid
MaxPlayers=4
PvP=true
OpenToFriends=false
SafeHouse=true
AutoCreate=true
EOF
    `,
    startCommand: './start-server.sh',
    stopCommand: 'stop',
  },

  'LETHAL_COMPANY': {
    installCommand: `
      mkdir -p /opt/servers/{serverId}
      cd /opt/servers/{serverId}
      
      # Lethal Company - AppID: 1966720
      /usr/games/steamcmd +login anonymous +app_update 1966720 validate +quit
    `,
    startCommand: 'wine ./Lethal\ Company\ Server.exe -nographics -batchmode',
    stopCommand: 'stop',
  },

  'PHASMOPHOBIA': {
    installCommand: `
      mkdir -p /opt/servers/{serverId}
      cd /opt/servers/{serverId}
      
      # Phasmophobia - AppID: 739630
      /usr/games/steamcmd +login anonymous +app_update 739630 validate +quit
    `,
    startCommand: 'wine ./Phasmophobia/Binaries/Win64/PhasmophobiaServer-Win64-Shipping.exe -server',
    stopCommand: 'stop',
  },

  'IT_TAKES_TWO': {
    installCommand: `
      mkdir -p /opt/servers/{serverId}
      cd /opt/servers/{serverId}
      
      # It Takes Two - AppID: 1426210
      /usr/games/steamcmd +login anonymous +app_update 1426210 validate +quit
    `,
    startCommand: 'wine ./ItTakesTwo/Binaries/Win64/ItTakesTwo-Win64-Shipping.exe -server',
    stopCommand: 'stop',
  },

  'A_WAY_OUT': {
    installCommand: `
      mkdir -p /opt/servers/{serverId}
      cd /opt/servers/{serverId}
      
      # A Way Out - AppID: 1221140
      /usr/games/steamcmd +login anonymous +app_update 1221140 validate +quit
    `,
    startCommand: 'wine ./AWayOut/Binaries/Win64/AWayOut-Win64-Shipping.exe -server',
    stopCommand: 'stop',
  },

  'RAFT': {
    installCommand: `
      mkdir -p /opt/servers/{serverId}
      cd /opt/servers/{serverId}
      
      # Raft - AppID: 648800
      /usr/games/steamcmd +login anonymous +app_update 648800 validate +quit
    `,
    startCommand: './start_server.sh',
    stopCommand: 'stop',
  },

  'CORE_KEEPER': {
    installCommand: `
      mkdir -p /opt/servers/{serverId}
      cd /opt/servers/{serverId}
      
      # Core Keeper - AppID: 1621690
      /usr/games/steamcmd +login anonymous +app_update 1621690 validate +quit
    `,
    startCommand: './corekeeper_server --port 9000 --gameport 9000 --queryport 9001',
    stopCommand: 'stop',
  },

  'PALEO_PINES': {
    installCommand: `
      mkdir -p /opt/servers/{serverId}
      cd /opt/servers/{serverId}
      
      # Paleo Pines - AppID: 1928360
      /usr/games/steamcmd +login anonymous +app_update 1928360 validate +quit
    `,
    startCommand: 'wine ./Paleo\ Pines\ Server.exe',
    stopCommand: 'stop',
  },

  'SPIRITFARER': {
    installCommand: `
      mkdir -p /opt/servers/{serverId}
      cd /opt/servers/{serverId}
      
      # Spiritfarer - AppID: 972660
      /usr/games/steamcmd +login anonymous +app_update 972660 validate +quit
    `,
    startCommand: 'wine ./Spiritfarer.exe -server',
    stopCommand: 'stop',
  },

  'READY_OR_NOT': {
    installCommand: `
      mkdir -p /opt/servers/{serverId}
      cd /opt/servers/{serverId}
      
      # Ready or Not - AppID: 1144010
      /usr/games/steamcmd +login anonymous +app_update 1144010 validate +quit
      
      mkdir -p ReadyOrNot/Saved/Config/LinuxServer
      cat > start_ron.sh << 'EOF'
#!/bin/bash
wine ./ReadyOrNot/Binaries/Win64/ReadyOrNot-Win64-Shipping.exe \\
  -server \\
  -log \\
  -port=7777
EOF
chmod +x start_ron.sh
    `,
    startCommand: './start_ron.sh',
    stopCommand: 'stop',
  },

  'KILLING_FLOOR_2': {
    installCommand: `
      mkdir -p /opt/servers/{serverId}
      cd /opt/servers/{serverId}
      
      # Killing Floor 2 - AppID: 232090
      /usr/games/steamcmd +login anonymous +app_update 232090 validate +quit
      
      mkdir -p KFGame/Config
      cat > KFGame/Config/PCServer-KFGame.ini << 'EOF'
[Engine.GameReplicationInfo]
ServerName=ZedGaming KF2 {serverId}
MaxPlayers=6
EOF
    `,
    startCommand: './srcds_run -game=KF2 -Port=7777 -QueryPort=27015',
    stopCommand: 'exit',
  },
};

// ============================================================================
// EXPORT
// ============================================================================

export const allGameCommands = {
  ...callOfDutyCommands,
  ...counterStrikeCommands,
  ...steamGamesCommands,
};

export default allGameCommands;
