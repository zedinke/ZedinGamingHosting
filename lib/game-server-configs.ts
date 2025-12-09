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
  ports: { game: number; query?: number; rcon?: number };
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

# Felhasználó létrehozása, ha még nem létezik
if ! id -u seven{serverId} >/dev/null 2>&1; then
  echo "Felhasználó létrehozása: seven{serverId}"
  useradd -r -s /bin/bash -d /opt/servers/{serverId} -g sfgames seven{serverId}
else
  echo "Felhasználó már létezik: seven{serverId}"
fi

# sfgames csoport létrehozása, ha még nem létezik
if ! getent group sfgames >/dev/null 2>&1; then
  echo "Csoport létrehozása: sfgames"
  groupadd -r sfgames
fi

# Felhasználó hozzáadása a csoporthoz (ha még nincs benne)
usermod -a -G sfgames seven{serverId} 2>/dev/null || true

# Docker image ellenőrzése
if ! docker images | grep -q '7days2die'; then
  echo "HIBA: Docker image nem található: 7days2die:latest"
  echo "Kérjük, építsd meg a Docker image-et először!"
  exit 1
fi

echo "7 Days to Die Docker környezet előkészítve"
`,
    },
  };
  return combined;
}

// Üres konfigurációk (legacy kompatibilitáshoz) + 7DTD
export const GAME_SERVER_CONFIGS: Partial<Record<GameType, GameServerConfig>> = combineConfigsAndInstallers();
export const ALL_GAME_SERVER_CONFIGS: Partial<Record<GameType, GameServerConfig>> = GAME_SERVER_CONFIGS;
