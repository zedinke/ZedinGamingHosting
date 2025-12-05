# ARK Docker Implementation - Quick Reference

## File Structure

```
lib/games/ark-docker/
├── docker/
│   ├── ark-ascended/
│   │   ├── Dockerfile              # Windows binary via Wine
│   │   └── start-server.sh         # Server launcher
│   ├── ark-evolved/
│   │   ├── Dockerfile              # Linux native
│   │   └── start-server.sh         # Server launcher
├── installer.ts                     # Main orchestration class
├── cluster.ts                       # Cluster management
├── deployment.ts                    # Deployment automation
├── config-examples.ts               # Configuration templates
├── index.ts                         # Module exports
├── docker-compose.template.yml      # Docker Compose template
├── README.md                        # Full documentation
├── SETUP_GUIDE.md                   # Setup and deployment
└── QUICK_REFERENCE.md              # This file

tests/
└── ark-docker.test.ts              # Test suite
```

## Quick Start

### 1. Initialize

```typescript
import { ArkDockerInstaller } from '@/lib/games/ark-docker';

const installer = new ArkDockerInstaller('/opt/ark-docker');
await installer.initialize(); // Builds Docker images
```

### 2. Create Server

```typescript
import { smallPvPServer } from '@/lib/games/ark-docker/config-examples';

const result = await installer.install(smallPvPServer);
console.log(result.containerId); // Docker container ID
```

### 3. Manage Server

```typescript
// Start/Stop/Restart
await installer.start('small-pvp-001');
await installer.stop('small-pvp-001');
await installer.restart('small-pvp-001');

// Get Status
const status = await installer.getStatus('small-pvp-001');

// View Logs
const logs = await installer.getLogs('small-pvp-001', 100);

// Delete
await installer.delete('small-pvp-001');
```

## Common Tasks

### Create Small Server (10-20 players)

```typescript
const config = {
  serverId: 'my-small-001',
  serverName: 'Small Server',
  gameType: 'ark-ascended',
  mapName: 'TheIsland_WP',
  maxPlayers: 20,
  difficulty: 1.0,
  serverPort: 27015,
  queryPort: 27016,
  steamApiKey: 'your-key',
  adminPassword: 'admin123',
  ramMb: 4096,
};

const result = await installer.install(config);
```

### Create Large Server (70+ players)

```typescript
const config = {
  serverId: 'my-large-001',
  serverName: 'Large Server',
  gameType: 'ark-ascended',
  mapName: 'TheIsland_WP',
  maxPlayers: 70,
  difficulty: 2.0,
  serverPort: 27015,
  queryPort: 27016,
  steamApiKey: 'your-key',
  adminPassword: 'admin123',
  ramMb: 16384, // 16GB
};

const result = await installer.install(config);
```

### Create Cluster (Multi-server)

```typescript
import { ArkClusterManager } from '@/lib/games/ark-docker/cluster';

const clusterManager = new ArkClusterManager('/opt/ark-docker/cluster', 'my-cluster');
await clusterManager.initialize();

// Add servers to cluster
for (const config of clusterConfigs) {
  await installer.install(config);
  await clusterManager.addNode({
    serverId: config.serverId,
    gameType: config.gameType,
    mapName: config.mapName,
    ipAddress: 'localhost',
    port: config.serverPort,
    status: 'online',
  });
}

// Sync cluster data
await clusterManager.syncClusterData();
```

### Migrate Player Character

```typescript
const result = await clusterManager.migrateCharacter(
  'character-id-123',
  'server-1', // From
  'server-2'  // To
);
```

## Configuration Quick Reference

### Required Fields

```typescript
serverId: string;              // Unique ID
serverName: string;            // Display name
gameType: 'ark-ascended' | 'ark-evolved';
mapName: string;               // Map identifier
serverPort: number;            // 1024-65535
queryPort: number;             // 1024-65535, different from serverPort
steamApiKey: string;           // Steam API key
adminPassword: string;         // Admin console password
maxPlayers: number;            // 1-1000
difficulty: number;            // 0.5-4.0
```

### Optional Fields

```typescript
serverPassword?: string;       // Optional server password
ramMb?: number;                // RAM in MB (default 8192)
clusterId?: string;            // For multi-server clusters
clusterMode?: boolean;         // Enable clustering
enablePvp?: boolean;           // PvP enabled (default true)
enableCrosshair?: boolean;     // Crosshair enabled (default true)
customEngineIni?: string;      // Custom Engine.ini
customGameIni?: string;        // Custom Game.ini
```

## Available Maps

### ARK Ascended (ark-ascended)

- TheIsland_WP
- ScorchedEarth_WP
- Extinction_WP
- Genesis_WP
- Genesis2_WP
- Fjordur_WP
- CrystalIsles_WP

### ARK Evolved (ark-evolved)

- TheIsland_P
- ScorchedEarth_P
- Extinction_P
- Genesis_P
- Genesis2_P
- Ragnarok_P
- CrystalIsles_P
- Valguero_P
- LostIsland_P

## Difficulty Presets

