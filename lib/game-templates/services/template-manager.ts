/**
 * Template Manager Service
 * Kezeli a template letöltést, kibontást, konfigurálást
 */

import { GameTemplateType, GameTemplate, TemplateDeploySession } from '../types';
import { getTemplate } from '../models/templates';

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
    // TODO: Google Drive API implementáció
    // 1. Autentikáció
    // 2. File letöltés
    // 3. Checksum validáció
    console.log(`Template letöltése: ${gdrive.fileName} → ${destinationPath}`);
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
    // 1. Fájl típus felismerés (.tar.gz, .zip)
    // 2. Kibontás
    // 3. Permissions beállítás
    console.log(`Template kibontása: ${archivePath} → ${extractPath}`);
  }

  /**
   * Server konfiguráció generálása
   * @param template - Game template
   * @param serverName - Szerver neve
   * @param customConfig - Custom konfigurációs opciók
   */
  static generateServerConfig(
    template: GameTemplate,
    serverName: string,
    customConfig?: Record<string, any>
  ): Record<string, any> {
    const baseConfig = {
      serverName,
      maxPlayers: template.metadata.maxPlayers || 10,
      ports: template.ports,
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
