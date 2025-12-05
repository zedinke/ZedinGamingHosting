/**
 * ARK Docker Configuration Examples
 * Ready-to-use server configurations for common scenarios
 */

import { ArkServerConfig } from './installer';

/**
 * Small PvP Server (10-20 players)
 */
export const smallPvPServer: ArkServerConfig = {
  serverId: 'small-pvp-001',
  serverName: 'Small PvP Server',
  gameType: 'ark-ascended',
  mapName: 'TheIsland_WP',
  maxPlayers: 20,
  difficulty: 2.0,
  serverPort: 27015,
  queryPort: 27016,
  steamApiKey: 'YOUR_STEAM_API_KEY',
  adminPassword: 'secure-password-here',
  serverPassword: 'server-password',
  ramMb: 4096, // 4GB
  enablePvp: true,
  enableCrosshair: true,
};

/**
 * Medium Roleplay Server (40-60 players)
 */
export const mediumRpServer: ArkServerConfig = {
  serverId: 'medium-rp-001',
  serverName: 'Medium RP Server',
  gameType: 'ark-ascended',
  mapName: 'CrystalIsles_WP',
  maxPlayers: 50,
  difficulty: 1.0,
  serverPort: 27017,
  queryPort: 27018,
  steamApiKey: 'YOUR_STEAM_API_KEY',
  adminPassword: 'secure-password-here',
  ramMb: 8192, // 8GB
  enablePvp: false, // PvE
  enableCrosshair: true,
};

/**
 * Large PvP Cluster (70+ players)
 */
export const largePvPCluster: ArkServerConfig[] = [
  {
    serverId: 'large-pvp-island-001',
    serverName: 'Large PvP - Island',
    gameType: 'ark-ascended',
    mapName: 'TheIsland_WP',
    maxPlayers: 70,
    difficulty: 3.0,
    serverPort: 27019,
    queryPort: 27020,
    steamApiKey: 'YOUR_STEAM_API_KEY',
    adminPassword: 'secure-password-here',
    ramMb: 16384, // 16GB
    clusterId: 'large-pvp-cluster',
    clusterMode: true,
    enablePvp: true,
  },
  {
    serverId: 'large-pvp-scorched-001',
    serverName: 'Large PvP - Scorched',
    gameType: 'ark-ascended',
    mapName: 'ScorchedEarth_WP',
    maxPlayers: 70,
    difficulty: 3.0,
    serverPort: 27021,
    queryPort: 27022,
    steamApiKey: 'YOUR_STEAM_API_KEY',
    adminPassword: 'secure-password-here',
    ramMb: 16384, // 16GB
    clusterId: 'large-pvp-cluster',
    clusterMode: true,
    enablePvp: true,
  },
  {
    serverId: 'large-pvp-extinction-001',
    serverName: 'Large PvP - Extinction',
    gameType: 'ark-ascended',
    mapName: 'Extinction_WP',
    maxPlayers: 70,
    difficulty: 3.0,
    serverPort: 27023,
    queryPort: 27024,
    steamApiKey: 'YOUR_STEAM_API_KEY',
    adminPassword: 'secure-password-here',
    ramMb: 16384, // 16GB
    clusterId: 'large-pvp-cluster',
    clusterMode: true,
    enablePvp: true,
  },
];

/**
 * Classic ARK Evolved Server (Linux native)
 */
export const classicEvolvedServer: ArkServerConfig = {
  serverId: 'classic-evolved-001',
  serverName: 'Classic ARK Evolved',
  gameType: 'ark-evolved',
  mapName: 'TheIsland_P',
  maxPlayers: 70,
  difficulty: 1.0,
  serverPort: 27025,
  queryPort: 27026,
  steamApiKey: 'YOUR_STEAM_API_KEY',
  adminPassword: 'secure-password-here',
  ramMb: 12288, // 12GB
  enablePvp: true,
};

/**
 * Hardcore Survival (High difficulty)
 */
export const hardcoreSurvival: ArkServerConfig = {
  serverId: 'hardcore-001',
  serverName: 'Hardcore Survival',
  gameType: 'ark-ascended',
  mapName: 'Fjordur_WP',
  maxPlayers: 30,
  difficulty: 4.0, // Maximum difficulty
  serverPort: 27027,
  queryPort: 27028,
  steamApiKey: 'YOUR_STEAM_API_KEY',
  adminPassword: 'secure-password-here',
  ramMb: 8192,
  enablePvp: true,
  enableCrosshair: false, // No crosshair for hardcore
};

/**
 * Creative/Building Server (Low difficulty, no PvP)
 */
export const creativeServer: ArkServerConfig = {
  serverId: 'creative-001',
  serverName: 'Creative Building',
  gameType: 'ark-ascended',
  mapName: 'CrystalIsles_WP',
  maxPlayers: 40,
  difficulty: 0.5, // Minimum difficulty
  serverPort: 27029,
  queryPort: 27030,
  steamApiKey: 'YOUR_STEAM_API_KEY',
  adminPassword: 'secure-password-here',
  ramMb: 6144, // 6GB
  enablePvp: false,
  enableCrosshair: true,
};

