# ARK Docker Setup and Deployment Guide

## Overview

This guide covers the complete setup, deployment, and operation of the ARK Docker system for the ZedinGaming hosting platform.

## Pre-Deployment Checklist

### System Requirements

- [ ] Ubuntu 20.04 LTS or newer / CentOS 7+ / Debian 10+
- [ ] Docker 20.10+ installed
- [ ] Docker Compose 1.29+ installed
- [ ] 50GB+ disk space free
- [ ] 8GB+ RAM minimum (16GB+ recommended)
- [ ] Port 27015-27030 available (or custom range)
- [ ] Internet connectivity for SteamCMD

### Credentials and Keys

- [ ] Steam API key obtained from https://steamcommunity.com/dev
- [ ] Secure password generator ready
- [ ] SSH access to production server
- [ ] Backup storage location configured

## Installation

### 1. Install Docker and Docker Compose

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
sudo apt-get install -y docker.io docker-compose

# Add current user to docker group (optional, requires logout)
sudo usermod -aG docker $USER

# Verify installation
docker --version
docker-compose --version
```

### 2. Set Up Directory Structure

```bash
# Create ARK Docker directories
sudo mkdir -p /opt/ark-docker/{data,cluster,docker}
sudo chmod -R 755 /opt/ark-docker

# Create logs directory
sudo mkdir -p /var/log/ark-docker
sudo chmod 777 /var/log/ark-docker
```

### 3. Copy Docker Files

```bash
# Copy docker images
cp -r lib/games/ark-docker/docker/* /opt/ark-docker/docker/

# Copy TypeScript files
cp lib/games/ark-docker/*.ts /opt/ark-docker/

# Verify files
ls -la /opt/ark-docker/
```

### 4. Build Docker Images

```bash
# Build ARK Ascended image
docker build -t zedin-gaming/ark-ascended:latest \
  /opt/ark-docker/docker/ark-ascended/

# Build ARK Evolved image
docker build -t zedin-gaming/ark-evolved:latest \
  /opt/ark-docker/docker/ark-evolved/

# Verify images
docker images | grep zedin-gaming

# Output:
# zedin-gaming/ark-ascended  latest   abc123def456   2 hours ago   8.5GB
# zedin-gaming/ark-evolved   latest   def456abc789   2 hours ago   4.2GB
```

### 5. Test Docker Setup

```bash
# Test Docker functionality
docker run --rm ubuntu:22.04 echo "Docker is working!"

# Test volume creation
docker volume create test-volume
docker volume inspect test-volume
docker volume rm test-volume
```

## Server Creation

### Using TypeScript Installer

```typescript
// Create file: scripts/create-ark-servers.ts

import { ArkDockerInstaller } from '@/lib/games/ark-docker/installer';
import { smallPvPServer, mediumRpServer } from '@/lib/games/ark-docker/config-examples';

async function setupServers() {
  const installer = new ArkDockerInstaller('/opt/ark-docker');

  // Initialize Docker environment
  console.log('Initializing ARK Docker environment...');
  await installer.initialize();

  // Create small PvP server
  console.log('Creating small PvP server...');
  const smallResult = await installer.install(smallPvPServer);
  console.log('Small PvP server result:', smallResult);

  // Create medium RP server
  console.log('Creating medium RP server...');
  const mediumResult = await installer.install(mediumRpServer);
  console.log('Medium RP server result:', mediumResult);

  // Monitor status
  console.log('Checking server status...');
  const smallStatus = await installer.getStatus('small-pvp-001');
  console.log('Small PvP status:', smallStatus);

  const mediumStatus = await installer.getStatus('medium-rp-001');
  console.log('Medium RP status:', mediumStatus);
}

setupServers().catch(console.error);
```

Run:
```bash
npx tsx scripts/create-ark-servers.ts
```

### Manual Docker Compose

```bash
# Create server directory
mkdir -p /opt/ark-docker/data/my-server-001
cd /opt/ark-docker/data/my-server-001

# Create .env file
cat > .env << 'EOF'
SERVER_NAME=My ARK Server
SERVER_PORT=27015
QUERY_PORT=27016
STEAM_API_KEY=your-key-here
MAP_NAME=TheIsland_WP
MAX_PLAYERS=70
DIFFICULTY=1.0
SERVER_PASSWORD=
ADMIN_PASSWORD=secure-password
CLUSTER_ID=
CLUSTER_MODE=false
ENABLE_PVP=true
ENABLE_CROSSHAIR=true
RAM_MB=8192
EOF

# Create docker-compose.yml
# (Copy from docker-compose.template.yml and adjust)

# Start server
docker-compose up -d

# Verify running
docker-compose ps
docker logs ark-ascended-my-server-001 -f
```

## Operations

### Starting and Stopping

```bash
# Start a stopped server
npx tsx << 'EOF'
import { ArkDockerInstaller } from '@/lib/games/ark-docker/installer';
const installer = new ArkDockerInstaller('/opt/ark-docker');
const result = await installer.start('my-server-001');
console.log(result);
EOF

# Stop a running server
docker-compose -f /opt/ark-docker/data/my-server-001/docker-compose.yml down

# Restart a server
docker-compose -f /opt/ark-docker/data/my-server-001/docker-compose.yml restart
```

### Monitoring Servers

```bash
# View all ARK containers
docker ps --filter "label=zed.game=ark-ascended"

# View resource usage
docker stats ark-ascended-my-server-001

# View detailed container info
docker inspect ark-ascended-my-server-001

# View server logs
docker logs ark-ascended-my-server-001 --tail 100 -f
```

### Backup and Restore

```bash
# Backup server data
BACKUP_DIR="/backup/ark-servers"
mkdir -p "$BACKUP_DIR"

docker run --rm \
  -v ark-ascended-my-server-001-data:/data \
  -v "$BACKUP_DIR:/backup" \
  alpine tar czf /backup/my-server-001-$(date +%Y%m%d_%H%M%S).tar.gz -C /data .

# List backups
ls -lh "$BACKUP_DIR"

# Restore from backup
BACKUP_FILE="$BACKUP_DIR/my-server-001-20240101_120000.tar.gz"

docker run --rm \
  -v ark-ascended-my-server-001-data:/data \
  -v "$BACKUP_DIR:/backup" \
  alpine sh -c "rm -rf /data/* && tar xzf /backup/$(basename $BACKUP_FILE) -C /data"
```

### Updating Servers

```bash
# Update Docker images
docker pull zedin-gaming/ark-ascended:latest
docker pull zedin-gaming/ark-evolved:latest

# Restart servers to apply updates
docker-compose -f /opt/ark-docker/data/my-server-001/docker-compose.yml restart

# Servers will update via SteamCMD automatically
docker logs ark-ascended-my-server-001 -f
```

## Cluster Configuration

### Setup Multi-Server Cluster

```typescript
import { ArkDockerInstaller } from '@/lib/games/ark-docker/installer';
import { ArkClusterManager } from '@/lib/games/ark-docker/cluster';
import { largePvPCluster } from '@/lib/games/ark-docker/config-examples';

async function setupCluster() {
  const installer = new ArkDockerInstaller('/opt/ark-docker');
  await installer.initialize();

  // Create all cluster servers
  for (const config of largePvPCluster) {
    console.log(`Creating cluster server: ${config.serverId}`);
    const result = await installer.install(config);
    if (result.success) {
      console.log(`✓ Created: ${config.serverId}`);
    } else {
      console.error(`✗ Failed: ${config.serverId} - ${result.error}`);
    }
  }

  // Initialize cluster manager
  const clusterManager = new ArkClusterManager('/opt/ark-docker/cluster', 'large-pvp-cluster');
  await clusterManager.initialize();

  // Add nodes to cluster
  for (const config of largePvPCluster) {
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
  const syncResult = await clusterManager.syncClusterData();
  console.log('Cluster sync result:', syncResult);

  // Get cluster status
  const status = await clusterManager.getStatus();
  console.log('Cluster status:', status);
}

setupCluster().catch(console.error);
```

## Monitoring and Logging

### Set Up Log Aggregation

```bash
# View all server logs
docker ps --filter "label=zed.game=ark-ascended" \
  --format "{{.Names}}" | xargs -I {} docker logs {} -f

# Save logs to file
docker logs ark-ascended-my-server-001 > /var/log/ark-docker/server.log

# Rotate logs (add to crontab)
0 0 * * * docker logs ark-ascended-my-server-001 > /var/log/ark-docker/server-$(date +\%Y\%m\%d).log
```

### Health Checks

```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' ark-ascended-my-server-001

# Manual health check
curl http://localhost:27015/health || echo "Server unhealthy"
```

## Security Hardening

### Network Isolation

```bash
# Create isolated Docker network
docker network create ark-network

# Inspect network
docker network inspect ark-network

# Update docker-compose to use network
# (Already configured in template)
```

### Firewall Configuration

```bash
# Allow only specific ports (using ufw)
sudo ufw allow 27015:27030/tcp
sudo ufw allow 27015:27030/udp
sudo ufw enable

# Verify rules
sudo ufw status
```

### Access Control

```bash
# Restrict docker socket access
sudo chmod 660 /var/run/docker.sock

# Verify permissions
ls -la /var/run/docker.sock
```

## Performance Tuning

### System Limits

```bash
# Increase file descriptors
echo "* soft nofile 100000" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 100000" | sudo tee -a /etc/security/limits.conf

# Apply changes
sudo sysctl -p
```

### Docker Resource Limits

```yaml
# In docker-compose.yml
services:
  ark-ascended-server-001:
    mem_limit: 8g
    memswap_limit: 10g
    cpus: '4'
    cpu_shares: 1024
```

### Optimize Network

```bash
# Enable IP forwarding
sudo sysctl -w net.ipv4.ip_forward=1

# Increase max connections
sudo sysctl -w net.ipv4.tcp_max_syn_backlog=2048
sudo sysctl -w net.core.somaxconn=1024
```

## Troubleshooting

### Server Won't Start

```bash
# Check container logs
docker logs ark-ascended-my-server-001

# Verify image exists
docker images | grep zedin-gaming

# Check volume exists
docker volume ls | grep ark

# Check ports are available
netstat -tulpn | grep 27015

# Rebuild image
docker build -t zedin-gaming/ark-ascended:latest ./docker/ark-ascended/
```

### Out of Memory

```bash
# Check memory usage
docker stats

# Reduce server max players or increase RAM
# Edit config and restart

# Check available system memory
free -h
```

### Port Conflicts

```bash
# Find process using port
lsof -i :27015

# Kill process
kill -9 <PID>

# Or change port in config
```

### Network Issues

```bash
# Test Docker network
docker network inspect ark-network

# Test container network access
docker exec ark-ascended-my-server-001 ping 8.8.8.8

# Check DNS
docker exec ark-ascended-my-server-001 nslookup google.com
```

## Automated Maintenance

### Daily Backup Script

```bash
#!/bin/bash
# /opt/ark-docker/backup.sh

BACKUP_DIR="/backup/ark-servers"
RETENTION_DAYS=14

mkdir -p "$BACKUP_DIR"

# Backup each server
for server in $(docker ps --filter "label=zed.game=ark-ascended" --format "{{.Label \"zed.server-id\"}}"); do
  VOLUME="ark-ascended-${server}-data"
  BACKUP_FILE="$BACKUP_DIR/${server}-$(date +%Y%m%d_%H%M%S).tar.gz"
  
  echo "Backing up $server..."
  docker run --rm \
    -v ${VOLUME}:/data \
    -v "$BACKUP_DIR:/backup" \
    alpine tar czf "/backup/$(basename $BACKUP_FILE)" -C /data .
done

# Cleanup old backups
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed"
```

Add to crontab:
```bash
# Backup daily at 2 AM
0 2 * * * /opt/ark-docker/backup.sh >> /var/log/ark-docker/backup.log 2>&1
```

### Weekly Update Script

```bash
#!/bin/bash
# /opt/ark-docker/update.sh

echo "Updating Docker images..."
docker pull zedin-gaming/ark-ascended:latest
docker pull zedin-gaming/ark-evolved:latest

echo "Restarting servers for update..."
for dir in /opt/ark-docker/data/*/; do
  if [ -f "$dir/docker-compose.yml" ]; then
    docker-compose -f "$dir/docker-compose.yml" restart
  fi
