# ARK Docker System - PROJECT_OVERVIEW.md

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    ARK Docker System                              │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Docker Host (Linux/Windows)                  │   │
│  │                                                             │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │          Docker Network (Bridge)                    │ │   │
│  │  │                                                       │ │   │
│  │  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐│ │   │
│  │  │  │ ARK Ascended │  │ ARK Ascended │  │ARK Evolved ││ │   │
│  │  │  │   Primary    │  │  Secondary   │  │  Primary   ││ │   │
│  │  │  │  (Genesis1)  │  │(Extinction)  │  │(TheIsland) ││ │   │
│  │  │  └──────────────┘  └──────────────┘  └────────────┘│ │   │
│  │  │                                                       │ │   │
│  │  │  ┌──────────────┐  ┌──────────────┐                 │ │   │
│  │  │  │ ARK Evolved  │  │  Cluster     │                 │ │   │
│  │  │  │  Secondary   │  │  Manager     │                 │ │   │
│  │  │  │(LostIsland)  │  │   (Sync)     │                 │ │   │
│  │  │  └──────────────┘  └──────────────┘                 │ │   │
│  │  │                                                       │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  │                                                             │   │
│  │  Volumes: 16 persistent volumes for data/backups/logs    │   │
│  │                                                             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                    │
│  External Access:                                                 │
│  • Game ports (UDP): 7777, 7779, 7781, 7783                     │
│  • Query ports (UDP): 7778, 7780, 7782, 7784                    │
│  • RCON ports (TCP): 27015, 27016, 27017, 27018                 │
│                                                                    │
└─────────────────────────────────────────────────────────────────┘
```

## Component Relationships

```
TypeScript Application Layer
├── ArkDockerInstaller
│   ├── Creates Dockerfiles
│   ├── Generates start scripts
│   ├── Creates docker-compose configs
│   └── Validates configurations
│
├── ArkClusterManager
│   ├── Manages cluster nodes
│   ├── Health checking
│   ├── Character migration
│   └── Data synchronization
│
└── Deployment Functions
    ├── Image building
    ├── Container orchestration
    ├── Scaling operations
    └── Backup/restore
        │
        ├─ Event Emitters
        │   ├── progress events
        │   ├── status events
        │   ├── error events
        │   └── completion events
        │
        └─ Docker Integration
            ├── Docker Engine
            ├── Docker Compose
            ├── Container Registry
            └── Volume Management
```

## Data Flow Diagram

```
Startup Flow:
┌────────────────────┐
│  Configuration     │
│  (Environment Vars)│
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ ArkDockerInstaller │
│ - Validate config  │
│ - Generate files   │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│  Docker Engine     │
│ - Build images     │
│ - Create volumes   │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ Docker Containers  │
│ - Initialize       │
│ - Download files   │
│ - Start servers    │
└─────────┬──────────┘
          │
          ▼
┌────────────────────┐
│ ARK Game Servers   │
│ - Ready for play   │
│ - Listening        │
└────────────────────┘

Character Migration Flow:
┌──────────────────────────────────────┐
│ ArkClusterManager.migrateCharacter() │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ Validate source & target nodes       │
│ - Check both online                  │
│ - Verify character exists            │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ Get character data from source       │
│ - Export inventory                   │
│ - Save position                      │
│ - Backup character file              │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ Transfer to target node              │
│ - Upload character                   │
│ - Restore data                       │
│ - Update cluster state               │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ Character available on new server    │
│ - Update cluster metadata            │
│ - Emit completion event              │
└──────────────────────────────────────┘
```

## Technology Stack

### Core Technologies
- **Language**: TypeScript (1950+ lines)
- **Runtime**: Node.js 16+
- **Containerization**: Docker 20.10+
- **Orchestration**: Docker Compose 2.0+
- **Testing**: Jest
- **Shell Scripting**: Bash

### Game Servers
- **ARK Ascended**: Windows via Wine (Windows Server Core base)
- **ARK Evolved**: Linux native (Ubuntu 22.04 base)

### Key Libraries/Tools
- **Wine**: For ARK Ascended Windows server on Linux
- **SteamCMD**: For ARK Evolved server installation
- **DXVK**: Direct3D acceleration for Wine
- **Chocolatey**: Windows package manager
- **APT**: Linux package manager

## System Communication

### Inter-Container Communication
```
Container Network (172.25.0.0/16):
- ark-ascended-primary (172.25.0.2)
- ark-ascended-secondary (172.25.0.3)
- ark-evolved-primary (172.25.0.4)
- ark-evolved-secondary (172.25.0.5)

