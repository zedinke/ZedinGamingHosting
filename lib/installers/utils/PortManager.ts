/**
 * Port Manager - centralizált port allokációs logika
 * Minden game-type port requirements itt van definiálva
 */

import { GameType } from '@prisma/client';
import { PortAllocation } from './BaseGameInstaller';
import { DebugLogger } from './DebugLogger';

interface GamePortConfig {
  basePortCount: 1 | 2 | 3 | 4 | 5 | 6; // Hány portot igényel?
  portNames: string[]; // ['port', 'queryPort', 'beaconPort'] stb
  description: string;
}

export class PortManager {
  private logger: DebugLogger;
  private gamePortConfigs: Map<GameType, GamePortConfig> = new Map();

  constructor() {
    this.logger = new DebugLogger('PortManager');
    this.initializeConfigs();
  }

  private initializeConfigs(): void {
    // ARK Ascended: 6 port
    this.gamePortConfigs.set('ARK_ASCENDED', {
      basePortCount: 6,
      portNames: ['port', 'queryPort', 'beaconPort', 'steamPeerPort', 'rconPort', 'rawSockPort'],
      description: 'ARK Ascended (6 port: game, query, beacon, steamPeer, rcon, rawSock)',
    });

    // ARK Evolved: 4 port
    this.gamePortConfigs.set('ARK_EVOLVED', {
      basePortCount: 4,
      portNames: ['port', 'queryPort', 'beaconPort', 'rconPort'],
      description: 'ARK Evolved (4 port: game, query, beacon, rcon)',
    });

    // Minecraft: 1 port
    this.gamePortConfigs.set('MINECRAFT', {
      basePortCount: 1,
      portNames: ['port'],
      description: 'Minecraft (1 port)',
    });

    // Rust: 3 port
    this.gamePortConfigs.set('RUST', {
      basePortCount: 3,
      portNames: ['port', 'queryPort', 'rustPlusPort'],
      description: 'Rust (3 port: game, query, rustPlus)',
    });

    // Satisfactory: 3 port
    this.gamePortConfigs.set('SATISFACTORY', {
      basePortCount: 3,
      portNames: ['port', 'queryPort', 'beaconPort'],
      description: 'Satisfactory (3 port: game, query, beacon)',
    });

    // 7 Days to Die: 4 port
    this.gamePortConfigs.set('SEVEN_DAYS_TO_DIE', {
      basePortCount: 4,
      portNames: ['port', 'queryPort', 'telnetPort', 'webMapPort'],
      description: '7 Days to Die (4 port: game, query, telnet, webMap)',
    });

    // Valheim: 2 port
    this.gamePortConfigs.set('VALHEIM', {
      basePortCount: 2,
      portNames: ['port', 'queryPort'],
      description: 'Valheim (2 port)',
    });

    // The Forest: 2 port
    this.gamePortConfigs.set('THE_FOREST', {
      basePortCount: 2,
      portNames: ['port', 'steamPeerPort'],
      description: 'The Forest (2 port: game, steamPeer)',
    });

    // Conan Exiles: 1 port
    this.gamePortConfigs.set('CONAN_EXILES', {
      basePortCount: 1,
      portNames: ['port'],
      description: 'Conan Exiles (1 port)',
    });

    // DayZ: 1 port
    this.gamePortConfigs.set('DAYZ', {
      basePortCount: 1,
      portNames: ['port'],
      description: 'DayZ (1 port)',
    });

    // Project Zomboid: 1 port
    this.gamePortConfigs.set('PROJECT_ZOMBOID', {
      basePortCount: 1,
      portNames: ['port'],
      description: 'Project Zomboid (1 port)',
    });

    // Palworld: 1 port
    this.gamePortConfigs.set('PALWORLD', {
      basePortCount: 1,
      portNames: ['port'],
      description: 'Palworld (1 port)',
    });

    // Enshrouded: 1 port
    this.gamePortConfigs.set('ENSHROUDED', {
      basePortCount: 1,
      portNames: ['port'],
      description: 'Enshrouded (1 port)',
    });

    // Sons of the Forest: 1 port
    this.gamePortConfigs.set('SONS_OF_THE_FOREST', {
      basePortCount: 1,
      portNames: ['port'],
      description: 'Sons of the Forest (1 port)',
    });

    // Default fallback
    const defaultConfig: GamePortConfig = {
      basePortCount: 1,
      portNames: ['port'],
      description: 'Generic/Unknown game (1 port)',
    };
    this.gamePortConfigs.set('OTHER', defaultConfig);
  }

  /**
   * Portokat allokál egy adott játékhoz
   */
  allocate(gameType: GameType, basePort: number): PortAllocation {
    const config = this.gamePortConfigs.get(gameType);
    if (!config) {
      this.logger.warn(`Unknown game type: ${gameType}, using default (1 port)`);
      return { port: basePort };
    }

    this.logger.debug(`Allocating ports for ${gameType}`, {
      basePort,
      config: config.description,
    });

    const result: PortAllocation = {
      port: basePort,
    };

    // Portokat allokálunk a config alapján
    for (let i = 1; i < config.basePortCount; i++) {
      const portName = config.portNames[i];
      const portValue = basePort + i;

      (result as any)[portName] = portValue;
    }

    this.logger.debug(`Ports allocated`, result);
    return result;
  }

  /**
   * Egy portó allokációt vizsgál meg - valid-e?
   */
  validate(gameType: GameType, allocation: PortAllocation): boolean {
    const config = this.gamePortConfigs.get(gameType);
    if (!config) return true; // Default OK

    // Összes requiredPort megvan-e?
    for (const portName of config.portNames) {
      if ((allocation as any)[portName] === undefined) {
        this.logger.warn(`Missing port: ${portName}`, { gameType, allocation });
        return false;
      }
    }

    return true;
  }

  /**
   * Game-type konfigurációt visszaad
   */
  getConfig(gameType: GameType): GamePortConfig | undefined {
    return this.gamePortConfigs.get(gameType);
  }

  /**
   * Összes konfigurációt visszaad (info/debug)
   */
  getAllConfigs(): Record<string, GamePortConfig> {
    const result: Record<string, GamePortConfig> = {};
    this.gamePortConfigs.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }
}

// Singleton instance
export const portManager = new PortManager();