done

echo "Update completed"
```

## Production Deployment

### Step-by-Step Deployment

1. **Pre-flight checks**
   ```bash
   docker --version  # 20.10+
   docker-compose --version  # 1.29+
   df -h /  # 50GB+ free
   free -h  # 8GB+ RAM
   ```

2. **Build and test images**
   ```bash
   docker build -t zedin-gaming/ark-ascended:latest ./docker/ark-ascended/
   docker build -t zedin-gaming/ark-evolved:latest ./docker/ark-evolved/
   docker images | grep zedin-gaming
   ```

3. **Create staging environment**
   ```bash
   mkdir -p /opt/ark-docker-staging
   cp -r lib/games/ark-docker/* /opt/ark-docker-staging/
   ```

4. **Test with staging server**
   ```bash
   npx tsx << 'EOF'
   import { ArkDockerInstaller } from '@/lib/games/ark-docker/installer';
   import { smallPvPServer } from '@/lib/games/ark-docker/config-examples';
   
   const installer = new ArkDockerInstaller('/opt/ark-docker-staging');
   await installer.initialize();
   const result = await installer.install({...smallPvPServer, serverId: 'staging-test'});
   console.log(result);
   EOF
   ```

5. **Promote to production**
   ```bash
   cp -r /opt/ark-docker-staging/* /opt/ark-docker/
   ```

6. **Deploy servers**
   ```bash
   npx tsx scripts/deploy-production-servers.ts
   ```

## Support and Maintenance

### Regular Tasks

- [ ] Monitor disk usage (weekly)
- [ ] Review logs (daily)
- [ ] Update images (monthly)
- [ ] Test backups (monthly)
- [ ] Security updates (as needed)
- [ ] Performance tuning (quarterly)

### Escalation Procedures

1. **Server crashes**: Check logs, restart, verify configuration
2. **Performance issues**: Check resource usage, adjust RAM/CPU
3. **Network issues**: Verify ports, check firewall, test connectivity
4. **Data corruption**: Restore from backup, contact support

## Additional Resources

- Docker Documentation: https://docs.docker.com/
- Docker Compose: https://docs.docker.com/compose/
- ARK Server Wiki: https://ark.gamepedia.com/
- Steam API: https://steamcommunity.com/dev

## Contact and Support

For issues or questions:
- Email: support@zedin-gaming.com
- Discord: [ZedinGaming Server]
- Documentation: /docs/ARK_DOCKER_IMPLEMENTATION.md
