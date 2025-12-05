/**
 * Configuration Examples, Port Allocator, and Validators
 * ~350 lines of TypeScript implementation
 */

import { DockerConfig } from './installer';

/**
 * ARK Ascended Map Definitions
 */
export const ARK_ASCENDED_MAPS = {
  'Genesis1': { displayName: 'Genesis Part 1', difficulty: 0.8, recommendedPlayers: 70 },
  'Genesis2': { displayName: 'Genesis Part 2', difficulty: 0.9, recommendedPlayers: 70 },
  'TheIsland': { displayName: 'The Island', difficulty: 0.5, recommendedPlayers: 70 },
  'Scorched': { displayName: 'Scorched Earth', difficulty: 0.7, recommendedPlayers: 50 },
  'Aberration': { displayName: 'Aberration', difficulty: 0.85, recommendedPlayers: 50 },
  'Extinction': { displayName: 'Extinction', difficulty: 0.8, recommendedPlayers: 60 },
  'CrystalIsles': { displayName: 'Crystal Isles', difficulty: 0.75, recommendedPlayers: 70 }
};

/**
 * ARK Evolved Map Definitions
 */
export const ARK_EVOLVED_MAPS = {
  'TheIsland': { displayName: 'The Island', difficulty: 0.5, recommendedPlayers: 70 },
  'Scorched': { displayName: 'Scorched Earth', difficulty: 0.7, recommendedPlayers: 50 },
  'Aberration': { displayName: 'Aberration', difficulty: 0.85, recommendedPlayers: 50 },
  'Extinction': { displayName: 'Extinction', difficulty: 0.8, recommendedPlayers: 60 },
  'Genesis': { displayName: 'Genesis', difficulty: 0.8, recommendedPlayers: 70 },
  'CrystalIsles': { displayName: 'Crystal Isles', difficulty: 0.75, recommendedPlayers: 70 },
  'LostIsland': { displayName: 'Lost Island', difficulty: 0.6, recommendedPlayers: 70 },
  'FjordurMap': { displayName: 'Fjordur', difficulty: 0.65, recommendedPlayers: 70 },
  'NewMap': { displayName: 'Survival Ascended', difficulty: 0.5, recommendedPlayers: 70 }
};

/**
 * Configuration Example 1: Small ARK Ascended Server
 */
export function createSmallAscendedConfig(): DockerConfig {
  return {
    version: '1.0.0',
    arkVersion: 'ascended',
    serverName: 'Small ARK Ascended',
    adminPassword: 'admin123!@#',
    serverPassword: 'password123',
    maxPlayers: 10,
    port: 7777,
    queryPort: 7778,
    rconPort: 27015,
    map: 'TheIsland',
    difficulty: 0.5,
    pvp: true,
    enableCrossplay: true,
    enableCluster: false,
    dataDir: '/ark/data',
    backupDir: '/ark/backups',
    logDir: '/ark/logs',
    memoryLimit: '8g',
    cpuLimit: '2',
    winePrefix: '/root/.wine',
    resourceLimits: {
      maxConnections: 100,
      maxRamPerInstance: 8192,
      maxCpuPercentage: 200,
      diskQuotaGb: 100
    },
    healthCheck: {
      enabled: true,
      interval: 60,
      timeout: 10,
      retries: 3
    }
  };
}

/**
 * Configuration Example 2: Medium ARK Ascended Server
 */
export function createMediumAscendedConfig(): DockerConfig {
  return {
    version: '1.0.0',
    arkVersion: 'ascended',
    serverName: 'Medium ARK Ascended',
    adminPassword: 'strongadmin123!@#$%',
    serverPassword: 'serverpass456',
    maxPlayers: 35,
    port: 7777,
    queryPort: 7778,
    rconPort: 27015,
    map: 'Genesis1',
    difficulty: 0.75,
    pvp: false,
    enableCrossplay: true,
    enableCluster: true,
    clusterName: 'production-cluster',
    dataDir: '/ark/data',
    backupDir: '/ark/backups',
    logDir: '/ark/logs',
    memoryLimit: '16g',
    cpuLimit: '4',
    winePrefix: '/root/.wine',
    resourceLimits: {
      maxConnections: 300,
      maxRamPerInstance: 16384,
      maxCpuPercentage: 400,
      diskQuotaGb: 250
    },
    healthCheck: {
      enabled: true,
      interval: 30,
      timeout: 15,
      retries: 5
    }
  };
}

