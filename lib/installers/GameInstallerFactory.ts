/**
 * Game Installer Factory
 * Megfelelő installer-t adja vissza a game-type alapján
 */

import { GameType } from '@prisma/client';
import { BaseGameInstaller } from './utils/BaseGameInstaller';
import { DebugLogger } from './utils/DebugLogger';
import { ArkAscendedInstaller } from './games/ArkAscendedInstaller';
import { MinecraftInstaller } from './games/MinecraftInstaller';
import { RustInstaller } from './games/RustInstaller';
import { SatisfactoryInstaller } from './games/SatisfactoryInstaller';

export class GameInstallerFactory {
  private logger: DebugLogger;

  constructor() {
    this.logger = new DebugLogger('GameInstallerFactory');
  }

  /**
   * Megfelelő installer-t hoz létre
   */
  create(gameType: GameType, machineId: string): BaseGameInstaller {
    this.logger.debug('Creating installer', { gameType, machineId });

    switch (gameType) {
      case 'ARK_ASCENDED':
        return new ArkAscendedInstaller(machineId);

      case 'ARK_EVOLVED':
        // TODO: Create ArkEvolvedInstaller
        this.logger.warn('ARK_EVOLVED installer not yet implemented, using ARK_ASCENDED fallback');
        return new ArkAscendedInstaller(machineId);

      case 'MINECRAFT':
        return new MinecraftInstaller(machineId);

      case 'RUST':
        return new RustInstaller(machineId);

      case 'SATISFACTORY':
        return new SatisfactoryInstaller(machineId);

      default:
        throw new Error(`Unknown game type: ${gameType}`);
    }
  }

  /**
   * Elérhetí game-typek listája
   */
  getSupportedGameTypes(): GameType[] {
    return ['ARK_ASCENDED', 'ARK_EVOLVED'] as GameType[];
  }

  /**
   * Van-e installer a game-type-hoz?
   */
  isSupported(gameType: GameType): boolean {
    return this.getSupportedGameTypes().includes(gameType);
  }
}

// Singleton
export const gameInstallerFactory = new GameInstallerFactory();
