# ARK Docker Server Implementation

Complete, production-ready Docker-based implementation for ARK Survival Ascended and Evolved servers using Docker, Docker Compose, and TypeScript orchestration.

## Overview

This implementation provides:

- **Docker Images**: Separate Dockerfiles for ARK Ascended (Windows via Wine) and ARK Evolved (Linux native)
- **Automated Management**: TypeScript-based installer with full Docker CLI integration
- **Cluster Support**: Multi-server cluster management with player character migration
- **Volume Management**: Persistent data storage across container restarts
- **Health Checks**: Built-in Docker health checks for automatic failure recovery
- **Environment Configuration**: Server config via environment variables (no INI file manipulation)
- **Production Ready**: Full error handling, logging, security validation, and input sanitization

## Architecture

```
lib/games/ark-docker/
├── docker/
│   ├── ark-ascended/
│   │   ├── Dockerfile          # Windows binary via Wine
│   │   └── start-server.sh     # Server launcher script
│   ├── ark-evolved/
│   │   ├── Dockerfile          # Linux native binary
│   │   └── start-server.sh     # Server launcher script
├── installer.ts                 # Main Docker orchestration
├── cluster.ts                    # Cluster management
└── docker-compose.template.yml  # Compose template
```

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Node.js 16+ with TypeScript
- 100GB+ disk space per ARK Ascended server
- 50GB+ disk space per ARK Evolved server

### Basic Server Creation

```typescript
import { ArkDockerInstaller } from '@/lib/games/ark-docker/installer';

const installer = new ArkDockerInstaller('/opt/ark-docker');

// Initialize Docker environment
await installer.initialize();

// Create server
const result = await installer.install({
  serverId: 'my-ark-server-001',
  serverName: 'My ARK Server',
  gameType: 'ark-ascended', // or 'ark-evolved'
  mapName: 'TheIsland_WP',
  maxPlayers: 70,
  difficulty: 1.0,
  serverPort: 27015,
  queryPort: 27016,
  steamApiKey: 'your-steam-api-key',
  adminPassword: 'secure-admin-password',
  ramMb: 8192, // 8GB RAM
});

if (result.success) {
  console.log(`Server created: ${result.containerId}`);
}
```

### Supported Maps

**ARK Ascended (ark-ascended)**:
- TheIsland_WP
- ScorchedEarth_WP
- Extinction_WP
- Genesis_WP
- Genesis2_WP
- Fjordur_WP
- CrystalIsles_WP

**ARK Evolved (ark-evolved)**:
- TheIsland_P
- ScorchedEarth_P
- Extinction_P
- Genesis_P
- Genesis2_P
- Ragnarok_P
- CrystalIsles_P
- Valguero_P
- LostIsland_P

## API Reference

### ArkDockerInstaller

#### Configuration Interface

```typescript
interface ArkServerConfig {
  serverId: string;              // Unique server identifier
  serverName: string;            // Display name
  gameType: 'ark-ascended' | 'ark-evolved';
  mapName: string;               // Map identifier
  maxPlayers: number;            // 1-1000
  difficulty: number;            // 0.5-4.0
  serverPort: number;            // 1024-65535
  queryPort: number;             // 1024-65535 (must differ from serverPort)
  steamApiKey: string;           // Steam API key for updates
  serverPassword?: string;       // Optional password for joining
  adminPassword: string;         // Admin console password
  ramMb?: number;                // RAM in MB (default 8192)
  clusterId?: string;            // For multi-server clusters
  clusterMode?: boolean;         // Enable clustering
  enablePvp?: boolean;           // PvP enabled (default true)
  enableCrosshair?: boolean;     // Crosshair enabled (default true)
  customEngineIni?: string;      // Custom Engine.ini settings
  customGameIni?: string;        // Custom Game.ini settings
}
```

#### Methods

**install(config: ArkServerConfig)**
```typescript
const result = await installer.install(config);
// Returns: { success: boolean; error?: string; containerId?: string }
```

**start(serverId: string)**
```typescript
const result = await installer.start('my-server-001');
// Returns: { success: boolean; error?: string }
```

**stop(serverId: string)**
```typescript
const result = await installer.stop('my-server-001');
// Returns: { success: boolean; error?: string }
```

**restart(serverId: string)**
```typescript
const result = await installer.restart('my-server-001');
// Returns: { success: boolean; error?: string }
```

**delete(serverId: string)**
```typescript
const result = await installer.delete('my-server-001');
// Removes server and cleans up all Docker resources
// Returns: { success: boolean; error?: string }
```

**getLogs(serverId: string, lines?: number)**
```typescript
const result = await installer.getLogs('my-server-001', 100);
// Returns: { success: boolean; logs?: string; error?: string }
```

