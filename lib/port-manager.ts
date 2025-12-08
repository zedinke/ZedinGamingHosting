/**
 * Port Manager Service
 * Centralizált port allokáció és kezelés játékszerverekhez
 */

import { prisma } from '@/lib/prisma';
import { GameType } from '@prisma/client';
import { executeSSHCommand } from './ssh-client';
import { logger } from './logger';

export interface PortAllocationResult {
  port: number;
  queryPort?: number;
  rconPort?: number;
  telnetPort?: number;
  webMapPort?: number;
  beaconPort?: number;
  steamPeerPort?: number;
  rustPlusPort?: number;
}

export interface PortAvailabilityCheck {
  available: boolean;
  reason?: string;
}

/**
 * Port Manager - Port allokáció és kezelés
 */
export class PortManager {
  /**
   * Port allokáció játékszerver számára
   */
  static async allocatePorts(
    machineId: string,
    gameType: GameType,
    serverId: string,
    basePort?: number
  ): Promise<PortAllocationResult> {
    try {
      logger.info('Port allocation started', { machineId, gameType, serverId, basePort });

      // Játék-specifikus port követelmények
      const portRequirements = this.getPortRequirements(gameType);
      
      // Alap port keresése vagy generálása
      let gamePort = basePort;
      if (!gamePort) {
        gamePort = await this.findAvailablePort(machineId, gameType);
      }

      // Port elérhetőség ellenőrzés (adatbázis + SSH)
      const availability = await this.checkPortAvailability(machineId, gamePort);
      if (!availability.available) {
        // Ha a basePort foglalt, keresünk újat
        gamePort = await this.findAvailablePort(machineId, gameType);
      }

      // További portok számítása játék típus alapján
      const ports = this.calculatePorts(gameType, gamePort);

      // Port allokáció mentése az adatbázisba
      await prisma.portAllocation.create({
        data: {
          machineId,
          serverId,
          gameType,
          port: ports.port,
          queryPort: ports.queryPort,
          rconPort: ports.rconPort,
          telnetPort: ports.telnetPort,
          webMapPort: ports.webMapPort,
          beaconPort: ports.beaconPort,
          steamPeerPort: ports.steamPeerPort,
          rustPlusPort: ports.rustPlusPort,
        },
      });

      logger.info('Ports allocated successfully', { machineId, serverId, ports });

      return ports;
    } catch (error: any) {
      logger.error('Port allocation failed', error, { machineId, gameType, serverId });
      throw new Error(`Port allocation failed: ${error.message}`);
    }
  }

  /**
   * Port felszabadítás
   */
  static async deallocatePorts(serverId: string): Promise<void> {
    try {
      await prisma.portAllocation.deleteMany({
        where: { serverId },
      });
      logger.info('Ports deallocated', { serverId });
    } catch (error: any) {
      logger.error('Port deallocation failed', error, { serverId });
      throw new Error(`Port deallocation failed: ${error.message}`);
    }
  }

  /**
   * Szabad port keresése
   */
  static async findAvailablePort(
    machineId: string,
    gameType: GameType,
    startPort?: number
  ): Promise<number> {
    const portRequirements = this.getPortRequirements(gameType);
    const minPort = startPort || portRequirements.minPort || 27015;
    const maxPort = portRequirements.maxPort || 30000;
    const maxRetries = 100;

    for (let i = 0; i < maxRetries; i++) {
      const testPort = minPort + i;

      if (testPort > maxPort) {
        throw new Error(`No available ports found in range ${minPort}-${maxPort}`);
      }

      const availability = await this.checkPortAvailability(machineId, testPort);
      if (availability.available) {
        return testPort;
      }
    }

    throw new Error(`No available ports found after ${maxRetries} retries`);
  }

  /**
   * Port elérhetőség ellenőrzés (adatbázis + SSH)
   */
  static async checkPortAvailability(
    machineId: string,
    port: number
  ): Promise<PortAvailabilityCheck> {
    try {
      // 1. Adatbázis ellenőrzés
      const existing = await prisma.portAllocation.findFirst({
        where: {
          machineId,
          port,
        },
      });

      if (existing) {
        return {
          available: false,
          reason: `Port ${port} already allocated to server ${existing.serverId}`,
        };
      }

      // 2. SSH-n keresztül ellenőrzés (ha van machine info)
      const machine = await prisma.serverMachine.findUnique({
        where: { id: machineId },
      });

      if (machine && machine.sshKeyPath) {
        try {
          const sshConfig = {
            host: machine.ipAddress,
            port: machine.sshPort,
            user: machine.sshUser,
            keyPath: machine.sshKeyPath,
          };

          // netstat parancs futtatása a gépen
          const result = await executeSSHCommand(
            sshConfig,
            `netstat -tuln | grep -E '[: ]${port}[^0-9]' || echo 'PORT_FREE'`
          );

          if (!result.stdout.includes('PORT_FREE') && result.stdout.trim()) {
            return {
              available: false,
              reason: `Port ${port} is in use on machine ${machine.ipAddress}`,
            };
          }
        } catch (sshError: any) {
          // SSH hiba esetén csak figyelmeztetünk, de nem blokkoljuk
          logger.warn('SSH port check failed, continuing with database check only', {
            machineId,
            port,
            error: sshError.message,
          });
        }
      }

      return { available: true };
    } catch (error: any) {
      logger.error('Port availability check failed', error, { machineId, port });
      return {
        available: false,
        reason: `Check failed: ${error.message}`,
      };
    }
  }