All containers can communicate on the bridge network
Health checks validate inter-container connectivity
Cluster manager uses DNS discovery (container names)
```

### External Communication
```
Host Machine Network:
- UDP 7777/7778 → Ascended Primary game/query
- UDP 7779/7780 → Ascended Secondary game/query
- UDP 7781/7782 → Evolved Primary game/query
- UDP 7783/7784 → Evolved Secondary game/query
- TCP 27015 → Ascended Primary RCON
- TCP 27016 → Ascended Secondary RCON
- TCP 27017 → Evolved Primary RCON
- TCP 27018 → Evolved Secondary RCON
```

## State Management

### Persistent Data (Volumes)
```
16 Docker Volumes:
├── Server Data (2 per server = 8 volumes)
│   ├── Server executable files
│   └── Game installation
│
├── Game Data (2 per server = 8 volumes)
│   ├── Save files
│   ├── Character data
│   └── Dino data
│
└── Operations (varies)
    ├── Backups (4 volumes)
    ├── Logs (4 volumes)
    └── Cluster data

All volumes use local storage driver with persistence
```

### In-Memory State (TypeScript)
```
ArkClusterManager maintains:
- Node status (online/offline/error)
- Player counts per node
- Migration requests in-flight
- Character backup mappings
- Health check history (last 30 checks)
- Cluster statistics cache
```

## Event System

### Event Types Emitted
```
ArkDockerInstaller events:
- 'validated' - Configuration accepted
- 'progress' - Installation step completed
- 'installed' - Installation finished
- 'error' - Installation failed

ArkClusterManager events:
- 'config-validated' - Cluster config valid
- 'start' - Cluster manager started
- 'stop' - Cluster manager stopped
- 'node-recovered' - Node came back online
- 'node-down' - Node went offline
- 'node-error' - Node error detected
- 'health-check-complete' - Health check finished
- 'sync-complete' - Synchronization finished
- 'migration-initiated' - Migration started
- 'migration-started' - Migration in progress
- 'migration-completed' - Migration finished
- 'migration-failed' - Migration failed
- 'character-saved' - Character persisted
- 'backup-created' - Backup completed
- 'character-restored' - Character restored

Deployment function events (via callbacks):
- Progress tracking
- Status updates
- Error reporting
```

## Configuration Hierarchy

```
1. Default Values
   ├── Container defaults (DockerConfig)
   ├── Cluster defaults (ClusterConfig)
   └── Deployment defaults (DeploymentConfig)
        │
        ▼
2. Template Configurations
   ├── Small (10 players)
   ├── Medium (35-40 players)
   └── Large (70 players)
        │
        ▼
3. Environment Variables
   ├── SERVER_NAME
   ├── ADMIN_PASSWORD
   ├── MAX_PLAYERS
   ├── MAP
   └── ... (20+ more)
        │
        ▼
4. docker-compose.yml Overrides
   ├── Service-specific settings
   ├── Port mappings
   ├── Volume configurations
   └── Resource limits
        │
        ▼
5. Runtime Modifications
   ├── Dynamic scaling
   ├── Config updates
   └── Parameter adjustments
```

## Deployment Topology

### Single Server Deployment
```
Host Machine
└── Docker Engine
    └── ARK Container (1 server)
        ├── Game server process
        ├── RCON listener
        └── Log aggregation