**getStatus(serverId: string)**
```typescript
interface ServerStatus {
  status: 'running' | 'stopped' | 'error';
  containerId?: string;
  memory?: number;    // MB
  cpu?: number;       // Percentage
  players?: number;
  uptime?: number;    // Seconds
  lastUpdate?: Date;
}

const status = await installer.getStatus('my-server-001');
```

**executeInContainer(serverId: string, command: string[])**
```typescript
const result = await installer.executeInContainer('my-server-001', ['ls', '-la']);
// Execute arbitrary commands inside container
// Returns: { success: boolean; output?: string; error?: string }
```

### Events

The installer extends EventEmitter and emits:

```typescript
installer.on('initialized', () => {
  console.log('ARK Docker environment ready');
});

installer.on('server-installed', ({ serverId, containerId }) => {
  console.log(`Server created: ${serverId}`);
});

installer.on('server-started', ({ serverId }) => {
  console.log(`Server started: ${serverId}`);
});

installer.on('server-stopped', ({ serverId }) => {
  console.log(`Server stopped: ${serverId}`);
});

installer.on('server-restarted', ({ serverId }) => {
  console.log(`Server restarted: ${serverId}`);
});

installer.on('server-deleted', ({ serverId }) => {
  console.log(`Server deleted: ${serverId}`);
});
```

## Cluster Management

### Basic Cluster Setup

```typescript
import { ArkClusterManager } from '@/lib/games/ark-docker/cluster';

const clusterManager = new ArkClusterManager('/opt/ark-docker/cluster', 'my-cluster');
await clusterManager.initialize();

// Add servers to cluster
await clusterManager.addNode({
  serverId: 'server-1',
  gameType: 'ark-ascended',
  mapName: 'TheIsland_WP',
  ipAddress: 'localhost',
  port: 27015,
  status: 'online',
});

await clusterManager.addNode({
  serverId: 'server-2',
  gameType: 'ark-evolved',
  mapName: 'ScorchedEarth_P',
  ipAddress: 'localhost',
  port: 27016,
  status: 'online',
});

// Sync cluster data
const syncResult = await clusterManager.syncClusterData();

// Migrate character between servers
const migrateResult = await clusterManager.migrateCharacter(
  'character-123',
  'server-1',
  'server-2'
);

// Get cluster status
const status = await clusterManager.getStatus();
console.log(`Cluster: ${status.clusterId}, Nodes: ${status.nodeCount}`);
```

## Environment Variables

Server configuration is managed via environment variables. These are automatically set in `.env` files within each server's Docker Compose directory.

### Server Settings

```bash
# Core Configuration
SERVER_NAME=MyARKServer
SERVER_PORT=27015
QUERY_PORT=27016
STEAM_API_KEY=your-api-key

# Game Settings
MAP_NAME=TheIsland_WP
MAX_PLAYERS=70
DIFFICULTY=1.0
SERVER_PASSWORD=optional-password
ADMIN_PASSWORD=admin-password

# Clustering
CLUSTER_ID=my-cluster
CLUSTER_MODE=true

# Server Options
ENABLE_PVP=true
ENABLE_CROSSHAIR=true
DISABLE_STRUCTURE_PLACEMENT_COLLISION=false
OVERRIDE_DIFFICULTY_OFFSET=1.0

# Resource Limits
RAM_MB=8192

# Advanced Configuration
CUSTOM_ENGINE_INI=custom-settings
CUSTOM_GAME_INI=custom-game-settings
```

## Docker Volume Management

Each server has dedicated volumes:

```yaml
volumes:
  ark-ascended-server-001-data:    # Server game files and saves
    driver: local
  ark-cluster:                      # Shared cluster data
    driver: local
```

### Backup and Restore

```bash
# Backup server data
docker run --rm -v ark-ascended-server-001-data:/data -v /backup/path:/backup \
  alpine tar czf /backup/server-backup.tar.gz -C /data .

# Restore from backup
docker run --rm -v ark-ascended-server-001-data:/data -v /backup/path:/backup \
  alpine tar xzf /backup/server-backup.tar.gz -C /data
```

## Error Handling

The installer includes comprehensive error handling:

```typescript
try {
  const result = await installer.install(config);
  
  if (!result.success) {
    console.error('Installation failed:', result.error);
    // Handle error appropriately
  }
} catch (error) {
  console.error('Critical error:', error);
  // Handle critical failures
}
```

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| Invalid server port range | Port < 1024 or > 65535 | Use valid port range |
| Port already in use | Another service using port | Change port or stop conflicting service |
| Insufficient disk space | Not enough space for game files | Free up disk space |
| Docker not running | Docker daemon not started | Start Docker: `docker start` |
| SteamCMD download failure | Network connectivity issue | Check internet connection, retry |

## Logging

Comprehensive logging is provided:

```typescript
// Access logs directly
const result = await installer.getLogs('my-server-001', 500);
if (result.success) {
  console.log(result.logs);
}

// Or view in real-time
docker logs -f ark-ascended-my-server-001
```

## Performance Optimization

