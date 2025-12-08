/**
 * 7 Days to Die Configuration Generator
 * Generálja a serverconfig.xml és admin.xml fájlokat
 */

import { PortAllocationResult } from '@/lib/port-manager';

export interface SevenDaysToDieConfig {
  serverName: string;
  serverDescription?: string;
  maxPlayers: number;
  port: number;
  telnetPort: number;
  webMapPort: number;
  worldGeneration?: 'RandomGen' | 'Navezgane' | 'Pregen';
  worldName?: string;
  difficulty?: 'Easy' | 'Normal' | 'Hard' | 'Insane' | 'Nightmare';
  zombieSettings?: {
    zombieMove?: 'Walk' | 'Run' | 'Sprint';
    zombieFeral?: boolean;
    zombieBloodMoon?: boolean;
  };
  gameMode?: 'Survival' | 'Creative';
  eacEnabled?: boolean;
  adminUsers?: string[];
  serverPassword?: string;
}

/**
 * 7 Days to Die Config Generator
 */
export class SevenDaysToDieConfigGenerator {
  /**
   * serverconfig.xml generálása
   */
  static generateServerConfig(
    config: SevenDaysToDieConfig,
    ports: PortAllocationResult
  ): string {
    const {
      serverName,
      serverDescription = '',
      maxPlayers,
      worldGeneration = 'RandomGen',
      worldName = 'Navezgane',
      difficulty = 'Normal',
      zombieSettings = {},
      gameMode = 'Survival',
      eacEnabled = true,
      serverPassword = '',
    } = config;

    const {
      zombieMove = 'Run',
      zombieFeral = false,
      zombieBloodMoon = true,
    } = zombieSettings;

    return `<?xml version="1.0" encoding="UTF-8"?>
<serverconfig>
    <property name="ServerName" value="${this.escapeXml(serverName)}"/>
    <property name="ServerDescription" value="${this.escapeXml(serverDescription)}"/>
    <property name="ServerPort" value="${ports.port}"/>
    <property name="ServerVisibility" value="2"/>
    <property name="ServerMaxPlayerCount" value="${maxPlayers}"/>
    <property name="ServerMaxWorldTransferSpeed" value="500000"/>
    <property name="ServerLoginConfirmationText" value=""/>
    <property name="ServerPassword" value="${serverPassword}"/>
    <property name="ServerIsPublic" value="true"/>
    <property name="ServerDisabledNetworkProtocols" value=""/>
    <property name="GameWorld" value="${worldName}"/>
    <property name="WorldGenSeed" value=""/>
    <property name="WorldGenSize" value="8192"/>
    <property name="GameName" value="${worldName}"/>
    <property name="GameMode" value="${gameMode}"/>
    <property name="GameDifficulty" value="${this.getDifficultyValue(difficulty)}"/>
    <property name="DropOnDeath" value="0"/>
    <property name="DropOnQuit" value="0"/>
    <property name="ServerMaxAllowedViewDistance" value="12"/>
    <property name="ServerMaxAllowedVehicles" value="50"/>
    <property name="ServerMaxAllowedAircraft" value="50"/>
    <property name="ServerMaxAllowedBicycles" value="50"/>
    <property name="ServerMaxAllowedGyrocopters" value="50"/>
    <property name="ServerMaxAllowedBoats" value="50"/>
    <property name="ServerMaxAllowedPackMules" value="50"/>
    <property name="ServerMaxAllowedJunkSleds" value="50"/>
    <property name="ServerMaxAllowedMinibikes" value="50"/>
    <property name="ServerMaxAllowedMotorcycles" value="50"/>
    <property name="ServerMaxAllowed4x4Trucks" value="50"/>
    <property name="ServerMaxAllowedCars" value="50"/>
    <property name="ServerMaxAllowedBuses" value="50"/>
    <property name="ServerMaxAllowedTrucks" value="50"/>
    <property name="ServerMaxAllowedBoats" value="50"/>
    <property name="ZombiesRun" value="${zombieMove === 'Run' || zombieMove === 'Sprint' ? 'true' : 'false'}"/>
    <property name="ZombiesFeral" value="${zombieFeral ? 'true' : 'false'}"/>
    <property name="BloodMoonEnemyCount" value="${zombieBloodMoon ? '8' : '0'}"/>
    <property name="BloodMoonFrequency" value="7"/>
    <property name="BloodMoonRange" value="0"/>
    <property name="BloodMoonWarning" value="8"/>
    <property name="BloodMoonEnemyRange" value="50"/>
    <property name="EACEnabled" value="${eacEnabled ? 'true' : 'false'}"/>
    <property name="TelnetEnabled" value="true"/>
    <property name="TelnetPort" value="${ports.telnetPort || 8081}"/>
    <property name="TelnetPassword" value=""/>
    <property name="ControlPanelEnabled" value="true"/>
    <property name="ControlPanelPort" value="${ports.webMapPort || 8080}"/>
    <property name="ControlPanelPassword" value=""/>
    <property name="AdminFileName" value="admin.xml"/>
    <property name="LogLevel" value="1"/>
    <property name="ServerAdminSlots" value="0"/>
    <property name="ServerAdminSlotsPermission" value="0"/>
    <property name="ServerReservedSlots" value="0"/>
    <property name="ServerReservedSlotsPermission" value="100"/>
    <property name="ServerReservedSlotsPermissionKick" value="false"/>
    <property name="ServerReservedSlotsPermissionKickDelay" value="5"/>
    <property name="ServerReservedSlotsPermissionKickBanTime" value="60"/>
    <property name="ServerReservedSlotsPermissionKickBanReason" value="Reserved slot"/>
    <property name="ServerReservedSlotsPermissionKickBanMessage" value="You have been kicked from the server"/>
    <property name="ServerReservedSlotsPermissionKickBanMessageToAdmins" value="Player kicked from reserved slot"/>
</serverconfig>`;
  }

  /**
   * admin.xml generálása
   */
  static generateAdminConfig(adminUsers: string[] = []): string {
    if (adminUsers.length === 0) {
      return `<?xml version="1.0" encoding="UTF-8"?>
<admins>
</admins>`;
    }

    const adminEntries = adminUsers
      .map((user) => `    <user name="${this.escapeXml(user)}" permission_level="0" />`)
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<admins>
${adminEntries}
</admins>`;
  }

  /**
   * XML escape
   */
  private static escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Difficulty érték konverzió
   */
  private static getDifficultyValue(difficulty: string): string {
    const difficultyMap: Record<string, string> = {
      Easy: '0',
      Normal: '1',
      Hard: '2',
      Insane: '3',
      Nightmare: '4',
    };
    return difficultyMap[difficulty] || '1';
  }
}

export default SevenDaysToDieConfigGenerator;

