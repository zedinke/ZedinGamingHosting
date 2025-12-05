/**
 * ============================================================================
 * CurseForge Mod Manager for ARK
 * ============================================================================
 * 
 * Handle mod installation, updates, and dependency resolution
 * CurseForge API integration for ARK Survival mods
 */

import axios, { AxiosInstance } from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ModMetadata {
  id: number;
  name: string;
  authors: string[];
  description: string;
  downloadUrl: string;
  version: string;
  fileName: string;
  dependencies: number[];
  gameVersion: string;
  releaseType: 'alpha' | 'beta' | 'release';
  downloadCount: number;
  modId?: number;
}

export interface ModInstallConfig {
  modId: number;
  version?: string;
  installPath: string;
  dependencies?: boolean;
}

export interface ModUpdateResult {
  success: boolean;
  modsUpdated: ModMetadata[];
  modsInstalled: ModMetadata[];
  errors: string[];
}

/**
 * CurseForge Mod Manager
 */
export class CurseForgeModManager {
  private api: AxiosInstance;
  private baseUrl = 'https://api.curseforge.com/v1';
  private gameId = 469; // ARK: Survival Evolved
  private cache: Map<number, ModMetadata> = new Map();

  constructor(apiKey: string) {
    this.api = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'x-api-key': apiKey,
        'Accept': 'application/json',
      },
    });
  }

  /**
   * Search for mods on CurseForge
   */
  async searchMods(query: string, limit: number = 10): Promise<ModMetadata[]> {
    try {
      const response = await this.api.get('/mods/search', {
        params: {
          gameId: this.gameId,
          searchFilter: query,
          limit,
          sortField: 'popularity',
          sortOrder: 'desc',
        },
      });

      return response.data.data.map(this.formatModData.bind(this));
    } catch (error) {
      console.error('Error searching mods:', error);
      return [];
    }
  }

  /**
   * Get mod details
   */
  async getModDetails(modId: number): Promise<ModMetadata | null> {
    // Check cache first
    if (this.cache.has(modId)) {
      return this.cache.get(modId)!;
    }

    try {
      const response = await this.api.get(`/mods/${modId}`);
      const mod = this.formatModData(response.data.data);
      this.cache.set(modId, mod);
      return mod;
    } catch (error) {
      console.error(`Error fetching mod ${modId}:`, error);
      return null;
    }
  }

  /**
   * Get mod files (versions)
   */
  async getModFiles(modId: number): Promise<ModMetadata[]> {
    try {
      const response = await this.api.get(`/mods/${modId}/files`);
      return response.data.data.map((file: any) => ({
        version: file.displayName,
        fileName: file.fileName,
        downloadUrl: file.downloadUrl,
        releaseType: file.releaseType,
        modId,
      })) as ModMetadata[];
    } catch (error) {
      console.error(`Error fetching mod files for ${modId}:`, error);
      return [];
    }
  }

  /**
   * Get mod dependencies
   */
  async getModDependencies(modId: number): Promise<number[]> {
    try {
      const response = await this.api.get(`/mods/${modId}`);
      const data = response.data.data;

      if (!data.links || !Array.isArray(data.links)) {
        return [];
      }

      return data.links
        .filter((link: any) => link.linkType === 1) // 1 = required dependency
        .map((link: any) => link.linkValue);
    } catch (error) {
      console.error(`Error fetching dependencies for ${modId}:`, error);
      return [];
    }
  }

  /**
   * Download mod file
   */
  async downloadMod(downloadUrl: string, outputPath: string): Promise<boolean> {
    try {
      const response = await axios.get(downloadUrl, {
        responseType: 'arraybuffer',
        timeout: 60000,
      });

      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, response.data);

      return true;
    } catch (error) {
      console.error(`Error downloading mod from ${downloadUrl}:`, error);
      return false;
    }
  }

  /**
   * Install mod with dependency resolution
   */
  async installMod(config: ModInstallConfig): Promise<ModMetadata[]> {
    const installed: ModMetadata[] = [];
    const queue = [config.modId];
    const processed = new Set<number>();

    while (queue.length > 0) {
      const modId = queue.shift()!;

      if (processed.has(modId)) continue;
      processed.add(modId);

      // Get mod details
      const mod = await this.getModDetails(modId);
      if (!mod) {
        console.error(`Failed to get details for mod ${modId}`);
        continue;
      }

      // Download
      const fileName = mod.fileName || `mod-${modId}.zip`;
      const outputPath = path.join(config.installPath, fileName);

      const downloaded = await this.downloadMod(mod.downloadUrl, outputPath);
      if (downloaded) {
        installed.push(mod);
      }

      // Add dependencies to queue
      if (config.dependencies) {
        const deps = await this.getModDependencies(modId);
        queue.push(...deps.filter(id => !processed.has(id)));
      }
    }

    return installed;
  }

  /**
   * Check for mod updates
   */
  async checkUpdates(
    installedMods: Map<number, string>,
    installPath: string
  ): Promise<ModUpdateResult> {
    const result: ModUpdateResult = {
      success: true,
      modsUpdated: [],
      modsInstalled: [],
      errors: [],
    };

    for (const [modId, currentVersion] of installedMods) {
      try {
        const files = await this.getModFiles(modId);
        const latestStable = files.find(f => f.releaseType === 'release');

        if (latestStable && latestStable.version !== currentVersion) {
          // Download update
          const fileName = latestStable.fileName || `mod-${modId}.zip`;
          const outputPath = path.join(installPath, fileName);

          const downloaded = await this.downloadMod(latestStable.downloadUrl, outputPath);
          if (downloaded) {
            result.modsUpdated.push(latestStable);
          } else {
            result.errors.push(`Failed to update mod ${modId}`);
            result.success = false;
          }
        }
      } catch (error) {
        result.errors.push(`Error checking updates for mod ${modId}: ${error}`);
        result.success = false;
      }
    }

    return result;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Format mod data from CurseForge API response
   */
  private formatModData(data: any): ModMetadata {
    return {
      id: data.id,
      name: data.name,
      authors: data.authors?.map((a: any) => a.name) || [],
      description: data.summary || '',
      downloadUrl: data.links?.websiteUrl || '',
      version: data.latestFiles?.[0]?.displayName || 'unknown',
      fileName: data.latestFiles?.[0]?.fileName || `mod-${data.id}.zip`,
      dependencies: [],
      gameVersion: 'ARK',
      releaseType: data.latestFiles?.[0]?.releaseType || 'release',
      downloadCount: data.downloadCount || 0,
      modId: data.id,
    };
  }
}