```typescript
import { difficultyPresets } from '@/lib/games/ark-docker/config-examples';

difficultyPresets.CASUAL    // 0.5
difficultyPresets.NORMAL    // 1.0
difficultyPresets.HARD      // 2.0
difficultyPresets.EXPERT    // 3.0
difficultyPresets.NIGHTMARE // 4.0
```

## RAM Recommendations

```typescript
import { ramRecommendations } from '@/lib/games/ark-docker/config-examples';

ramRecommendations['1-10']     // 2GB
ramRecommendations['11-30']    // 4GB
ramRecommendations['31-50']    // 8GB
ramRecommendations['51-70']    // 12GB
ramRecommendations['71-100']   // 16GB
ramRecommendations['100+']     // 24GB+
```

## Docker Commands Cheat Sheet

```bash
# List all ARK containers
docker ps --filter "label=zed.game=ark-ascended"

# View server logs
docker logs ark-ascended-my-server-001 -f

# Get container status
docker inspect ark-ascended-my-server-001

# View resource usage
docker stats ark-ascended-my-server-001

# Execute command in container
docker exec ark-ascended-my-server-001 ls -la

# Stop container
docker stop ark-ascended-my-server-001

# Start container
docker start ark-ascended-my-server-001

# Remove container
docker rm ark-ascended-my-server-001

# View volumes
docker volume ls | grep ark

# Backup volume
docker run --rm -v ark-ascended-my-server-001-data:/data \
  -v /backup:/backup alpine tar czf /backup/backup.tar.gz -C /data .
```

## Port Management

Use the `PortAllocator` utility:

```typescript
import { PortAllocator } from '@/lib/games/ark-docker/config-examples';

const allocator = new PortAllocator(27015);

// Allocate pair of ports
const { serverPort, queryPort } = allocator.allocatePorts();
console.log(serverPort, queryPort); // 27015, 27016

// Get allocated ports
const allocated = allocator.getAllocatedPorts();
```

## Configuration Validation

Use the `ConfigValidator` utility:

```typescript
import { ConfigValidator } from '@/lib/games/ark-docker/config-examples';

// Check hardware fit
const hardwareCheck = ConfigValidator.validateHardwareFit(
  [config1, config2, config3],
  65536 // 64GB RAM
);

// Check cluster configuration
const clusterCheck = ConfigValidator.validateClusterConfig([config1, config2]);
```

## Event Handling

```typescript
installer.on('initialized', () => {
  console.log('Docker environment ready');
});

installer.on('server-installed', ({ serverId, containerId }) => {
  console.log(`Server created: ${serverId} (${containerId})`);
});

installer.on('server-started', ({ serverId }) => {
  console.log(`Server started: ${serverId}`);
});

installer.on('server-stopped', ({ serverId }) => {
  console.log(`Server stopped: ${serverId}`);
});

installer.on('server-deleted', ({ serverId }) => {
  console.log(`Server deleted: ${serverId}`);
});
```

## Error Handling

```typescript
try {
  const result = await installer.install(config);
  
  if (!result.success) {
    console.error('Installation failed:', result.error);
  } else {
    console.log('Server created:', result.containerId);
  }
} catch (error) {
  console.error('Critical error:', error);
}
```

## Deployment Functions

```typescript
import {
  deployArkServer,
  deployArkCluster,
  deleteArkServer,
  startArkServer,
  stopArkServer,
  restartArkServer,
  getArkServerStatus,
  syncArkCluster,
  batchDeployArkServers,
  healthCheckArkServers,
} from '@/lib/games/ark-docker/deployment';

// Single server
await deployArkServer('my-server-001', config);

// Cluster
await deployArkCluster('my-cluster', [config1, config2, config3]);

// Batch deployment
const results = await batchDeployArkServers([config1, config2, config3]);

// Health check
const health = await healthCheckArkServers();
```

## Testing

```bash
# Run tests
npm test -- ark-docker.test.ts

# Run with coverage
npm test -- --coverage ark-docker.test.ts

# Run specific test
npm test -- --testNamePattern="Configuration Validation" ark-docker.test.ts
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Docker not found" | Install Docker and Docker Compose |
| "Port already in use" | Use different port numbers |
| "Insufficient disk space" | Free up 150GB+ per server |
| "SteamCMD timeout" | Check internet connection, retry |
| "Container crashes" | Check logs: `docker logs <container>` |
| "Memory errors" | Increase RAM or reduce max players |

## Best Practices

1. **Always validate configuration** before deployment
2. **Use port allocator** to avoid conflicts
3. **Monitor logs** regularly for issues
4. **Backup data** before updates
5. **Test on staging** before production
6. **Use strong passwords** for admin access
7. **Implement health checks** for monitoring
8. **Schedule regular maintenance** windows

## Performance Tips

- Allocate 16GB+ RAM for 70+ player servers
- Use SSD storage for better performance
- Enable PvP only if necessary (higher CPU)
- Monitor container stats regularly
- Update Docker images monthly
- Clean up old volumes regularly

## Support

For issues:
1. Check logs: `docker logs <container>`
2. Review configuration with `ConfigValidator`
3. Consult README.md for detailed documentation
4. Contact support with container ID and logs
