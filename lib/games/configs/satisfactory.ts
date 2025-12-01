/**
 * Satisfactory konfiguráció (Natív Linux szerver)
 * 
 * A Satisfactory-nak van natív Linux szerver verziója, ami FactoryServer.sh scriptet használ.
 * A konfigurációs fájlok a ~/.config/Epic/FactoryGame/Saved/Config/LinuxServer/ mappában vannak.
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/satisfactory';

export const config: GameServerConfig = {
  steamAppId: 1690800,
  requiresSteamCMD: true,
  requiresWine: false, // Natív Linux szerver, Wine nem kell
  installScript: '', // Telepítő script külön fájlban
  configPath: '/home/satis/.config/Epic/FactoryGame/Saved/Config/LinuxServer/GameUserSettings.ini', // Linux szerver
  startCommand: commands.startCommand,
  startCommandWindows: commands.startCommand,
  stopCommand: commands.stopCommand,
  port: 15777,
  queryPort: 7777,
  beaconPort: 15000,
  additionalPorts: [15000, 7777],
  environmentVariables: {},
  defaultSettings: {
    serverName: 'Satisfactory Server',
    maxPlayers: '4',
    serverDescription: 'Satisfactory Dedicated Server',
    autoSave: 'true',
    autoSaveInterval: '300'
  }
};

/**
 * Satisfactory konfigurációs fájl generálása
 */
export function generateConfig(config: {
  port: number;
  queryPort?: number;
  beaconPort?: number;
  gamePort?: number;
  maxPlayers: number;
  name: string;
  password?: string;
  adminPassword?: string;
  autopause?: boolean;
  autoSaveOnDisconnect?: boolean;
  autoSaveInterval?: number;
  networkQuality?: number;
  friendlyFire?: boolean;
  autoArmor?: boolean;
  enableCheats?: boolean;
  gamePhase?: number;
  startingPhase?: number;
  skipTutorial?: boolean;
  [key: string]: any;
}): string {
  // A port paraméter a QueryPort-ot tartalmazza (4 számjegyű port, alapértelmezett 7777)
  const queryPortSatisfactory = config.queryPort || config.port || 7777;
  
  // BeaconPort és GamePort a configuration JSON-ből vagy számítva
  const beaconPort = config.beaconPort || queryPortSatisfactory + 7223; // BeaconPort = QueryPort + 7223 (alapértelmezett 15000 = 7777 + 7223)
  const gamePort = config.gamePort || queryPortSatisfactory + 10000; // GamePort = QueryPort + 10000 (alapértelmezett 17777 = 7777 + 10000)
  
  return `[/Script/Engine.GameSession]
MaxPlayers=${config.maxPlayers}

[/Script/FactoryGame.FGServerSubsystem]
ServerName="${config.name}"
ServerPassword="${config.password || ''}"
AdminPassword="${config.adminPassword || 'changeme123'}"
GamePort=${gamePort}
BeaconPort=${beaconPort}
QueryPort=${queryPortSatisfactory}
Autopause=${config.autopause !== undefined ? config.autopause : false}
AutoSaveOnDisconnect=${config.autoSaveOnDisconnect !== undefined ? config.autoSaveOnDisconnect : true}
AutoSaveInterval=${config.autoSaveInterval || 5}
NetworkQuality=${config.networkQuality || 3}
FriendlyFire=${config.friendlyFire !== undefined ? config.friendlyFire : false}
AutoArmor=${config.autoArmor !== undefined ? config.autoArmor : true}
EnableCheats=${config.enableCheats !== undefined ? config.enableCheats : false}
GamePhase=${config.gamePhase || 1}
StartingPhase=${config.startingPhase || 1}
SkipTutorial=${config.skipTutorial !== undefined ? config.skipTutorial : false}
  `.trim();
}