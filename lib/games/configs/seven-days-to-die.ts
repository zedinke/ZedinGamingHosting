/**
 * Seven Days to Die konfiguráció
 */

import { GameServerConfig } from '../types';
import { commands } from '../commands/seven-days-to-die';

export const config: GameServerConfig = {
  steamAppId: 294420, // 7 Days to Die Dedicated Server AppID
  requiresSteamCMD: true,
  installScript: '', // Telepítő script külön fájlban
  configPath: '/opt/servers/{serverId}/serverconfig.xml',
  startCommand: commands.startCommand,
  stopCommand: commands.stopCommand,
  port: 26900,
  queryPort: 26901,
  // Környezeti változók a Unity motor számára
  // Az LD_LIBRARY_PATH biztosítja, hogy a Unity motor megtalálja a szükséges könyvtárakat
  environmentVariables: {
    LD_LIBRARY_PATH: '/opt/servers/{serverId}:${LD_LIBRARY_PATH}',
  },
  defaultSettings: {
    ServerPort: '26900',
    ServerName: 'Seven Days to Die Server',
    ServerPassword: '',
    MaxPlayers: '8',
    GameDifficulty: '2', // 0-4 között
    GameWorld: 'Navezgane', // térképtípus
    WorldSize: 'medium', // térképméret
    ZombiesRun: '0', // 0: lassúak, 1: futnak éjjel, 2: mindig futnak
    LootRespawnDays: '7', // napok között mennyi idő után jelennek meg újra a tárgyak
    EnemyDifficulty: '0', // ellenségek erősségi szintje
    PlayerKillingMode: '0', // játékosok közötti PvP szabályok
  }
};

/**
 * Seven Days to Die konfigurációs fájl generálása
 */
export function generateConfig(config: {
  port: number;
  queryPort: number;
  maxPlayers: number;
  name: string;
  password?: string;
  telnetPort?: number;
  world?: string;
  gameWorld?: string;
  worldSeed?: string;
  seed?: string;
  difficulty?: string;
  gameDifficulty?: string;
  lootRespawnDays?: string;
  [key: string]: any;
}): string {
  const telnetPort = config.telnetPort || config.queryPort + 1;
  const gameWorld = config.world || config.gameWorld || 'Navezgane';
  const worldSeed = config.worldSeed || config.seed || 'asd123';
  const difficulty = config.difficulty || config.gameDifficulty || '2';
  const lootRespawnDays = config.lootRespawnDays || '7';
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<ServerSettings>
    <property name="ServerName" value="${config.name}"/>
    <property name="ServerPort" value="${config.port}"/>
    <property name="ServerMaxPlayerCount" value="${config.maxPlayers}"/>
    <property name="ServerPassword" value="${config.password || ''}"/>
    <property name="ServerVisibility" value="2"/>
    <property name="ServerIsPublic" value="true"/>
    <property name="ServerDescription" value="A 7 Days to Die szerver"/>
    <property name="ServerWebsiteURL" value=""/>
    <property name="GameWorld" value="${gameWorld}"/>
    <property name="WorldGenSeed" value="${worldSeed}"/>
    <property name="WorldGenSize" value="4096"/>
    <property name="GameName" value="My Game"/>
    <property name="GameMode" value="GameModeSurvival"/>
    <property name="Difficulty" value="${difficulty}"/>
    <property name="DayNightLength" value="60"/>
    <property name="DayLightLength" value="18"/>
    <property name="MaxSpawnedZombies" value="60"/>
    <property name="DropOnDeath" value="1"/>
    <property name="DropOnQuit" value="0"/>
    <property name="BedrollDeadZoneSize" value="15"/>
    <property name="BlockDamagePlayer" value="100"/>
    <property name="BlockDamageZombie" value="100"/>
    <property name="XPMultiplier" value="100"/>
    <property name="PlayerSafeZoneLevel" value="5"/>
    <property name="PlayerSafeZoneHours" value="24"/>
    <property name="BuildCreate" value="false"/>
    <property name="AdminFileName" value="serveradmin.xml"/>
    <property name="TelnetEnabled" value="true"/>
    <property name="TelnetPort" value="${telnetPort}"/>
    <property name="TelnetPassword" value=""/>
    <property name="ControlPanelEnabled" value="false"/>
    <property name="ControlPanelPort" value="8080"/>
    <property name="ControlPanelPassword" value=""/>
    <property name="MaxUncoveredMapChunksPerPlayer" value="131072"/>
    <property name="PersistentPlayerProfiles" value="false"/>
    <property name="EACEnabled" value="true"/>
    <property name="HideCommandExecutionLog" value="0"/>
    <property name="AirDropFrequency" value="72"/>
    <property name="AirDropMarker" value="false"/>
    <property name="LootAbundance" value="100"/>
    <property name="LootRespawnDays" value="${lootRespawnDays}"/>
    <property name="MaxSpawnedAnimals" value="50"/>
    <property name="LandClaimCount" value="1"/>
    <property name="LandClaimSize" value="41"/>
    <property name="LandClaimExpiryTime" value="7"/>
    <property name="LandClaimDeadZone" value="30"/>
    <property name="LandClaimOnlineDurabilityModifier" value="4"/>
    <property name="LandClaimOfflineDurabilityModifier" value="4"/>
    <property name="LandClaimOfflineDelay" value="0"/>
    <property name="PartySharedKillRange" value="100"/>
    <property name="EnemySenseMemory" value="45"/>
    <property name="EnemySpawnMode" value="true"/>
    <property name="BloodMoonFrequency" value="7"/>
    <property name="BloodMoonRange" value="0"/>
    <property name="BloodMoonWarning" value="8"/>
    <property name="BloodMoonEnemyCount" value="8"/>
    <property name="BloodMoonEnemyRange" value="0"/>
    <property name="UseAllowedZombieClasses" value="false"/>
    <property name="DisableRadio" value="false"/>
    <property name="DisablePoison" value="false"/>
    <property name="DisableInfection" value="false"/>
    <property name="DisableVault" value="false"/>
    <property name="TraderAreaProtection" value="0"/>
    <property name="TraderServiceAreaProtection" value="1"/>
    <property name="ShowFriendPlayerOnMap" value="true"/>
    <property name="FriendCantDamage" value="true"/>
    <property name="FriendCantLoot" value="false"/>
    <property name="BuildCraftTime" value="false"/>
    <property name="ShowAllPlayersOnMap" value="false"/>
    <property name="ShowSpawnWindow" value="false"/>
    <property name="AutoParty" value="false"/>
</ServerSettings>`;
}