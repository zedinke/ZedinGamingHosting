/**
 * Game szerver telepítési konfigurációk
 * 
 * Legacy file - A game-configs rendszer ki lett kapcsolva.
 * Használd az új template-alapú deployment-et: lib/provisioning/rust-provisioner.ts
 */

import { GameType } from '@prisma/client';

// Placeholder típus export a kompatibilitáshoz
export type GameServerConfig = {
  name: string;
  displayName: string;
  dockerImage?: string;
  ports: { 
    game: number; 
    query?: number; 
    rcon?: number;
    steam?: number;
    beacon?: number;
    [key: string]: number | undefined; // Allow additional port types
  };
  startCommand?: string;
  installScript?: string;
  requiresSteamCMD?: boolean;
  configPath?: string;
  [key: string]: any; // Allow additional properties for flexibility
};

/**
 * Legacy function - Üres map-et ad vissza
 */
function combineConfigsAndInstallers(): Partial<Record<GameType, GameServerConfig>> {
  const combined: Partial<Record<GameType, GameServerConfig>> = {
    // 7 Days to Die - Docker-alapú szerver
    SEVEN_DAYS_TO_DIE: {
      name: 'SEVEN_DAYS_TO_DIE',
      displayName: '7 Days to Die',
      dockerImage: '7days2die:latest',
      ports: {
        game: 26900, // UDP - Game port
        query: 26901, // UDP - Query port (GamePort + 1)
        rcon: 8081, // TCP - Telnet port (GamePort + 2)
      },
    // Docker run parancs a 7DTD szerverhez
      // A port mappinget az agent-provisioning vagy systemd service végzi
      // Az /opt/servers/{serverId} mappát mount-oljuk /opt/7days2die-ba a containerben
      // Fontos: NINCS -d flag, mert a systemd Type=simple-nek szüksége van foreground process-re
      // A container futása a foreground процess lesz, a systemd követni tudja
      startCommand: `docker run --rm --name server-{serverId} \
        -p {port}:26900/udp \
        -p {queryPort}:26901/udp \
        -p {telnetPort}:8081/tcp \
        -p {webMapPort}:8080/tcp \
        -v /opt/servers/{serverId}:/opt/7days2die \
        7days2die:latest`,
      configPath: '/opt/servers/{serverId}/serverconfig.xml',
      requiresSteamCMD: false, // Docker image már tartalmazza a SteamCMD-t
      // Install script - Felhasználó és könyvtár létrehozása Docker-hez
      installScript: `#!/bin/bash
set -e
cd /opt/servers/{serverId}

# sfgames csoport létrehozása, ha még nem létezik
if ! getent group sfgames >/dev/null 2>&1; then
  echo "Csoport létrehozása: sfgames"
  groupadd -r sfgames
fi

# Felhasználó létrehozása, ha még nem létezik
if ! id -u seven{serverId} >/dev/null 2>&1; then
  echo "Felhasználó létrehozása: seven{serverId}"
  useradd -r -s /bin/bash -d /opt/servers/{serverId} -g sfgames seven{serverId}
else
  echo "Felhasználó már létezik: seven{serverId}"
fi

# Felhasználó hozzáadása a csoportokhoz (sfgames és docker)
usermod -a -G sfgames seven{serverId} 2>/dev/null || true
usermod -a -G docker seven{serverId} 2>/dev/null || true

# Docker image ellenőrzése
if ! docker images | grep -q "7days2die"; then
  echo "HIBA: Docker image nem található: 7days2die:latest"
  echo "Kérjük, építsd meg a Docker image-et először!"
  exit 1
fi

echo "7 Days to Die Docker környezet előkészítve"
`,
    },
    RUST: {
      name: 'RUST',
      displayName: 'Rust',
      dockerImage: '116.203.226.140:5000/rust:latest',
      ports: {
        game: 28015, // TCP/UDP - Game port
        rcon: 28016, // TCP - RCON port
      },
      startCommand: `docker run --rm --name server-{serverId} \
        -p {port}:28015/tcp \
        -p {port}:28015/udp \
        -p {rconPort}:28016/tcp \
        -v /opt/servers/{serverId}:/opt/rust \
        116.203.226.140:5000/rust:latest \
        /opt/rust/RustDedicated -batchmode +server.port 28015 +rcon.port 28016 +rcon.password {rconPassword} +server.hostname "{serverName}" +server.maxplayers {maxPlayers}`,
      configPath: '/opt/servers/{serverId}/server.cfg',
      requiresSteamCMD: false,
      installScript: `#!/bin/bash
set -e
cd /opt/servers/{serverId}

# sfgames csoport létrehozása
if ! getent group sfgames >/dev/null 2>&1; then
  groupadd -r sfgames
fi

# Felhasználó létrehozása
if ! id -u rust{serverId} >/dev/null 2>&1; then
  useradd -r -s /bin/bash -d /opt/servers/{serverId} -g sfgames rust{serverId}
fi

# Docker csoporthoz adás
usermod -a -G sfgames rust{serverId} 2>/dev/null || true
usermod -a -G docker rust{serverId} 2>/dev/null || true

# Docker image pull a központi registry-ből
docker pull 116.203.226.140:5000/rust:latest || echo "FIGYELEM: Docker image pull sikertelen"

echo "Rust Docker környezet előkészítve"
`,
    },
    THE_FOREST: {
      name: 'THE_FOREST',
      displayName: 'The Forest',
      dockerImage: '116.203.226.140:5000/theforest:latest',
      ports: {
        game: 27015, // UDP - Game port
        query: 27016, // UDP - Query port
        steam: 8766, // TCP - Steam port
      },
      startCommand: `docker run --rm --name server-{serverId} \
        -p {port}:27015/udp \
        -p {queryPort}:27016/udp \
        -p {steamPort}:8766/tcp \
        -v /opt/servers/{serverId}:/opt/theforest \
        116.203.226.140:5000/theforest:latest`,
      configPath: '/opt/servers/{serverId}/config.cfg',
      requiresSteamCMD: false,
      installScript: `#!/bin/bash
set -e
cd /opt/servers/{serverId}

if ! getent group sfgames >/dev/null 2>&1; then
  groupadd -r sfgames
fi

if ! id -u forest{serverId} >/dev/null 2>&1; then
  useradd -r -s /bin/bash -d /opt/servers/{serverId} -g sfgames forest{serverId}
fi

usermod -a -G sfgames forest{serverId} 2>/dev/null || true
usermod -a -G docker forest{serverId} 2>/dev/null || true

docker pull 116.203.226.140:5000/theforest:latest || echo "FIGYELEM: Docker image pull sikertelen"

echo "The Forest Docker környezet előkészítve"
`,
    },
    SONS_OF_THE_FOREST: {
      name: 'SONS_OF_THE_FOREST',
      displayName: 'Sons of The Forest',
      dockerImage: '116.203.226.140:5000/sonsofforest:latest',
      ports: {
        game: 8766, // UDP - Game port
        query: 27016, // UDP - Query port
      },
      startCommand: `docker run --rm --name server-{serverId} \
        -p {port}:8766/udp \
        -p {queryPort}:27016/udp \
        -v /opt/servers/{serverId}:/opt/sonsofforest \
        116.203.226.140:5000/sonsofforest:latest`,
      configPath: '/opt/servers/{serverId}/dedicatedserver.cfg',
      requiresSteamCMD: false,
      installScript: `#!/bin/bash
set -e
cd /opt/servers/{serverId}

if ! getent group sfgames >/dev/null 2>&1; then
  groupadd -r sfgames
fi

if ! id -u sotf{serverId} >/dev/null 2>&1; then
  useradd -r -s /bin/bash -d /opt/servers/{serverId} -g sfgames sotf{serverId}
fi

usermod -a -G sfgames sotf{serverId} 2>/dev/null || true
usermod -a -G docker sotf{serverId} 2>/dev/null || true

docker pull 116.203.226.140:5000/sonsofforest:latest || echo "FIGYELEM: Docker image pull sikertelen"

echo "Sons of The Forest Docker környezet előkészítve"
`,
    },
    SATISFACTORY: {
      name: 'SATISFACTORY',
      displayName: 'Satisfactory',
      dockerImage: '116.203.226.140:5000/satisfactory:latest',
      ports: {
        game: 7777, // UDP - Game port
        beacon: 15000, // UDP - Beacon port
        query: 15777, // UDP - Query port
      },
      startCommand: `docker run --rm --name server-{serverId} \
        -p {port}:7777/udp \
        -p {beaconPort}:15000/udp \
        -p {queryPort}:15777/udp \
        -v /opt/servers/{serverId}:/opt/satisfactory \
        116.203.226.140:5000/satisfactory:latest`,
      configPath: '/opt/servers/{serverId}/Saved/Config/LinuxServer/Game.ini',
      requiresSteamCMD: false,
      installScript: `#!/bin/bash
set -e
cd /opt/servers/{serverId}

if ! getent group sfgames >/dev/null 2>&1; then
  groupadd -r sfgames
fi

if ! id -u satis{serverId} >/dev/null 2>&1; then
  useradd -r -s /bin/bash -d /opt/servers/{serverId} -g sfgames satis{serverId}
fi

usermod -a -G sfgames satis{serverId} 2>/dev/null || true
usermod -a -G docker satis{serverId} 2>/dev/null || true

docker pull 116.203.226.140:5000/satisfactory:latest || echo "FIGYELEM: Docker image pull sikertelen"

echo "Satisfactory Docker környezet előkészítve"
`,
    },
    DAYZ: {
      name: 'DAYZ',
      displayName: 'DayZ',
      dockerImage: '116.203.226.140:5000/dayz:latest',
      ports: {
        game: 2302, // UDP - Game port
        query: 2303, // UDP - Query port (BattlEye port is 2300-2302 TCP+UDP)
        steam: 2304, // UDP - Steam query port
      },
      startCommand: `docker run --rm --name server-{serverId} \
        -p {port}:2302/udp \
        -p {queryPort}:2303/udp \
        -p {steamPort}:2304/udp \
        -v /opt/servers/{serverId}:/opt/dayz \
        116.203.226.140:5000/dayz:latest \
        /opt/dayz/DayZServer -config=serverDZ.cfg -port=2302 -profiles=/opt/dayz/profiles`,
      configPath: '/opt/servers/{serverId}/serverDZ.cfg',
      requiresSteamCMD: false,
      installScript: `#!/bin/bash
set -e
cd /opt/servers/{serverId}

if ! getent group sfgames >/dev/null 2>&1; then
  groupadd -r sfgames
fi

if ! id -u dayz{serverId} >/dev/null 2>&1; then
  useradd -r -s /bin/bash -d /opt/servers/{serverId} -g sfgames dayz{serverId}
fi

usermod -a -G sfgames dayz{serverId} 2>/dev/null || true
usermod -a -G docker dayz{serverId} 2>/dev/null || true

docker pull 116.203.226.140:5000/dayz:latest || echo "FIGYELEM: Docker image pull sikertelen"

echo "DayZ Docker környezet előkészítve"
`,
    },
  };
  return combined;
}

// Üres konfigurációk (legacy kompatibilitáshoz) + 7DTD
export const GAME_SERVER_CONFIGS: Partial<Record<GameType, GameServerConfig>> = combineConfigsAndInstallers();
export const ALL_GAME_SERVER_CONFIGS: Partial<Record<GameType, GameServerConfig>> = GAME_SERVER_CONFIGS;
