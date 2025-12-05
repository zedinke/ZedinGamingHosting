/**
 * ARK Docker System - Module Exports
 * Central export point for all public APIs
 */

// Installer exports
export {
  ArkDockerInstaller,
  type DockerConfig,
  type InstallationProgress,
  type DockerImage,
  type ContainerStatus
} from './installer';

// Cluster exports
export {
  ArkClusterManager,
  type ClusterNode,
  type CharacterData,
  type MigrationRequest,
  type ClusterConfig
} from './cluster';

// Deployment exports
export {
  type DeploymentConfig,
  type DeploymentServer,
  type DeploymentStatus,
  type DeploymentError,
  type RollbackConfig,
  type HealthCheckConfig,
  deployServers,
  deployServer,
  buildDockerImage,
  pushDockerImage,
  performHealthCheck,
  rollbackDeployment,
  scaleDeployment,
  updateDeploymentConfig,
  backupDeploymentState,
  restoreDeploymentState,
  getDeploymentMetrics,
  migrateDeployment,
  cleanupDeploymentResources,
  deployWithCanary
} from './deployment';

// Configuration exports
export {
  ARK_ASCENDED_MAPS,
  ARK_EVOLVED_MAPS,
  createSmallAscendedConfig,
  createMediumAscendedConfig,
  createLargeAscendedClusterConfig,
  createSmallEvolvedConfig,
  createMediumEvolvedConfig,
  createLargeEvolvedClusterConfig,
  PortAllocator,
  ConfigValidator
} from './config-examples';
