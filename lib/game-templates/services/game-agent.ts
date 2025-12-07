/**
 * Game Agent Service
 * Kommunikáció a game agent-ekkel (szerver gépeken futó service-ek)
 * 
 * Felelősségek:
 * - SteamCMD telepítése
 * - Szerver frissítések kezelése
 * - Status monitoring
 * - Container management
 */

import axios, { AxiosInstance } from 'axios';

/**
 * Agent status info
 */
export interface AgentStatus {
  id: string;
  ip: string;
  port: number;
  status: 'online' | 'offline' | 'error';
  uptime: number; // seconds
  version: string;
  steamcmdInstalled: boolean;
  dockerInstalled: boolean;
  diskFree: number; // GB
  ramFree: number; // MB
  lastHealthCheck: Date;
}

/**
 * Server update info
 */
export interface ServerUpdateInfo {
  serverId: string;
  gameType: string;
  currentVersion: string;
  availableVersion: string;
  updateSize: number; // MB
  estimatedTime: number; // seconds
}

/**
 * Game Agent Service
 */
export class GameAgentService {
  private agents: Map<string, AxiosInstance> = new Map();

  constructor() {}

  /**
   * Agent client regisztrálása
   */
  registerAgent(id: string, ip: string, port: number): void {
    const baseURL = `http://${ip}:${port}`;

    const client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.agents.set(id, client);
    console.log(`✅ Agent regisztrálva: ${id} (${ip}:${port})`);
  }

  /**
   * Agent client lekérése
   */
  private getAgent(agentId: string): AxiosInstance {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent nem található: ${agentId}`);
    }
    return agent;
  }

  /**
   * Health check - agent online státus
   */
  async checkHealth(agentId: string): Promise<AgentStatus> {
    try {
      const agent = this.getAgent(agentId);
      const response = await agent.get('/api/health');

      return response.data;
    } catch (error) {
      console.error(`Agent health check hiba (${agentId}):`, error);
      throw error;
    }
  }

  /**
   * SteamCMD automatikus telepítése az agent gépre
   */
  async installSteamCMD(agentId: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🔧 SteamCMD telepítése indítása: ${agentId}`);

      const agent = this.getAgent(agentId);
      const response = await agent.post('/api/steamcmd/install');

      if (response.data.success) {
        console.log(`✅ SteamCMD sikeresen telepítve: ${agentId}`);
      }

