/**
 * Rust Mod Manager
 * Handles mod installation, removal, and updates for Rust servers
 */

import { RustInstaller } from './RustInstaller';
import { InstallConfig } from '../utils/BaseGameInstaller';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

export interface RustMod {
  id: string;
  name: string;
  displayName: string;
  version: string;
  downloadUrl: string;
  author: string;
  requirements?: {
    oxide?: string;
    rust_version?: string;
  };
}

export interface ModInstallStatus {
  modId: string;
  status: 'INSTALLING' | 'INSTALLED' | 'FAILED' | 'UPDATING' | 'UNINSTALLING';
  installedAt?: Date;
  error?: string;
  version: string;
}

export class RustModManager {
  private pluginPath: string;

  constructor(serverId: string) {
    this.pluginPath = `/opt/rust-servers/${serverId}/plugins`;
  }

  private log(level: 'info' | 'error' | 'warn', message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] [RustModManager] ${message}`;
    if (level === 'error') {
      console.error(logMessage, data);
    } else if (level === 'warn') {
      console.warn(logMessage, data);
    } else {
      console.log(logMessage, data);
    }
  }

  /**
   * Install a mod on a Rust server
   */
  async installMod(serverId: string, mod: RustMod, config: InstallConfig): Promise<ModInstallStatus> {
    this.log('info', `Installing Rust mod: ${mod.displayName} (${mod.version})`, {
      serverId,
      modId: mod.id,
      downloadUrl: mod.downloadUrl,
    });

    try {
      // Validate Oxide is installed
      const hasOxide = await this.validateOxideInstallation(config);
      if (!hasOxide) {
        throw new Error('Oxide framework not installed. Mods require Oxide.');
      }

      // Download mod
      await this.downloadMod(mod);

      // Extract and install
      await this.extractModToPluginDirectory(mod);

      // Validate installation
      const installed = await this.validateModInstallation(mod);
      if (!installed) {
        throw new Error('Mod installation validation failed');
      }

      this.log('info', `Mod installed successfully: ${mod.displayName}`, {
        serverId,
        modId: mod.id,
      });

      return {
        modId: mod.id,
        status: 'INSTALLED',
        installedAt: new Date(),
        version: mod.version,
      };
    } catch (error) {
      this.log('error', `Mod installation failed: ${mod.displayName}`, {
        serverId,
        modId: mod.id,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        modId: mod.id,
        status: 'FAILED',
        error: error instanceof Error ? error.message : String(error),
        version: mod.version,
      };
    }
  }

  /**
   * Uninstall a mod from a Rust server
   */
  async uninstallMod(serverId: string, mod: RustMod): Promise<ModInstallStatus> {
    this.log('info', `Uninstalling Rust mod: ${mod.displayName}`, {
      serverId,
      modId: mod.id,
    });

    try {
      const modFileName = mod.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const modFilePath = join(this.pluginPath, `${modFileName}.cs`);

      // Check if mod file exists
      if (!existsSync(modFilePath)) {
        throw new Error(`Mod file not found: ${modFilePath}`);
      }

      // Remove mod file
      await rm(modFilePath);

      // Check for mod data directories
      const modDataDir = join(this.pluginPath, `data/${modFileName}`);
      if (existsSync(modDataDir)) {
        await rm(modDataDir, { recursive: true });
      }

      this.log('info', `Mod uninstalled successfully: ${mod.displayName}`, {
        serverId,
        modId: mod.id,
      });

      return {
        modId: mod.id,
        status: 'UNINSTALLING',
        version: mod.version,
      };
    } catch (error) {
      this.log('error', `Mod uninstallation failed: ${mod.displayName}`, {
        serverId,
        modId: mod.id,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        modId: mod.id,
        status: 'FAILED',
        error: error instanceof Error ? error.message : String(error),
        version: mod.version,
      };
    }
  }

  /**
   * Update a mod to the latest version
   */
  async updateMod(serverId: string, mod: RustMod, currentVersion: string): Promise<ModInstallStatus> {
    this.log('info', `Updating Rust mod: ${mod.displayName} (${currentVersion} -> ${mod.version})`, {
      serverId,
      modId: mod.id,
    });

    try {
      // Uninstall current version
      await this.uninstallMod(serverId, { ...mod, version: currentVersion });

      // Install new version
      const result = await this.installMod(serverId, mod, {} as InstallConfig);

      return {
        ...result,
        status: 'UPDATING',
      };
    } catch (error) {
      this.log('error', `Mod update failed: ${mod.displayName}`, {
        serverId,
        modId: mod.id,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        modId: mod.id,
        status: 'FAILED',
        error: error instanceof Error ? error.message : String(error),
        version: mod.version,
      };
    }
  }

  /**
   * Validate that Oxide framework is installed
   */
  private async validateOxideInstallation(config: InstallConfig): Promise<boolean> {
    try {
      const result = await execAsync('ls /opt/rust-servers/*/Managed/Assembly-CSharp.dll 2>/dev/null | head -1');
      return result.stdout.length > 0;
    } catch (error) {
      this.log('warn', 'Oxide installation not detected', { error });
      return false;
    }
  }

  /**
   * Download mod from URL
   */
  private async downloadMod(mod: RustMod): Promise<void> {
    try {
      // Ensure plugin directory exists
      if (!existsSync(this.pluginPath)) {
        await mkdir(this.pluginPath, { recursive: true });
      }

      const modFileName = mod.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const downloadPath = join(this.pluginPath, `${modFileName}.cs`);

      // Download using wget or curl
      await execAsync(`wget -O ${downloadPath} "${mod.downloadUrl}" --timeout=30 2>&1`);

      this.log('info', `Mod downloaded: ${mod.displayName}`, {
        modId: mod.id,
        filePath: downloadPath,
      });
    } catch (error) {
      throw new Error(`Failed to download mod: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Extract and install mod to plugin directory
   */
  private async extractModToPluginDirectory(mod: RustMod): Promise<void> {
    try {
      const modFileName = mod.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const modFilePath = join(this.pluginPath, `${modFileName}.cs`);

      // Verify file was downloaded
      if (!existsSync(modFilePath)) {
        throw new Error('Mod file not found after download');
      }

      // Set permissions
      await execAsync(`chmod 644 ${modFilePath}`);

      this.log('info', `Mod extracted: ${mod.displayName}`, {
        modId: mod.id,
        filePath: modFilePath,
      });
    } catch (error) {
      throw new Error(`Failed to extract mod: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate mod installation
   */
  private async validateModInstallation(mod: RustMod): Promise<boolean> {
    try {
      const modFileName = mod.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const modFilePath = join(this.pluginPath, `${modFileName}.cs`);

      return existsSync(modFilePath);
    } catch (error) {
      this.log('error', `Mod validation failed: ${mod.displayName}`, { error });
      return false;
    }
  }

  /**
   * Get list of installed mods
   */
  async getInstalledMods(): Promise<string[]> {
    try {
      if (!existsSync(this.pluginPath)) {
        return [];
      }

      const { stdout } = await execAsync(`ls -la ${this.pluginPath}/*.cs 2>/dev/null || echo ''`);
      const modNames = stdout
        .split('\n')
        .filter((line) => line.length > 0)
        .map((line) => {
          const parts = line.split(' ');
          return parts[parts.length - 1].split('/').pop()?.replace('.cs', '') || '';
        });

      return modNames.filter((m) => m.length > 0);
    } catch (error) {
      this.log('warn', 'Failed to get installed mods', { error });
      return [];
    }
  }

  /**
   * Check if a specific mod is installed
   */
  async isModInstalled(mod: RustMod): Promise<boolean> {
    try {
      const modFileName = mod.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const modFilePath = join(this.pluginPath, `${modFileName}.cs`);
      return existsSync(modFilePath);
    } catch (error) {
      return false;
    }
  }

  /**
   * One-click install multiple mods
   */
  async installMultipleMods(
    serverId: string,
    mods: RustMod[],
    config: InstallConfig
  ): Promise<ModInstallStatus[]> {
    this.log('info', `Installing ${mods.length} mods to server`, {
      serverId,
      modCount: mods.length,
    });

    const results: ModInstallStatus[] = [];

    for (const mod of mods) {
      try {
        const result = await this.installMod(serverId, mod, config);
        results.push(result);
      } catch (error) {
        results.push({
          modId: mod.id,
          status: 'FAILED',
          error: error instanceof Error ? error.message : String(error),
          version: mod.version,
        });
      }
    }

    return results;
  }
}