### Memory Configuration

```typescript
const config: ArkServerConfig = {
  // ...
  ramMb: 8192,  // 8GB - recommended minimum
  // For larger servers (70+ players) use 16GB+
};
```

### CPU Allocation

Docker Compose sets `cpu_shares: 1024` for optimal performance. Adjust if needed:

```yaml
services:
  ark-ascended-server-001:
    cpu_shares: 2048  # Higher = more CPU priority
```

## Security Considerations

1. **Input Validation**: All configuration is validated before use
2. **Admin Password**: Must be provided and is never logged
3. **Server Password**: Optional, transmitted securely
4. **Docker Network Isolation**: Servers run on isolated Docker networks
5. **Volume Permissions**: Proper file permissions enforced on volumes
6. **No Shell Access**: Server scripts use restricted entrypoints

## Testing

Run the test suite:

```bash
npm test -- ark-docker.test.ts
```

Tests cover:
- Configuration validation
- Port conflict detection
- Difficulty and player count ranges
- Environment file generation
- Docker Compose file generation
- Cluster operations

## Troubleshooting

### Server Won't Start

```bash
# Check container logs
docker logs ark-ascended-server-001

# Verify container is created
docker ps -a | grep ark-ascended

# Check resource availability
docker stats
```

### Port Conflicts

```bash
# Find what's using a port
netstat -tulpn | grep 27015

# List all ARK containers and their ports
docker ps --filter label=zed.game=ark-ascended --format "{{.Names}}\t{{.Ports}}"
```

### Cluster Sync Issues

```bash
# Check cluster directory
ls -la /opt/ark-docker/cluster/my-cluster/

# Verify volume access
docker volume inspect ark-cluster
```

### Out of Memory

```bash
# Increase RAM allocation in config
ramMb: 16384  // 16GB

# Or restart container with more memory
docker update --memory=16g ark-ascended-server-001
```

## Building Docker Images

To build the Docker images locally:

```bash
# Build ARK Ascended image
docker build -t zedin-gaming/ark-ascended:latest \
  ./lib/games/ark-docker/docker/ark-ascended/

# Build ARK Evolved image
docker build -t zedin-gaming/ark-evolved:latest \
  ./lib/games/ark-docker/docker/ark-evolved/

# Verify images built
docker images | grep zedin-gaming
```

## Integration with Existing System

The ARK Docker installer integrates with the existing ZedinGaming server infrastructure:

1. **Database**: Server records stored in Prisma
2. **Billing**: Linked to subscription/payment system
3. **Monitoring**: Real-time status in admin dashboard
4. **Backups**: Automated backup scheduling
5. **Scaling**: Dynamic port allocation and multi-machine support

### Usage in Game Server Manager

```typescript
// In lib/game-server-installer.ts or similar

import { ArkDockerInstaller, ArkServerConfig } from '@/lib/games/ark-docker/installer';

export async function installArkServer(serverId: string, config: ArkServerConfig) {
  const installer = new ArkDockerInstaller('/opt/ark-docker');
  await installer.initialize();
  
  const result = await installer.install(config);
  
  if (result.success) {
    // Update database with container ID
    await prisma.gameServer.update({
      where: { id: serverId },
      data: {
        containerId: result.containerId,
        status: 'running',
      },
    });
  }
  
  return result;
}
```

## FAQ

**Q: How much disk space do I need?**
A: ARK Ascended ~100GB, ARK Evolved ~50GB, plus OS and Docker overhead. Allocate 150GB+ per server.

**Q: Can I run multiple servers on one machine?**
A: Yes, use different ports for each server. Ensure adequate RAM and CPU.

**Q: How do I update the server?**
A: Containers automatically update on restart via SteamCMD.

**Q: Can I migrate saves between servers?**
A: Yes, use the cluster manager's `migrateCharacter()` method.

**Q: Is Windows support available?**
A: ARK Ascended runs via Wine. Performance may vary. Linux (ARK Evolved) is recommended for production.

**Q: How do I back up server data?**
A: Use Docker volume backup commands or implement scheduled snapshots.

## Production Deployment Checklist

- [ ] Docker and Docker Compose installed
- [ ] Disk space verified (150GB+ per server)
- [ ] RAM requirements met (16GB minimum recommended)
- [ ] Firewall rules allow server ports
- [ ] Steam API key obtained
- [ ] Admin passwords set and securely stored
- [ ] Backup strategy implemented
- [ ] Monitoring configured
- [ ] Load testing completed
- [ ] Disaster recovery plan documented

## Support and Maintenance

- Monitor container health: `docker ps --filter label=zed.game=ark-ascended`
- Check logs regularly: `docker logs <container-id>`
- Perform regular backups before updates
- Test updates on staging environment first
- Keep Docker images updated: `docker pull zedin-gaming/ark-ascended:latest`

## License

Part of ZedinGaming hosting platform. All rights reserved.
