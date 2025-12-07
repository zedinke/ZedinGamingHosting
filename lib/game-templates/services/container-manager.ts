/**
 * Docker Container Manager Service
 * Container-ek kezelése: start, stop, status, logs, stb.
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Container info
 */
export interface ContainerInfo {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'paused' | 'exited' | 'unknown';
  image: string;
  ports: string[];
  createdAt: string;
  uptime?: string;
  memoryUsage?: string;
  cpuUsage?: string;
}

/**
 * Container Manager
 */
export class ContainerManager {
  /**
   * Container indítása
   */
  static async startContainer(containerName: string): Promise<void> {
    try {
      console.log(`🚀 Container indítása: ${containerName}`);
      await execAsync(`docker start ${containerName}`);
      console.log(`✅ Container elindítva`);
    } catch (error) {
      console.error(`❌ Container start hiba:`, error);
      throw error;
    }
  }

  /**
   * Container leállítása
   */
  static async stopContainer(containerName: string, timeout = 10): Promise<void> {
    try {
      console.log(`🛑 Container leállítása: ${containerName} (timeout: ${timeout}s)`);
      await execAsync(`docker stop -t ${timeout} ${containerName}`);
      console.log(`✅ Container leállítva`);
    } catch (error) {
      console.error(`❌ Container stop hiba:`, error);
      throw error;
    }
  }

  /**
   * Container újraindítása
   */
  static async restartContainer(containerName: string): Promise<void> {
    try {
      console.log(`🔄 Container újraindítása: ${containerName}`);
      await execAsync(`docker restart ${containerName}`);
      console.log(`✅ Container újraindítva`);
    } catch (error) {
      console.error(`❌ Container restart hiba:`, error);
      throw error;
    }
  }

  /**
   * Container törlése
   */
  static async removeContainer(containerName: string, force = false): Promise<void> {
    try {
      console.log(`🗑️  Container törlése: ${containerName}`);
      const forceFlag = force ? '-f' : '';
      await execAsync(`docker rm ${forceFlag} ${containerName}`);
      console.log(`✅ Container törölve`);
    } catch (error) {
      console.error(`❌ Container remove hiba:`, error);
      throw error;
    }
  }

  /**
   * Container státusza
   */
  static async getContainerStatus(containerName: string): Promise<ContainerInfo | null> {
    try {
      const { stdout } = await execAsync(
        `docker inspect ${containerName} --format='{{.Id}}|{{.Name}}|{{.State.Status}}|{{.Config.Image}}|{{.NetworkSettings.Ports}}|{{.Created}}'`
      );

      const [id, name, status, image, ports, createdAt] = stdout.trim().split('|');

      return {
        id: id.substring(0, 12),
        name: name.replace('/', ''),
        status: status as any,
        image,
        ports: ports ? ports.split(' ') : [],
        createdAt,
      };
    } catch (error) {
      console.error(`❌ Container status hiba:`, error);
      return null;
    }
  }

  /**
   * Container logok megtekintése
   */
  static async getContainerLogs(
    containerName: string,
    lines = 100,
    follow = false
  ): Promise<string> {
    try {
      const followFlag = follow ? '-f' : '';
      const { stdout } = await execAsync(
        `docker logs ${followFlag} --tail ${lines} ${containerName}`
      );
      return stdout;
    } catch (error) {
      console.error(`❌ Container logs hiba:`, error);
      throw error;
    }
  }

  /**
   * Container resource użytkownictwa
   */
  static async getContainerStats(containerName: string): Promise<{
    cpuUsage: string;
    memoryUsage: string;
    networkIO: string;
  } | null> {
    try {
      const { stdout } = await execAsync(
        `docker stats ${containerName} --no-stream --format "table {{.CPUPerc}}|{{.MemUsage}}|{{.NetIO}}"`
      );

      const lines = stdout.trim().split('\n');
      if (lines.length < 2) return null;

      const [cpuUsage, memoryUsage, networkIO] = lines[1].split('|').map((s) => s.trim());

      return {
        cpuUsage,
        memoryUsage,
        networkIO,
      };
    } catch (error) {
      console.error(`❌ Container stats hiba:`, error);
      return null;
    }
  }

  /**
   * Összes container listázása
   */
  static async listContainers(all = false): Promise<ContainerInfo[]> {
    try {
      const allFlag = all ? '-a' : '';
      const { stdout } = await execAsync(
        `docker ps ${allFlag} --format "table {{.ID}}|{{.Names}}|{{.Status}}|{{.Image}}|{{.Ports}}"`
      );

      const lines = stdout.trim().split('\n');
      if (lines.length < 2) return [];

      return lines.slice(1).map((line) => {
        const [id, name, status, image, ports] = line.split('|').map((s) => s.trim());

        return {
          id: id.substring(0, 12),
          name,
          status: status.split(' ')[0] as any,
          image,
          ports: ports ? ports.split(', ') : [],
          createdAt: '',
        };
      });
    } catch (error) {
      console.error(`❌ Container list hiba:`, error);
      return [];
    }
  }

  /**
   * Container exec - parancs futtatása containerben
   */
  static async execInContainer(
    containerName: string,
    command: string,
    interactive = false
  ): Promise<string> {
    try {
      const interactiveFlag = interactive ? '-it' : '-d';
      const { stdout } = await execAsync(
        `docker exec ${interactiveFlag} ${containerName} ${command}`
      );
      return stdout;
    } catch (error) {
      console.error(`❌ Container exec hiba:`, error);
      throw error;
    }
  }

  /**
   * Port binding ellenőrzése
   */
  static async checkPortBinding(
    containerName: string,
    containerPort: number,
    protocol = 'udp'
  ): Promise<number | null> {
    try {
      const info = await this.getContainerStatus(containerName);
      if (!info) return null;

      // Port binding parse-olása
      // Format: "28015/udp->0.0.0.0:28015"
      const portStr = info.ports.find((p) => p.includes(`${containerPort}/${protocol}`));

      if (!portStr) {
        console.warn(
          `⚠️  Port binding nem található: ${containerPort}/${protocol}`
        );
        return null;
      }

      // Host port kinyerése
      const match = portStr.match(/(\d+)$/);
      return match ? parseInt(match[1], 10) : containerPort;
    } catch (error) {
      console.error(`❌ Port binding check hiba:`, error);
      return null;
    }
  }

  /**
   * Container volume-ok listázása
   */
  static async getContainerVolumes(containerName: string): Promise<
    Array<{ source: string; destination: string; mode: string }>
  > {
    try {
      const { stdout } = await execAsync(
        `docker inspect ${containerName} --format='{{json .Mounts}}'`
      );

      const mounts = JSON.parse(stdout);

      return mounts.map((mount: any) => ({
        source: mount.Source,
        destination: mount.Destination,
        mode: mount.Mode,
      }));
    } catch (error) {
      console.error(`❌ Container volumes hiba:`, error);
      return [];
    }
  }
}

export default ContainerManager;
