/**
 * Template Manager Service
 * Kezeli a template letöltést, kibontást, konfigurálást
 */

import { GameTemplateType, GameTemplate, TemplateDeploySession } from '../types';
import { getTemplate } from '../models/templates';
import { getGoogleDriveService } from './google-drive';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Template Manager - Fő service
 */
export class TemplateManager {
  /**
   * Deployment session megkezdése
   * @param serverId - Szerver ID
   * @param templateId - Melyik template
   * @returns Session ID
   */
  static async createDeploySession(
    serverId: string,
    templateId: GameTemplateType
  ): Promise<TemplateDeploySession> {
    const template = getTemplate(templateId);
    
    const session: TemplateDeploySession = {
      id: `deploy-${serverId}-${Date.now()}`,
      serverId,
      templateId,
      phase: 'DOWNLOADING',
      progress: 0,
      messages: [
        {
          timestamp: new Date(),
          message: `Template deployment kezdődik: ${template.name} v${template.version}`,
          level: 'INFO',
        },
      ],
      startedAt: new Date(),
    };
    
    return session;
  }

  /**
   * Template letöltése Google Drive-ról
   * @param gdrive - GDrive file info
   * @param destinationPath - Hova mentsük
   */
  static async downloadTemplate(
    gdrive: GameTemplate['gdrive'],
    destinationPath: string
  ): Promise<void> {
    const gdriveService = getGoogleDriveService();

    console.log(`📥 Template letöltése Google Drive-ról...`);
    console.log(`   Fájl ID: ${gdrive.fileId}`);
    console.log(`   Fájl: ${gdrive.fileName}`);
    console.log(`   Méret: ${gdrive.sizeGb} GB`);

  /**
   * Template kibontása
   * @param archivePath - TAR.GZ/ZIP elérési útvonala
   * @param extractPath - Hova bontsuk ki
   */
  static async extractTemplate(
    archivePath: string,
    extractPath: string
  ): Promise<void> {
    console.log(`📦 Template kibontása...`);
    console.log(`   Forrás: ${archivePath}`);
    console.log(`   Cél: ${extractPath}`);

    try {
      // Fájl típus felismerés
      let extractCommand = '';

      if (archivePath.endsWith('.tar.gz') || archivePath.endsWith('.tgz')) {
        extractCommand = `mkdir -p "${extractPath}" && tar -xzf "${archivePath}" -C "${extractPath}"`;
      } else if (archivePath.endsWith('.zip')) {
        extractCommand = `mkdir -p "${extractPath}" && unzip -q "${archivePath}" -d "${extractPath}"`;
      } else if (archivePath.endsWith('.tar')) {
        extractCommand = `mkdir -p "${extractPath}" && tar -xf "${archivePath}" -C "${extractPath}"`;
      } else {
        throw new Error(
          `Nem támogatott archive formátum: ${archivePath}. Támogatott: .tar.gz, .tar, .zip`
        );
      }

      // Kibontás
      console.log(`   Parancs: ${extractCommand}`);
      await execAsync(extractCommand);

      // Permissions beállítása
      await execAsync(`chmod -R 755 "${extractPath}"`);

      console.log(`✅ Template sikeresen kibontva`);
    } catch (error) {
      console.error(`❌ Template kibontás hiba:`, error);
      throw error;
    }
  }       gdrive.checksum
        );