  /**
   * Port tartomány keresése több port számára
   */
  static async findAvailablePortRange(
    machineId: string,
    gameType: GameType,
    count: number
  ): Promise<number[]> {
    const ports: number[] = [];
    let startPort = await this.findAvailablePort(machineId, gameType);

    for (let i = 0; i < count; i++) {
      let found = false;
      let attempts = 0;
      const maxAttempts = 50;

      while (!found && attempts < maxAttempts) {
        const testPort = startPort + i;
        const availability = await this.checkPortAvailability(machineId, testPort);

        if (availability.available) {
          ports.push(testPort);
          found = true;
        } else {
          startPort = await this.findAvailablePort(machineId, gameType);
          attempts++;
        }
      }

      if (!found) {
        throw new Error(`Could not find ${count} consecutive available ports`);
      }
    }

    return ports;
  }

  /**
   * Port követelmények játék típus alapján
   */
  private static getPortRequirements(gameType: GameType): {
    minPort?: number;
    maxPort?: number;
    ports: string[];
  } {
    const requirements: Partial<Record<GameType, { minPort?: number; maxPort?: number; ports: string[] }>> = {
      // 7 Days to Die
      SEVEN_DAYS_TO_DIE: {
        minPort: 26900,
        maxPort: 28000,
        ports: ['port', 'telnetPort', 'webMapPort'],
      },
      // ARK játékok
      ARK_EVOLVED: {
        minPort: 27015,
        maxPort: 28000,
        ports: ['port', 'queryPort', 'rconPort'],
      },
      ARK_ASCENDED: {
        minPort: 27015,
        maxPort: 28000,
        ports: ['port', 'queryPort', 'rconPort'],
      },
      // Rust
      RUST: {
        minPort: 28015,
        maxPort: 29000,
        ports: ['port', 'queryPort', 'rconPort', 'rustPlusPort'],
      },
      // Valheim
      VALHEIM: {
        minPort: 2456,
        maxPort: 2500,
        ports: ['port', 'queryPort'],
      },
      // Minecraft
      MINECRAFT: {
        minPort: 25565,
        maxPort: 25600,
        ports: ['port', 'queryPort', 'rconPort'],
      },
      // CS2
      CS2: {
        minPort: 27015,
        maxPort: 27100,
        ports: ['port', 'queryPort', 'rconPort'],
      },
    };

    // Default értékek minden más játékhoz
    const defaultRequirements = {
      minPort: 27015,
      maxPort: 30000,
      ports: ['port'],
    };

    return requirements[gameType] || defaultRequirements;
  }

  /**
   * Portok számítása játék típus alapján
   */
  private static calculatePorts(
    gameType: GameType,
    basePort: number
  ): PortAllocationResult {
    const result: PortAllocationResult = { port: basePort };

    switch (gameType) {
      case 'SEVEN_DAYS_TO_DIE':
        result.port = basePort;
        result.telnetPort = basePort + 1;
        result.webMapPort = basePort + 2;
        break;

      case 'ARK_EVOLVED':
      case 'ARK_ASCENDED':
        result.port = basePort; // Game port
        result.queryPort = basePort + 1;
        result.rconPort = basePort + 2;
        break;

      case 'RUST':
        result.port = basePort;
        result.queryPort = basePort + 1;
        result.rconPort = basePort + 2;
        result.rustPlusPort = basePort + 3;
        break;

      case 'SATISFACTORY':
        result.port = basePort; // QueryPort
        result.beaconPort = basePort + 2;
        // GamePort = QueryPort - 2
        break;

      case 'VALHEIM':
        result.port = basePort;
        result.queryPort = basePort + 1;
        break;

      default:
        result.port = basePort;
    }

    return result;
  }

  /**
   * Szerver port allokációjának lekérése
   */
  static async getServerPorts(serverId: string): Promise<PortAllocationResult | null> {
    try {
      const allocation = await prisma.portAllocation.findUnique({
        where: { serverId },
      });

      if (!allocation) {
        return null;
      }

      return {
        port: allocation.port,
        queryPort: allocation.queryPort ?? undefined,
        rconPort: allocation.rconPort ?? undefined,
        telnetPort: allocation.telnetPort ?? undefined,
        webMapPort: allocation.webMapPort ?? undefined,
        beaconPort: allocation.beaconPort ?? undefined,
        steamPeerPort: allocation.steamPeerPort ?? undefined,
        rustPlusPort: allocation.rustPlusPort ?? undefined,
      };
    } catch (error: any) {
      logger.error('Failed to get server ports', error, { serverId });
      return null;
    }
  }

  /**
   * Gép összes port allokációjának lekérése
   */
  static async getMachinePorts(machineId: string): Promise<PortAllocationResult[]> {
    try {
      const allocations = await prisma.portAllocation.findMany({
        where: { machineId },
      });

      return allocations.map((alloc) => ({
        port: alloc.port,
        queryPort: alloc.queryPort ?? undefined,
        rconPort: alloc.rconPort ?? undefined,
        telnetPort: alloc.telnetPort ?? undefined,
        webMapPort: alloc.webMapPort ?? undefined,
        beaconPort: alloc.beaconPort ?? undefined,
        steamPeerPort: alloc.steamPeerPort ?? undefined,
        rustPlusPort: alloc.rustPlusPort ?? undefined,
      }));
    } catch (error: any) {
      logger.error('Failed to get machine ports', error, { machineId });
      return [];
    }
  }
}

export default PortManager;

