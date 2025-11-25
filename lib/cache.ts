/**
 * In-memory cache rendszer
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class Cache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 perc

  /**
   * Érték beállítása
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Érték lekérdezése
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Érték törlése
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Cache törlése
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Lejárt bejegyzések törlése
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Cache statisztikák
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export const cache = new Cache();

// Automatikus cleanup 1 percenként
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cache.cleanup();
  }, 60 * 1000);
}

/**
 * Cache wrapper függvény
 */
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  const cached = cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  const value = await fn();
  cache.set(key, value, ttl);
  return value;
}