/**
 * All available ARK Ascended maps
 */
export const arkAscendedMaps = [
  'TheIsland_WP',
  'ScorchedEarth_WP',
  'Extinction_WP',
  'Genesis_WP',
  'Genesis2_WP',
  'Fjordur_WP',
  'CrystalIsles_WP',
] as const;

/**
 * All available ARK Evolved maps
 */
export const arkEvolvedMaps = [
  'TheIsland_P',
  'ScorchedEarth_P',
  'Extinction_P',
  'Genesis_P',
  'Genesis2_P',
  'Ragnarok_P',
  'CrystalIsles_P',
  'Valguero_P',
  'LostIsland_P',
] as const;

/**
 * Difficulty presets (0.5 to 4.0)
 */
export const difficultyPresets = {
  CASUAL: 0.5,
  NORMAL: 1.0,
  HARD: 2.0,
  EXPERT: 3.0,
  NIGHTMARE: 4.0,
} as const;

/**
 * RAM recommendations based on player count
 */
export const ramRecommendations = {
  '1-10': 2048,     // 2GB
  '11-30': 4096,    // 4GB
  '31-50': 8192,    // 8GB
  '51-70': 12288,   // 12GB
  '71-100': 16384,  // 16GB
  '100+': 24576,    // 24GB+
} as const;

/**
 * Port allocation helper
 * Ensures no port conflicts
 */
export class PortAllocator {
  private allocatedPorts: Set<number> = new Set();

  constructor(startPort: number = 27015) {
    this.allocatedPorts.add(startPort);
  }

  /**
   * Allocate next available server port
   */
  allocateServerPort(suggestedPort?: number): number {
    let port = suggestedPort || Math.max(...this.allocatedPorts) + 2;
    while (this.allocatedPorts.has(port)) {
      port++;
    }
    if (port > 65535) {
      throw new Error('No available ports remaining');
    }
    this.allocatedPorts.add(port);
    return port;
  }

  /**
   * Allocate next available query port (server port + 1)
   */
  allocateQueryPort(): number {
    const maxPort = Math.max(...this.allocatedPorts);
    const queryPort = maxPort + 1;
    if (queryPort > 65535) {
      throw new Error('No available query ports remaining');
    }
    this.allocatedPorts.add(queryPort);
    return queryPort;
  }

  /**
   * Allocate pair of ports (server + query)
   */
  allocatePorts(): { serverPort: number; queryPort: number } {
    const serverPort = this.allocateServerPort();
    this.allocatedPorts.add(serverPort + 1);
    return {
      serverPort,
      queryPort: serverPort + 1,
    };
  }

  /**
   * Release allocated ports
   */
  releasePorts(serverPort: number, queryPort: number): void {
    this.allocatedPorts.delete(serverPort);
    this.allocatedPorts.delete(queryPort);
  }

  /**
   * Get all allocated ports
   */
  getAllocatedPorts(): number[] {
    return Array.from(this.allocatedPorts).sort((a, b) => a - b);
  }
}

/**
 * Configuration validator
 */
export class ConfigValidator {
  /**
   * Validate if configuration can fit on available hardware
   */
  static validateHardwareFit(
    configs: ArkServerConfig[],
    availableRamMb: number
  ): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    let totalRam = 0;

    for (const config of configs) {
      const ramNeeded = config.ramMb || 8192;
      totalRam += ramNeeded;
    }

    if (totalRam > availableRamMb) {
      issues.push(
        `Total RAM required (${totalRam}MB) exceeds available (${availableRamMb}MB)`
      );
    }

    if (configs.length > 5 && availableRamMb < 65536) {
      issues.push('Running 5+ servers on less than 64GB RAM may cause performance issues');
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Validate cluster configuration
   */
  static validateClusterConfig(configs: ArkServerConfig[]): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    const clustered = configs.filter((c) => c.clusterId);

    if (clustered.length < 2) {
      issues.push('Cluster must contain at least 2 servers');
    }

    const clusterIds = new Set(clustered.map((c) => c.clusterId));
    if (clusterIds.size > 1) {
      issues.push('All clustered servers must have the same clusterId');
    }

    const maps = new Set(clustered.map((c) => c.mapName));
    if (maps.size !== clustered.length) {
      issues.push('Cluster servers must have different maps');
    }

    const ports = new Set<number>();
    for (const config of clustered) {
      if (ports.has(config.serverPort) || ports.has(config.queryPort)) {
        issues.push(
          `Port conflict detected: server port ${config.serverPort} or query port ${config.queryPort}`
        );
      }
      ports.add(config.serverPort);
      ports.add(config.queryPort);
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }
}
