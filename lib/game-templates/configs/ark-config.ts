/**
 * ARK Configuration Generator
 * Generálja a GameUserSettings.ini fájlt ARK játékokhoz
 */

import { ARKClusterNFS } from '@/lib/ark-cluster-nfs';
import { PortAllocationResult } from '@/lib/port-manager';

export interface ARKConfig {
  serverName: string;
  serverPassword?: string;
  adminPassword: string;
  maxPlayers: number;
  port: number;
  queryPort: number;
  rconPort: number;
  map?: 'TheIsland' | 'TheCenter' | 'Ragnarok' | 'Valguero' | 'CrystalIsles' | 'LostIsland' | 'Fjordur';
  clusterId?: string;
  clusterPath?: string;
  difficulty?: number; // 0.0 - 1.0
  harvestAmount?: number;
  tamingSpeed?: number;
  xpMultiplier?: number;
}

/**
 * ARK Config Generator
 */
export class ARKConfigGenerator {
  /**
   * GameUserSettings.ini generálása
   */
  static generateGameUserSettings(
    config: ARKConfig,
    ports: PortAllocationResult
  ): string {
    const {
      serverName,
      serverPassword = '',
      adminPassword,
      maxPlayers,
      map = 'TheIsland',
      clusterId,
      difficulty = 0.2,
      harvestAmount = 1.0,
      tamingSpeed = 1.0,
      xpMultiplier = 1.0,
    } = config;

    // Cluster directory path
    const clusterDir = clusterId
      ? ARKClusterNFS.getClusterPath(clusterId)
      : '';

    return `[ServerSettings]
ServerPassword=${serverPassword}
ServerAdminPassword=${adminPassword}
MaxPlayers=${maxPlayers}
ServerName=${serverName}
MapName=${map}
Port=${ports.port}
QueryPort=${ports.queryPort || ports.port + 1}
RCONPort=${ports.rconPort || ports.port + 2}
RCONEnabled=True
${clusterId ? `ClusterDirOverride=${clusterDir}` : ''}
${clusterId ? 'ClusterID=' : ''}${clusterId || ''}

[GameUserSettings]
DifficultyOffset=${difficulty}
HarvestAmountMultiplier=${harvestAmount}
TamingSpeedMultiplier=${tamingSpeed}
XPMultiplier=${xpMultiplier}
`;
  }

  /**
   * Game.ini generálása (opcionális, modokhoz)
   */
  static generateGameIni(modIds: number[] = []): string {
    if (modIds.length === 0) {
      return '';
    }

    const activeMods = modIds.join(',');

    return `[ServerSettings]
ActiveMods=${activeMods}
`;
  }
}

export default ARKConfigGenerator;