/**
 * Configuration Example 3: Large ARK Ascended Cluster
 */
export function createLargeAscendedClusterConfig(): DockerConfig {
  return {
    version: '1.0.0',
    arkVersion: 'ascended',
    serverName: 'Large ARK Ascended Cluster',
    adminPassword: 'enterprise-admin-pass123!@#$%^&*()',
    serverPassword: 'cluster-password789',
    maxPlayers: 70,
    port: 7777,
    queryPort: 7778,
    rconPort: 27015,
    map: 'CrystalIsles',
    difficulty: 1,
    pvp: true,
    enableCrossplay: true,
    enableCluster: true,
    clusterName: 'enterprise-cluster',
    dataDir: '/ark/data',
    backupDir: '/ark/backups',
    logDir: '/ark/logs',
    memoryLimit: '32g',
    cpuLimit: '8',
    winePrefix: '/root/.wine',
    resourceLimits: {
      maxConnections: 1000,
      maxRamPerInstance: 32768,
      maxCpuPercentage: 800,
      diskQuotaGb: 500
    },
    healthCheck: {
      enabled: true,
      interval: 15,
      timeout: 20,
      retries: 10
    }
  };
}

/**
 * Configuration Example 4: ARK Evolved Small Server (Linux)
 */
export function createSmallEvolvedConfig(): DockerConfig {
  return {
    version: '1.0.0',
    arkVersion: 'evolved',
    serverName: 'Small ARK Evolved',
    adminPassword: 'admin123!@#',
    serverPassword: 'password123',
    maxPlayers: 10,
    port: 7777,
    queryPort: 7778,
    rconPort: 27015,
    map: 'TheIsland',
    difficulty: 0.5,
    pvp: true,
    enableCrossplay: false,
    enableCluster: false,
    dataDir: '/ark/data',
    backupDir: '/ark/backups',
    logDir: '/ark/logs',
    memoryLimit: '8g',
    cpuLimit: '2',
    steamCmdPath: '/usr/local/bin/steamcmd.sh',
    resourceLimits: {
      maxConnections: 100,
      maxRamPerInstance: 8192,
      maxCpuPercentage: 200,
      diskQuotaGb: 150
    },
    healthCheck: {
      enabled: true,
      interval: 60,
      timeout: 10,
      retries: 3
    }
  };
}

/**
 * Configuration Example 5: ARK Evolved Medium Server
 */
export function createMediumEvolvedConfig(): DockerConfig {
  return {
    version: '1.0.0',
    arkVersion: 'evolved',
    serverName: 'Medium ARK Evolved',
    adminPassword: 'strongadmin123!@#$%',
    serverPassword: 'serverpass456',
    maxPlayers: 40,
    port: 7777,
    queryPort: 7778,
    rconPort: 27015,
    map: 'Genesis',
    difficulty: 0.8,
    pvp: false,
    enableCrossplay: false,
    enableCluster: true,
    clusterName: 'production-cluster',
    dataDir: '/ark/data',
    backupDir: '/ark/backups',
    logDir: '/ark/logs',
    memoryLimit: '16g',
    cpuLimit: '4',
    steamCmdPath: '/usr/local/bin/steamcmd.sh',
    resourceLimits: {
      maxConnections: 300,
      maxRamPerInstance: 16384,
      maxCpuPercentage: 400,
      diskQuotaGb: 300
    },
    healthCheck: {
      enabled: true,
      interval: 30,
      timeout: 15,
      retries: 5
    }
  };
}

/**
 * Configuration Example 6: ARK Evolved Large Cluster
 */
