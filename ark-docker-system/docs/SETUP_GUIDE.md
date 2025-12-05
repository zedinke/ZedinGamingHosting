# ARK Docker System - Setup Guide

Complete step-by-step guide to install and configure ARK Docker servers.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation Steps](#installation-steps)
3. [Configuration](#configuration)
4. [Deployment](#deployment)
5. [Verification](#verification)
6. [Post-Deployment](#post-deployment)

## Prerequisites

### System Requirements
- **CPU**: 8+ cores recommended (4+ minimum)
- **RAM**: 32GB recommended (16GB minimum)
- **Disk**: 500GB+ SSD (for multiple servers)
- **Network**: Gigabit connection recommended
- **OS**: Linux/Windows Server with Docker support

### Software Requirements
```bash
# Check Docker version (20.10+)
docker --version

# Check Docker Compose version (2.0+)
docker-compose --version

# Check Node.js version (16+)
node --version
```

### Install Docker & Docker Compose

**Ubuntu/Debian:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

sudo apt-get install -y docker-compose
sudo usermod -aG docker $USER
```

**Windows (PowerShell as Admin):**
```powershell
# Using Chocolatey
choco install docker-desktop
choco install docker-compose
```

## Installation Steps

### 1. Clone/Download ARK Docker System

```bash
# Navigate to project
cd ark-docker-system

# Verify directory structure
ls -la
```

### 2. Install Dependencies

```bash
# Install Node.js packages
npm install

# Verify installation
npm test
```

### 3. Create Environment File

Create `.env` file in project root:

```bash
cat > .env << EOF
# ARK Ascended
ASCENDED_ADMIN_PASSWORD=YourSecurePassword123!@#
ASCENDED_SERVER_PASSWORD=OptionalJoinPassword456

# ARK Evolved
EVOLVED_ADMIN_PASSWORD=YourSecurePassword789!@#
EVOLVED_SERVER_PASSWORD=OptionalJoinPassword012

# Network Configuration
HOST_IP=0.0.0.0

# Optional: Remote registry
REGISTRY_URL=docker.io
REGISTRY_USERNAME=your_username
REGISTRY_PASSWORD=your_token
EOF
```

### 4. Build Docker Images

```bash
# Build ARK Ascended image
docker build -t ark-ascended:latest \
  -f docker/ark-ascended/Dockerfile \
  docker/

# Build ARK Evolved image
docker build -t ark-evolved:latest \
  -f docker/ark-evolved/Dockerfile \
  docker/

# Verify images
docker images | grep ark
```

### 5. Create Docker Compose File

```bash
# Copy template
cp docker-compose.template.yml docker-compose.yml

# Edit if needed (customize server names, maps, etc.)
nano docker-compose.yml
```

## Configuration

### Server Configuration

Edit `docker-compose.yml` to customize each server:

```yaml
environment:
  SERVER_NAME: "Your Server Name"
  MAX_PLAYERS: 70
  MAP: TheIsland          # Choose map
  DIFFICULTY: 0.8         # 0-1 scale
  PVP: 1                  # 1=yes, 0=no
  CLUSTER_ENABLED: 1      # Multi-server sync
  CLUSTER_NAME: cluster   # Cluster identifier
```

### Map Selection

**ARK Ascended Maps:**
- Genesis1, Genesis2, TheIsland, Scorched, Aberration, Extinction, CrystalIsles

**ARK Evolved Maps:**
- TheIsland, Scorched, Aberration, Extinction, Genesis, CrystalIsles, LostIsland, FjordurMap

### Resource Allocation

Per-server configuration:
```yaml
resources:
  limits:
    memory: 16g      # Adjust based on max players
    cpus: '4'        # CPU cores (2-8 recommended)
```

**Memory Guidelines:**
- 10 players: 8GB
- 30 players: 12GB
- 70 players: 16GB

### Advanced Configuration

Using TypeScript configuration:

```typescript
import { createMediumAscendedConfig, ArkDockerInstaller } from './src/index';

const config = createMediumAscendedConfig();

// Customize
config.serverName = 'My Custom Server';
config.maxPlayers = 50;
config.map = 'Genesis1';

const installer = new ArkDockerInstaller(config);
```

## Deployment

### 1. Start Services

```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d ark-ascended-primary

# Watch startup (follow logs)
docker-compose logs -f ark-ascended-primary
```

### 2. Monitor Startup

```bash
# Check service status
docker-compose ps

# View specific logs
docker logs ark-ascended-primary

# Expected: Server initialization -> "Started Server"
```

### 3. Verify Services

Wait 5-10 minutes for servers to initialize:

```bash
# Check if containers are running
docker ps | grep ark

# Verify health status
docker ps --format "table {{.Names}}\t{{.Status}}"
```

## Verification

### 1. Run Tests

```bash
# Run complete test suite
npm test

# Run specific test file
npm test -- tests/ark-docker.test.ts

# Run with coverage
npm run test:coverage
```

### 2. Verify Implementation

```bash
# Run verification script
bash scripts/verify-implementation.sh
```

Expected output:
```
✓ All TypeScript files present (5/5)
✓ All Docker files present (5/5)
✓ All test files present (1/1)
✓ All documentation present (8/8)
✓ Implementation Complete!
```

### 3. Network Connectivity

```bash
# Check if ports are listening
netstat -an | grep LISTEN | grep 777

# Test connection to primary server
telnet localhost 7777
```

### 4. Log Verification

```bash
# Check startup logs
docker logs ark-ascended-primary 2>&1 | head -50

# Look for: "Server started successfully"
# Check for errors or warnings
docker logs ark-ascended-primary 2>&1 | grep -i "error"
```

## Post-Deployment

### 1. Access Server Console

```bash
# Attach to running container
docker exec -it ark-ascended-primary bash

# View game logs
cat /ark/logs/Game.log | tail -100
```

### 2. Backup Configuration

```bash
# Create backup
docker exec ark-ascended-primary tar -czf /ark/backups/config-$(date +%s).tar.gz /ark/data

# Verify backup
docker exec ark-ascended-primary ls -lah /ark/backups/
```

### 3. Monitor Performance

```bash
# Check resource usage
docker stats ark-ascended-primary

# Check memory usage
docker exec ark-ascended-primary free -h

# Check disk usage
docker exec ark-ascended-primary df -h
```

### 4. Enable Auto-Backups

Add to crontab:
```bash
# Daily backups at 2 AM
0 2 * * * docker exec ark-ascended-primary tar -czf /ark/backups/daily-$(date +\%Y\%m\%d).tar.gz /ark/data
```

### 5. Set Up Monitoring

Using Docker stats:
```bash
# Continuous monitoring
watch -n 5 'docker stats --no-stream'

# Log to file
docker stats > monitoring.log &
```

## Common Operations

### Restart a Server

```bash
# Stop and start
docker-compose restart ark-ascended-primary

# Force restart
docker-compose stop ark-ascended-primary
docker-compose start ark-ascended-primary
```

### View Server Logs

```bash
# Last 100 lines
docker logs --tail 100 ark-ascended-primary

# Follow in real-time
docker logs -f ark-ascended-primary

# Save to file
docker logs ark-ascended-primary > server.log
```

### Update Configuration

```bash
# Edit docker-compose.yml
nano docker-compose.yml

# Apply changes
docker-compose up -d ark-ascended-primary
```

### Scale Servers

```bash
# Add more resources
docker update --memory 20g ark-ascended-primary

# Restart to apply
docker restart ark-ascended-primary
```

## Troubleshooting

### Server Won't Start

1. Check Docker daemon:
```bash
docker ps
```

2. Check logs for errors:
```bash
docker logs ark-ascended-primary 2>&1 | tail -50
```

3. Verify ports:
```bash
netstat -an | grep 7777
```

### High Memory Usage

1. Check actual usage:
```bash
docker stats ark-ascended-primary
```

2. Reduce max players or enable optimizations

3. Increase swap space:
```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Connection Issues

```bash
# Verify firewall
sudo ufw allow 7777/udp
sudo ufw allow 7778/udp
sudo ufw allow 27015

# Test connectivity
telnet your_server_ip 27015
```

## Next Steps

1. **Connect a Client**: Use ARK launcher to connect to `your_server_ip:7777`
2. **Configure RCON**: Access admin console on port 27015
3. **Manage Players**: Use in-game admin commands
4. **Set Up Clustering**: Configure character migration between servers
5. **Enable Backups**: Automated daily backups of server data

## Additional Resources

- Docker Documentation: https://docs.docker.com
- ARK Wiki: https://ark.fandom.com
- TypeScript Docs: https://www.typescriptlang.org/docs

## Support

For issues:
1. Check logs: `docker logs [container-name]`
2. Review QUICK_REFERENCE.md
3. Run verification: `bash scripts/verify-implementation.sh`
4. Check Docker daemon: `docker info`