        if (!isValid) {
          throw new Error('Checksum validáció sikertelen!');
        }
      }

      console.log(`✅ Template sikeresen letöltve`);
    } catch (error) {
      console.error(`❌ Template letöltés hiba:`, error);
      throw error;
    }
  }

  /**
   * Template kibontása
   * @param archivePath - TAR.GZ/ZIP elérési útvonala
   * @param extractPath - Hova bontsuk ki
   */
  static async extractTemplate(
    archivePath: string,
    extractPath: string
  ): Promise<void> {
    // TODO: Extraction implementáció
  /**
   * Docker container indítása
   * @param template - Game template
   * @param serverId - Szerver ID
   * @param configPath - Konfig fájl elérési útvonala
   */
  static async startContainer(
    template: GameTemplate,
    serverId: string,
    configPath: string
  ): Promise<string> {
    console.log(`🐳 Docker container indítása...`);
    console.log(`   Image: ${template.dockerImage}`);
    console.log(`   Szerver: ${serverId}`);
    console.log(`   Config: ${configPath}`);

    try {
      const containerName = `game-${serverId}`;
      const serverDir = `/opt/servers/${serverId}`;

      // Port binding string generálása
      const portBindings = Object.entries(template.ports)
        .map(([_, port]) => `-p ${port}:${port}/udp`)
        .join(' ');

      // Container run parancs
      const runCommand = `docker run -d \\
        --name ${containerName} \\
        --restart unless-stopped \\
        -v ${serverDir}:/data \\
        ${portBindings} \\
        ${template.dockerImage}`;

      console.log(`   Parancs: docker run ...`);
      const { stdout } = await execAsync(runCommand);

      const containerId = stdout.trim();
      console.log(`✅ Container elindítva: ${containerId.substring(0, 12)}`);

      return containerId;
    } catch (error) {
      console.error(`❌ Container indítás hiba:`, error);
      throw error;
    }
  }   ports: template.ports,
      ...customConfig,
    };
    
    return baseConfig;
  }

  /**
   * Docker container indítása
   * @param template - Game template
   * @param serverId - Szerver ID
   * @param configPath - Konfig fájl elérési útvonala
   */
  static async startContainer(
    template: GameTemplate,
    serverId: string,
    configPath: string
  ): Promise<string> {
    // TODO: Docker container start
    // 1. Image pull (ha szükséges)
    // 2. Container létrehozása
    // 3. Volumes mounting
    // 4. Port binding
    // 5. Start
    console.log(`Container indítása: ${template.dockerImage} (szerver: ${serverId})`);
    
    return `container-${serverId}`;
  }

  /**
   * Teljes deployment folyamat
   */
  static async deployTemplate(
    serverId: string,
    templateId: GameTemplateType,
    serverName: string,
    machineInfo: { id: string; ip: string; agentId: string }
  ): Promise<TemplateDeploySession> {
    const session = await this.createDeploySession(serverId, templateId);
    const template = getTemplate(templateId);
    
    try {
      // 1. Letöltés
      session.phase = 'DOWNLOADING';
      session.progress = 10;
      await this.downloadTemplate(template.gdrive, `/tmp/${template.id}`);
      
      session.messages.push({
        timestamp: new Date(),
        message: `Template letöltve: ${template.gdrive.fileName}`,
        level: 'INFO',
      });
      
      // 2. Kibontás
      session.phase = 'EXTRACTING';
      session.progress = 30;
      await this.extractTemplate(
        `/tmp/${template.id}/${template.gdrive.fileName}`,
        `/opt/servers/${serverId}`
      );
      
      session.messages.push({
        timestamp: new Date(),
        message: `Template kibontva: /opt/servers/${serverId}`,
        level: 'INFO',
      });
      
      // 3. Konfigurálás
      session.phase = 'CONFIGURING';
      session.progress = 60;
      const config = this.generateServerConfig(template, serverName);
      
      session.messages.push({
        timestamp: new Date(),
        message: `Konfiguráció létrehozva`,
        level: 'INFO',
      });
      
      // 4. Container indítása
      session.phase = 'STARTING';
      session.progress = 80;
      const containerId = await this.startContainer(
        template,
        serverId,
        `/opt/servers/${serverId}/config.json`
      );
      
      session.messages.push({
        timestamp: new Date(),
        message: `Container elindítva: ${containerId}`,
        level: 'INFO',
      });
      
      // 5. Befejezés
      session.phase = 'COMPLETED';
      session.progress = 100;
      session.completedAt = new Date();
      
      session.messages.push({
        timestamp: new Date(),
        message: `✅ Template deployment sikeresen befejeződött!`,
        level: 'INFO',
      });
      
    } catch (error) {
      session.phase = 'FAILED';
      session.error = error instanceof Error ? error.message : 'Ismeretlen hiba';
      session.messages.push({
        timestamp: new Date(),
        message: `❌ Deployment hiba: ${session.error}`,
        level: 'ERROR',
      });
    }
    
    return session;
  }
}

export default TemplateManager;