export function createLargeEvolvedClusterConfig(): DockerConfig {
  return {
    version: '1.0.0',
    arkVersion: 'evolved',
    serverName: 'Large ARK Evolved Cluster',
    adminPassword: 'enterprise-admin-pass123!@#$%^&*()',
    serverPassword: 'cluster-password789',
    maxPlayers: 70,
    port: 7777,
    queryPort: 7778,
    rconPort: 27015,
    map: 'LostIsland',
    difficulty: 1,
    pvp: true,
    enableCrossplay: false,
    enableCluster: true,
    clusterName: 'enterprise-cluster',
    dataDir: '/ark/data',
    backupDir: '/ark/backups',
    logDir: '/ark/logs',
    memoryLimit: '32g',
    cpuLimit: '8',
    steamCmdPath: '/usr/local/bin/steamcmd.sh',
    resourceLimits: {
      maxConnections: 1000,
      maxRamPerInstance: 32768,
      maxCpuPercentage: 800,
      diskQuotaGb: 500
    },
    healthCheck: {
      enabled: true,
      interval: 15,
      timeout: 20,
      retries: 10
    }
  };
}

/**
 * Port Allocator for managing port assignments
 */
export class PortAllocator {
  private baseGamePort: number = 7777;
  private baseQueryPort: number = 7778;
  private baseRconPort: number = 27015;
  private allocatedPorts: Set<number> = new Set();

  constructor(baseGamePort: number = 7777) {
    this.baseGamePort = baseGamePort;
    this.baseQueryPort = baseGamePort + 1;
    this.baseRconPort = baseGamePort + 19238;
  }

  /**
   * Allocates ports for a new server
   */
  allocatePorts(serverId: string): {
    gamePort: number;
    queryPort: number;
    rconPort: number;
  } {
    let gamePort = this.baseGamePort;
    while (this.allocatedPorts.has(gamePort)) {
      gamePort++;
    }

    const queryPort = gamePort + 1;
    const rconPort = gamePort + 19238;

    // Validate ports don't conflict
    if (this.allocatedPorts.has(queryPort) || this.allocatedPorts.has(rconPort)) {
      throw new Error('Port allocation conflict detected');
    }

    this.allocatedPorts.add(gamePort);
    this.allocatedPorts.add(queryPort);
    this.allocatedPorts.add(rconPort);

    return { gamePort, queryPort, rconPort };
  }

  /**
   * Releases ports
   */
  releasePorts(gamePort: number): void {
    this.allocatedPorts.delete(gamePort);
    this.allocatedPorts.delete(gamePort + 1);
    this.allocatedPorts.delete(gamePort + 19238);
  }

  /**
   * Gets all allocated ports
   */
  getAllocatedPorts(): number[] {
    return Array.from(this.allocatedPorts).sort((a, b) => a - b);
  }

  /**
   * Checks if port is available
   */
  isPortAvailable(port: number): boolean {
    return !this.allocatedPorts.has(port);
  }

  /**
   * Gets next available game port
   */
  getNextGamePort(): number {
    let port = this.baseGamePort;
    while (this.allocatedPorts.has(port)) {
      port++;
    }
    return port;
  }

  /**
   * Validates port range
   */
  validatePortRange(startPort: number, portCount: number): boolean {
    for (let i = 0; i < portCount * 3; i++) {
      if (this.allocatedPorts.has(startPort + i)) {
        return false;
      }
    }
    return true;
  }
}

/**
 * Configuration Validator
 */
