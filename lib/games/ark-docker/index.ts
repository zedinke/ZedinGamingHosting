/**
 * ARK Docker Module - Main Export
 * Centralized module for all ARK Docker functionality
 */

export { ArkDockerInstaller, type ArkServerConfig, type ServerStatus } from './installer';
export { ArkClusterManager, type ClusterNode, type PlayerCharacter } from './cluster';
export {
  smallPvPServer,
  mediumRpServer,
  largePvPCluster,
  classicEvolvedServer,
  hardcoreSurvival,
  creativeServer,
  arkAscendedMaps,
  arkEvolvedMaps,
  difficultyPresets,
  ramRecommendations,
  PortAllocator,
  ConfigValidator,
} from './config-examples';

/**
 * Quick start helper
 */
export async function createArkServer(
  serverId: string,
  serverName: string,
  gameType: 'ark-ascended' | 'ark-evolved',
  steamApiKey: string,
  adminPassword: string
) {
  const { ArkDockerInstaller } = await import('./installer');

  const installer = new ArkDockerInstaller();
  await installer.initialize();

  const mapName = gameType === 'ark-ascended' ? 'TheIsland_WP' : 'TheIsland_P';

  return installer.install({
    serverId,
    serverName,
    gameType,
    mapName,
    maxPlayers: 70,
    difficulty: 1.0,
    serverPort: 27015,
    queryPort: 27016,
    steamApiKey,
    adminPassword,
  });
}
