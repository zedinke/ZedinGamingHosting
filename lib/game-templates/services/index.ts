/**
 * Game Templates Services - Central Export Point
 */

export { GoogleDriveService, getGoogleDriveService } from './google-drive';
export type { GDriveFile } from './google-drive';

export { ContainerManager } from './container-manager';
export type { ContainerInfo } from './container-manager';

export { TemplateManager } from './template-manager';

export { GameAgentService, getGameAgentService } from './game-agent';
export type { AgentStatus, ServerUpdateInfo } from './game-agent';

export { ServerUpdateManager, getServerUpdateManager } from './server-update-manager';
export type { UpdateScheduleConfig, UpdateJob } from './server-update-manager';

export { ServerStatusMonitor, getServerStatusMonitor } from './server-status-monitor';
export type { ServerHealthStatus, ServerAlert, MonitorConfig } from './server-status-monitor';

export { GameServerLifecycleManager, getGameServerLifecycleManager } from './game-server-lifecycle';
export type { GameServerConfig, ServerLifecycleState } from './game-server-lifecycle';