/**
 * Mod manifest for tracking installed mods
 */
export class ModManifest {
  private filePath: string;
  private mods: Map<number, string> = new Map(); // modId -> version

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  /**
   * Load manifest from file
   */
  async load(): Promise<void> {
    try {
      const content = await fs.readFile(this.filePath, 'utf-8');
      const data = JSON.parse(content);

      this.mods.clear();
      for (const [modId, version] of Object.entries(data.mods || {})) {
        this.mods.set(parseInt(modId), version as string);
      }
    } catch (error) {
      // File doesn't exist or is invalid, start fresh
      this.mods.clear();
    }
  }

  /**
   * Save manifest to file
   */
  async save(): Promise<void> {
    const data = {
      timestamp: new Date().toISOString(),
      mods: Object.fromEntries(this.mods),
    };

    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2));
  }

  /**
   * Add mod to manifest
   */
  addMod(modId: number, version: string): void {
    this.mods.set(modId, version);
  }

  /**
   * Get all mods
   */
  getMods(): Map<number, string> {
    return new Map(this.mods);
  }

  /**
   * Remove mod from manifest
   */
  removeMod(modId: number): void {
    this.mods.delete(modId);
  }

  /**
   * Update mod version
   */
  updateMod(modId: number, version: string): void {
    this.mods.set(modId, version);
  }
}