```

### Multi-Server Deployment (Docker Compose)
```
Host Machine
└── Docker Engine
    ├── ark-ascended-primary
    │   ├── Game server process
    │   ├── Data volume
    │   ├── Backup volume
    │   └── Log volume
    │
    ├── ark-ascended-secondary
    │   ├── Game server process
    │   ├── Data volume (separate)
    │   ├── Backup volume (separate)
    │   └── Log volume (separate)
    │
    ├── ark-evolved-primary
    │   ├── Game server process
    │   ├── Data volume
    │   ├── Backup volume
    │   └── Log volume
    │
    └── ark-evolved-secondary
        ├── Game server process
        ├── Data volume (separate)
        ├── Backup volume (separate)
        └── Log volume (separate)
    
    Shared Infrastructure:
    ├── Bridge Network (ark-network)
    ├── Docker volumes storage
    └── Log aggregation
```

### Multi-Host Cluster (Swarm/Kubernetes)
```
Host 1
├── Docker Engine
│   ├── ARK Ascended Primary
│   └── ARK Evolved Primary
│
Host 2
├── Docker Engine
│   ├── ARK Ascended Secondary
│   └── ARK Evolved Secondary
│
Host 3+
├── Docker Engine
│   └── Additional instances
│
Cluster Layer:
├── ArkClusterManager (runs on Host 1)
├── Shared cluster data store
├── Health monitoring
└── Character synchronization
```

## Security Architecture

```
Network Isolation:
- Docker bridge network (172.25.0.0/16)
- No direct host access from containers
- Firewall rules for external ports

Data Protection:
- Environment variables for secrets
- No secrets in logs
- Volume encryption ready
- TLS-ready for RCON

Access Control:
- Container user privileges
- Port whitelisting
- RCON password protection
- Admin command validation

Resource Protection:
- CPU limits (4 cores/container)
- Memory limits (16GB/container)
- Disk quotas configurable
- Connection limits
```

## Performance Architecture

```
Optimization Strategies:
- Wine CPU topology: 4:2 (multi-core optimization)
- Direct memory access (Wine)
- Multi-threaded game server (ARK Evolved)
- Health check interval: 60 seconds (non-blocking)
- Cluster sync interval: 30 seconds (async)
- Logging buffer: 10MB rotated files

Resource Management:
- Container memory reservation
- CPU share allocation
- Disk I/O optimization
- Network optimization
- Swap memory allocation
```

## Monitoring & Observability

```
Data Collection Points:
├── Docker Container Stats
│   ├── CPU usage
│   ├── Memory usage
│   ├── Disk I/O
│   └── Network traffic
│
├── Game Server Logs
│   ├── Startup logs
│   ├── Error logs
│   ├── Player logs
│   └── Server events
│
├── Health Check Results
│   ├── Port availability
│   ├── Process status
│   ├── Response times
│   └── Error rates
│
└── Application Events
    ├── Container lifecycle
    ├── Character migrations
    ├── Cluster operations
    └── Configuration changes

Output Channels:
- JSON file logging (Docker)
- Log rotation (max 10MB, 5 files)
- stderr/stdout capture
- Health check endpoints
- Metrics export (prometheus ready)
```

## Failure Recovery Architecture

```
Failure Detection:
1. Health check failure (60s interval)
2. Container exit detection
3. Process monitoring
4. Network connectivity check

Recovery Actions:
1. Automatic container restart (unless-stopped)
2. Data validation on restart
3. Cluster state recovery
4. Character data integrity check

Fallback Mechanisms:
1. Backup recovery (manual)
2. Cross-node migration (automatic)
3. Configuration reset (manual)
4. Full system rollback (manual)
```

## Data Consistency

```
Consistency Levels:
- Eventually consistent cluster state
- Transactional character migration
- Atomic backup operations
- Synchronized health checks

Conflict Resolution:
- Last-write-wins for character data
- Backup selection (most recent)
- Node priority (configured)
- Manual intervention (critical)

Data Backup Strategy:
- Continuous backup of game state
- Incremental character backups
- Full cluster state snapshots
- 30-day retention minimum
```

---

This architecture provides a robust, scalable, and secure platform for operating ARK game servers across multiple machines with automatic clustering and character migration support.