      return response.data;
    } catch (error) {
      console.error(`SteamCMD install hiba (${agentId}):`, error);
      throw error;
    }
  }

  /**
   * SteamCMD verifikálása
   */
  async verifySteamCMD(agentId: string): Promise<boolean> {
    try {
      const agent = this.getAgent(agentId);
      const response = await agent.get('/api/steamcmd/verify');

      return response.data.installed === true;
    } catch (error) {
      console.error(`SteamCMD verify hiba (${agentId}):`, error);
      return false;
    }
  }

  /**
   * Docker verifikálása
   */
  async verifyDocker(agentId: string): Promise<boolean> {
    try {
      const agent = this.getAgent(agentId);
      const response = await agent.get('/api/docker/verify');

      return response.data.installed === true;
    } catch (error) {
      console.error(`Docker verify hiba (${agentId}):`, error);
      return false;
    }
  }

  /**
   * Container indítása
   */
  async startContainer(
    agentId: string,
    containerId: string,
    containerConfig: Record<string, any>
  ): Promise<{ success: boolean; containerId: string }> {
    try {
      console.log(`🚀 Container indítása: ${agentId}/${containerId}`);

      const agent = this.getAgent(agentId);
      const response = await agent.post('/api/docker/container/start', {
        containerId,
        config: containerConfig,
      });

      return response.data;
    } catch (error) {
      console.error(`Container start hiba (${agentId}):`, error);
      throw error;
    }
  }

  /**
   * Container leállítása
   */
  async stopContainer(agentId: string, containerId: string): Promise<void> {
    try {
      console.log(`🛑 Container leállítása: ${agentId}/${containerId}`);

      const agent = this.getAgent(agentId);
      await agent.post('/api/docker/container/stop', { containerId });
    } catch (error) {
      console.error(`Container stop hiba (${agentId}):`, error);
      throw error;
    }
  }

  /**
   * Container státusza
   */
  async getContainerStatus(
    agentId: string,
    containerId: string
  ): Promise<{
    id: string;
    status: string;
    ports: string[];
    cpu: string;
    memory: string;
  }> {
    try {
      const agent = this.getAgent(agentId);
      const response = await agent.get(`/api/docker/container/status/${containerId}`);

      return response.data;
    } catch (error) {
      console.error(`Container status hiba (${agentId}):`, error);
      throw error;
    }
  }

  /**
   * Container logok
   */
  async getContainerLogs(
    agentId: string,
    containerId: string,
    lines = 100
  ): Promise<string> {
    try {
      const agent = this.getAgent(agentId);
      const response = await agent.get(`/api/docker/container/logs/${containerId}`, {
        params: { lines },
      });

      return response.data.logs;
    } catch (error) {
      console.error(`Container logs hiba (${agentId}):`, error);
      throw error;
    }
  }

  /**
   * Szerver frissítés ellenőrzése (SteamCMD-vel)
   */
  async checkServerUpdate(
    agentId: string,
    steamAppId: number
  ): Promise<ServerUpdateInfo | null> {
    try {
      const agent = this.getAgent(agentId);
      const response = await agent.post('/api/steamcmd/check-update', {
        appId: steamAppId,
      });

      return response.data.updateInfo;
    } catch (error) {
      console.error(`Server update check hiba (${agentId}):`, error);
      return null;
    }
  }

  /**
   * Szerver frissítése (SteamCMD-vel)
   */
  async updateServer(
    agentId: string,
    serverId: string,
    steamAppId: number,
    installDir: string
  ): Promise<{ success: boolean; version: string; completedAt: Date }> {
    try {
      console.log(`📥 Szerver frissítése indítása: ${agentId}/${serverId}`);

      const agent = this.getAgent(agentId);
      const response = await agent.post('/api/steamcmd/update-server', {
        serverId,
        appId: steamAppId,
        installDir,
      });

      if (response.data.success) {
        console.log(`✅ Szerver frissítve: ${agentId}/${serverId} -> v${response.data.version}`);
      }

      return response.data;
    } catch (error) {
      console.error(`Server update hiba (${agentId}):`, error);
      throw error;
    }
  }

  /**
   * Szerver backup létrehozása
   */
  async createServerBackup(
    agentId: string,
    serverId: string,
    backupName?: string
  ): Promise<{ success: boolean; backupPath: string; size: number }> {
    try {
      console.log(`💾 Szerver backup indítása: ${agentId}/${serverId}`);

      const agent = this.getAgent(agentId);
      const response = await agent.post('/api/server/backup', {
        serverId,
        backupName,
      });

      if (response.data.success) {
        console.log(`✅ Backup sikeresen létrehozva: ${response.data.backupPath}`);
      }

      return response.data;
    } catch (error) {
      console.error(`Server backup hiba (${agentId}):`, error);
      throw error;
    }
  }

  /**
   * Disk space check
   */
  async checkDiskSpace(agentId: string): Promise<{
    total: number;
    used: number;
    free: number;
    percentUsed: number;
  }> {
    try {
      const agent = this.getAgent(agentId);
      const response = await agent.get('/api/system/disk');

      return response.data;
    } catch (error) {
      console.error(`Disk check hiba (${agentId}):`, error);
      throw error;
    }
  }

  /**
   * System info
   */
  async getSystemInfo(agentId: string): Promise<{
    cpu: string;
    cpuCores: number;
    ram: number;
    os: string;
    kernel: string;
    uptime: number;
  }> {
    try {
      const agent = this.getAgent(agentId);
      const response = await agent.get('/api/system/info');

      return response.data;
    } catch (error) {
      console.error(`System info hiba (${agentId}):`, error);
      throw error;
    }
  }

  /**
   * Template letöltése és kibontása az agent gépen
   */
  async deployTemplate(
    agentId: string,
    serverId: string,
    templateUrl: string,
    extractPath: string
  ): Promise<{ success: boolean; extractedPath: string }> {
    try {
      console.log(`📦 Template deployment indítása: ${agentId}/${serverId}`);

      const agent = this.getAgent(agentId);
      const response = await agent.post('/api/templates/deploy', {
        serverId,
        templateUrl,
        extractPath,
      });

      if (response.data.success) {
        console.log(`✅ Template sikeresen telepítve: ${response.data.extractedPath}`);
      }

      return response.data;
    } catch (error) {
      console.error(`Template deployment hiba (${agentId}):`, error);
      throw error;
    }
  }
}

/**
 * Singleton instance
 */
let instance: GameAgentService | null = null;

export function getGameAgentService(): GameAgentService {
  if (!instance) {
    instance = new GameAgentService();
  }
  return instance;
}

export default GameAgentService;
