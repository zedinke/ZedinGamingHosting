/**
 * Game Template System - Type Definitions
 * Új játékTemplate mechanika típusai
 * 
 * Template-s megoldás:
 * 1. Előre kész Docker containerek (lokálisan tesztelt)
 * 2. Tömörítés (TAR.GZ)
 * 3. Google Drive tárolás
 * 4. Rendeléskor: letöltés → kibontás → konfigurálás → indítás
 */

/**
 * Támogatott játékok a template rendszerhez
 */
export enum GameTemplateType {
  ARK_ASCENDED = 'ARK_ASCENDED',
  ARK_EVOLVED = 'ARK_EVOLVED',
  RUST = 'RUST',
}

/**
 * Game Template metaadatok
 */
export interface GameTemplate {
  /** Játék azonosítása */
  id: GameTemplateType;
  
  /** Emberi olvasható név */
  name: string;
  
  /** Template verzió (pl: 1.0, 2.1) */
  version: string;
  
  /** Template leírás */
  description: string;
  
  /** Docker image név */
  dockerImage: string;
  
  /** Szükséges portok */
  ports: {
    game: number;
    query?: number;
    rcon?: number;
    [key: string]: number | undefined;
  };
  
  /** Minimális szerver követelmények */
  requirements: {
    cpuCores: number;
    ramGb: number;
    diskGb: number;
  };
  
  /** Google Drive template fájl információ */
  gdrive: {
    fileId: string;
    fileName: string;
    sizeGb: number;
    checksum?: string; // SHA256 checksum validáláshoz
  };
  
  /** Template utolsó frissítésének dátuma */
  updatedAt: Date;
  
  /** Egyéb metaadat */
  metadata: {
    steamAppId?: number;
    maxPlayers?: number;
    [key: string]: any;
  };
}

/**
 * Game Server Instance (rendelésből létrehozott)
 */
export interface GameServerInstance {
  /** Server ID a rendszerben */
  id: string;
  
  /** Melyik template-ből lett létrehozva */
  templateId: GameTemplateType;
  
  /** Template verzió amit használ */
  templateVersion: string;
  
  /** Server státusza */
  status: 'PREPARING' | 'READY' | 'RUNNING' | 'STOPPED' | 'ERROR';
  
  /** Konfigurációs adatok */
  config: {
    serverName: string;
    adminPassword?: string;
    customPorts?: Partial<GameTemplate['ports']>;
    [key: string]: any;
  };
  
  /** Szerver gép információ */
  machine: {
    id: string;
    ip: string;
    agentId: string;
  };
  
  /** Konténer információ */
  container?: {
    id: string;
    name: string;
    status: string;
  };
  
  /** Létrehozás dátuma */
  createdAt: Date;
  
  /** Utolsó módosítás */
  updatedAt: Date;
}

/**
 * Template Download/Deploy Session
 */
export interface TemplateDeploySession {
  /** Session ID */
  id: string;
  
  /** Melyik szerver számára */
  serverId: string;
  
  /** Melyik template-et telepítjük */
  templateId: GameTemplateType;
  
  /** Deploy fázis */
  phase: 'DOWNLOADING' | 'EXTRACTING' | 'CONFIGURING' | 'STARTING' | 'COMPLETED' | 'FAILED';
  
  /** Progress %*/
  progress: number;
  
  /** Üzenetek */
  messages: Array<{
    timestamp: Date;
    message: string;
    level: 'INFO' | 'WARNING' | 'ERROR';
  }>;
  
  /** Hiba részletek */
  error?: string;
  
  /** Kezdés */
  startedAt: Date;
  
  /** Befejezés */
  completedAt?: Date;
}

/**
 * Template Storage információ (Google Drive)
 */
export interface TemplateStorage {
  /** Storage provider (gdrive, azure, s3, stb) */
  provider: 'gdrive' | 'azure' | 's3';
  
  /** Fájl ID */
  fileId: string;
  
  /** Fájl név */
  fileName: string;
  
  /** Fájl mérete GB-ban */
  sizeGb: number;
  
  /** SHA256 checksum */
  checksum: string;
  
  /** Letöltési URL (ha publikus) */
  downloadUrl?: string;
  
  /** Feltöltés dátuma */
  uploadedAt: Date;
}

/**
 * Game Update Info (SteamCMD alapú frissítésekhez)
 */
export interface GameUpdateInfo {
  /** Játék azonosítása */
  gameId: GameTemplateType;
  
  /** Steam AppID (frissítésekhez) */
  steamAppId: number;
  
  /** Telepítési könyvtár a containerben */
  installDir: string;
  
  /** Frissítéshez szükséges parancs */
  updateCommand: string;
  
  /** Utolsó ismert verzió */
  lastKnownVersion?: string;
  
  /** Utolsó update ideje */
  lastUpdatedAt?: Date;
}