export class ConfigValidator {
  /**
   * Validates Docker configuration
   */
  static validateDockerConfig(config: DockerConfig): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!config.serverName || config.serverName.length === 0) {
      errors.push('Server name is required');
    }

    if (!config.adminPassword || config.adminPassword.length < 6) {
      errors.push('Admin password must be at least 6 characters');
    }

    // Numeric validations
    if (config.maxPlayers < 1 || config.maxPlayers > 500) {
      errors.push('Max players must be between 1 and 500');
    }

    if (config.port < 1024 || config.port > 65535) {
      errors.push('Game port must be between 1024 and 65535');
    }

    if (config.queryPort < 1024 || config.queryPort > 65535) {
      errors.push('Query port must be between 1024 and 65535');
    }

    if (config.rconPort < 1024 || config.rconPort > 65535) {
      errors.push('RCON port must be between 1024 and 65535');
    }

    // Port conflicts
    if (config.port === config.queryPort || config.port === config.rconPort) {
      errors.push('Ports must be unique');
    }

    if (config.difficulty < 0 || config.difficulty > 1) {
      errors.push('Difficulty must be between 0 and 1');
    }

    // Map validation
    const validMaps = config.arkVersion === 'ascended' 
      ? Object.keys(ARK_ASCENDED_MAPS)
      : Object.keys(ARK_EVOLVED_MAPS);

    if (!validMaps.includes(config.map)) {
      errors.push(`Invalid map for ${config.arkVersion}: ${config.map}`);
    }

    // Resource limits
    if (config.resourceLimits) {
      if (config.resourceLimits.diskQuotaGb < 50) {
        errors.push('Minimum disk quota is 50GB');
      }

      if (config.resourceLimits.maxRamPerInstance < 4096) {
        errors.push('Minimum RAM per instance is 4GB');
      }

      if (config.resourceLimits.maxConnections < 10) {
        warnings.push('Max connections seems low');
      }
    }

    // Health check
    if (config.healthCheck) {
      if (config.healthCheck.interval < 10) {
        warnings.push('Health check interval is very frequent');
      }

      if (config.healthCheck.timeout > config.healthCheck.interval) {
        errors.push('Health check timeout cannot exceed interval');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates memory limits
   */
  static validateMemoryLimit(memoryLimit: string): {
    valid: boolean;
    bytes: number;
    formatted: string;
    error?: string;
  } {
    const match = memoryLimit.match(/^(\d+)([kmgt])$/i);
    if (!match) {
      return {
        valid: false,
        bytes: 0,
        formatted: '',
        error: 'Invalid memory format. Use: 1g, 512m, etc.'
      };
    }

    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();

    const multipliers: Record<string, number> = {
      'k': 1024,
      'm': 1024 * 1024,
      'g': 1024 * 1024 * 1024,
      't': 1024 * 1024 * 1024 * 1024
    };

    const bytes = value * multipliers[unit];

    return {
      valid: bytes >= 4 * 1024 * 1024 * 1024, // Minimum 4GB
      bytes,
      formatted: `${(bytes / (1024 * 1024 * 1024)).toFixed(2)}GB`
    };
  }

  /**
   * Validates CPU limit
   */
  static validateCpuLimit(cpuLimit: string): {
    valid: boolean;
    cores: number;
    error?: string;
  } {
    const cores = parseFloat(cpuLimit);

    if (isNaN(cores) || cores < 0.5 || cores > 128) {
      return {
        valid: false,
        cores: 0,
        error: 'CPU limit must be between 0.5 and 128 cores'
      };
    }

    return {
      valid: true,
      cores
    };
  }

  /**
   * Validates server name
   */
  static validateServerName(name: string): {
    valid: boolean;
    error?: string;
  } {
    if (name.length < 1 || name.length > 64) {
      return {
        valid: false,
        error: 'Server name must be between 1 and 64 characters'
      };
    }

    if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
      return {
        valid: false,
        error: 'Server name can only contain letters, numbers, spaces, hyphens, and underscores'
      };
    }

    return { valid: true };
  }

  /**
   * Validates password strength
   */
  static validatePassword(password: string): {
    valid: boolean;
    strength: 'weak' | 'medium' | 'strong';
    suggestions: string[];
  } {
    const suggestions: string[] = [];
    let strength: 'weak' | 'medium' | 'strong' = 'weak';

    if (password.length < 8) {
      suggestions.push('Use at least 8 characters');
    } else if (password.length >= 12) {
      strength = 'strong';
    } else {
      strength = 'medium';
    }

    if (!/[A-Z]/.test(password)) {
      suggestions.push('Include uppercase letters');
    }

    if (!/[a-z]/.test(password)) {
      suggestions.push('Include lowercase letters');
    }

    if (!/[0-9]/.test(password)) {
      suggestions.push('Include numbers');
    }

    if (!/[!@#$%^&*]/.test(password)) {
      suggestions.push('Include special characters');
    }

    if (strength !== 'weak' && suggestions.length === 0) {
      strength = 'strong';
    } else if (suggestions.length <= 2) {
      strength = 'medium';
    }

    return {
      valid: password.length >= 6,
      strength,
      suggestions
    };
  }
}

export default {
  ARK_ASCENDED_MAPS,
  ARK_EVOLVED_MAPS,
  createSmallAscendedConfig,
  createMediumAscendedConfig,
  createLargeAscendedClusterConfig,
  createSmallEvolvedConfig,
  createMediumEvolvedConfig,
  createLargeEvolvedClusterConfig,
  PortAllocator,
  ConfigValidator
};
