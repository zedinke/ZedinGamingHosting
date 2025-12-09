/**
 * Provisioning Lock Manager
 * 
 * Biztosítja, hogy egyszerre csak 1 telepítés mehessen egy agent gépen.
 * Ha van folyamatban lévő telepítés, a következő várakozik.
 */

import { logger } from './logger';

interface ProvisioningLock {
  agentId: string;
  serverId: string;
  startedAt: Date;
  promise: Promise<void>;
  resolve: () => void;
  reject: (error: Error) => void;
}

class ProvisioningLockManager {
  private locks: Map<string, ProvisioningLock> = new Map();
  private queues: Map<string, Array<() => Promise<void>>> = new Map();

  /**
   * Lock kérése egy agent gépre
   * Ha van már folyamatban lévő telepítés, akkor várakozik
   */
  async acquireLock(agentId: string, serverId: string): Promise<void> {
    logger.info('Provisioning lock kérése', { agentId, serverId });

    // Ha van már lock ezen az agent gépen
    const existingLock = this.locks.get(agentId);
    if (existingLock) {
      logger.info('Provisioning lock foglalt, várakozás...', {
        agentId,
        serverId,
        currentServerId: existingLock.serverId,
        startedAt: existingLock.startedAt,
      });

      // Várunk, amíg a meglévő lock felszabadul
      await existingLock.promise;
    }

    // Lock létrehozása
    let resolve: () => void;
    let reject: (error: Error) => void;
    const promise = new Promise<void>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    const lock: ProvisioningLock = {
      agentId,
      serverId,
      startedAt: new Date(),
      promise: promise!,
      resolve: resolve!,
      reject: reject!,
    };

    this.locks.set(agentId, lock);

    logger.info('Provisioning lock megszerezve', {
      agentId,
      serverId,
      startedAt: lock.startedAt,
    });
  }

  /**
   * Lock felszabadítása
   */
  releaseLock(agentId: string, serverId: string): void {
    const lock = this.locks.get(agentId);

    if (!lock) {
      logger.warn('Provisioning lock nem található a felszabadításkor', {
        agentId,
        serverId,
      });
      return;
    }

    if (lock.serverId !== serverId) {
      logger.warn('Provisioning lock serverId nem egyezik', {
        agentId,
        serverId,
        lockServerId: lock.serverId,
      });
      return;
    }

    // Lock törlése
    this.locks.delete(agentId);

    // Lock felszabadítása (ez feloldja a várakozó promise-okat)
    lock.resolve();

    logger.info('Provisioning lock felszabadítva', {
      agentId,
      serverId,
      duration: Date.now() - lock.startedAt.getTime(),
    });

    // Queue ellenőrzése - ha van várakozó telepítés, akkor az következő
    const queue = this.queues.get(agentId);
    if (queue && queue.length > 0) {
      const nextInstallation = queue.shift();
      if (nextInstallation) {
        logger.info('Következő telepítés indítása a queue-ból', {
          agentId,
          queueLength: queue.length,
        });
        // Aszinkron futtatás, ne blokkolja a lock felszabadítását
        nextInstallation().catch((error) => {
          logger.error('Queue-ból indított telepítés hiba', error, {
            agentId,
          });
        });
      }
    }
  }

  /**
   * Lock felszabadítása hiba esetén
   */
  releaseLockWithError(agentId: string, serverId: string, error: Error): void {
    const lock = this.locks.get(agentId);

    if (!lock) {
      logger.warn('Provisioning lock nem található a hiba felszabadításkor', {
        agentId,
        serverId,
      });
      return;
    }

    if (lock.serverId !== serverId) {
      logger.warn('Provisioning lock serverId nem egyezik hiba esetén', {
        agentId,
        serverId,
        lockServerId: lock.serverId,
      });
      return;
    }

    // Lock törlése
    this.locks.delete(agentId);

    // Hiba továbbítása a várakozóknak
    lock.reject(error);

    logger.error('Provisioning lock felszabadítva hibával', error, {
      agentId,
      serverId,
      duration: Date.now() - lock.startedAt.getTime(),
    });
  }

  /**
   * Ellenőrzi, hogy van-e folyamatban lévő telepítés egy agent gépen
   */
  hasActiveLock(agentId: string): boolean {
    return this.locks.has(agentId);
  }

  /**
   * Aktív lock információk lekérése
   */
  getActiveLock(agentId: string): ProvisioningLock | null {
    return this.locks.get(agentId) || null;
  }

  /**
   * Összes aktív lock lekérése (debug célokra)
   */
  getAllActiveLocks(): Array<{ agentId: string; serverId: string; startedAt: Date }> {
    return Array.from(this.locks.values()).map((lock) => ({
      agentId: lock.agentId,
      serverId: lock.serverId,
      startedAt: lock.startedAt,
    }));
  }
}

// Singleton instance
let instance: ProvisioningLockManager | null = null;

export function getProvisioningLockManager(): ProvisioningLockManager {
  if (!instance) {
    instance = new ProvisioningLockManager();
  }
  return instance;
}

export default ProvisioningLockManager;

