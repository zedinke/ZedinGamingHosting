# ARK Docker System - Quick Reference

Fast access to common commands and configurations.

## 🚀 Quick Start (5 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Run tests to verify setup
npm test

# 3. Build Docker images
docker-compose build

# 4. Start servers
docker-compose up -d

# 5. Monitor startup
docker-compose logs -f
```

## 📋 Common Commands

### Service Management

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart a service
docker-compose restart ark-ascended-primary

# View running services
docker-compose ps

# View service logs
docker-compose logs -f ark-ascended-primary

# Scale service (adjust replicas)
docker-compose up -d --scale ark-ascended-primary=2
```

### Container Inspection

```bash
# View all containers
docker ps -a

# View container stats
docker stats

# Check container memory usage
docker exec ark-ascended-primary free -h

# Check disk usage in container
docker exec ark-ascended-primary df -h

# Access container shell
docker exec -it ark-ascended-primary bash

# View recent logs
docker logs --tail 50 ark-ascended-primary

# Stream logs in real-time
docker logs -f ark-ascended-primary
```

### Network Diagnostics

```bash
# Check if ports are listening
netstat -an | grep 7777

# Test port connectivity
telnet localhost 7777

# View port mappings
docker port ark-ascended-primary

# Check network configuration
docker network ls
docker network inspect ark-network
```

## 🔧 Configuration

### Server Parameters

Edit `docker-compose.yml`:

```yaml
environment:
  SERVER_NAME: "Server Name"
  MAX_PLAYERS: 70              # 1-500
  MAP: "TheIsland"             # See map list
  DIFFICULTY: 0.8              # 0-1
  PVP: 1                       # 0 or 1
  ADMIN_PASSWORD: "secure_password"
  SERVER_PASSWORD: "join_pass"
  CLUSTER_ENABLED: 1           # 0 or 1
  CLUSTER_NAME: "cluster"
```

### Resource Limits

```yaml
resources:
  limits:
    memory: 16g                # RAM limit
    cpus: '4'                  # CPU cores
  reservations:
    memory: 16g
    cpus: '4'
```

### Port Configuration

```yaml
ports:
  - "7777:7777/udp"           # Game port
  - "7778:7778/udp"           # Query port
  - "27015:27015"             # RCON port
```

## 🗺️ Map Reference

### ARK Ascended (7 maps)

| Map | Code | Difficulty |
|-----|------|-----------|
| Genesis Part 1 | Genesis1 | 0.8 |
| Genesis Part 2 | Genesis2 | 0.9 |
| The Island | TheIsland | 0.5 |
| Scorched Earth | Scorched | 0.7 |
| Aberration | Aberration | 0.85 |
| Extinction | Extinction | 0.8 |
| Crystal Isles | CrystalIsles | 0.75 |

### ARK Evolved (9 maps)

| Map | Code | Difficulty |
|-----|------|-----------|
| The Island | TheIsland | 0.5 |
| Scorched Earth | Scorched | 0.7 |
| Aberration | Aberration | 0.85 |
| Extinction | Extinction | 0.8 |
| Genesis | Genesis | 0.8 |
| Crystal Isles | CrystalIsles | 0.75 |
| Lost Island | LostIsland | 0.6 |
| Fjordur | FjordurMap | 0.65 |
| Survival Ascended | NewMap | 0.5 |

## 📊 Memory Recommendations

| Player Count | Minimum | Recommended |
|-------------|---------|------------|
| 10 | 6GB | 8GB |
| 20 | 8GB | 12GB |
| 30 | 10GB | 14GB |
| 50 | 12GB | 16GB |
| 70 | 14GB | 20GB |

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/ark-docker.test.ts

# Run specific test suite
npm test -- -t "ArkDockerInstaller"

# Run with coverage
npm run test:coverage

# Generate coverage report
npm run test:coverage -- --coverageReporters=html

# Watch mode (re-run on changes)
npm test -- --watch
```

## 🔍 Verification

```bash
# Verify implementation completeness
bash scripts/verify-implementation.sh

# Check Docker setup
docker version
docker-compose version

# Verify images exist
docker images | grep ark

# Test connectivity
nc -zv localhost 7777

# Check firewall
sudo ufw status
```

## 📝 Logs & Debugging

```bash
# View last 100 lines
docker logs --tail 100 ark-ascended-primary

# Follow logs live
docker logs -f ark-ascended-primary

# View server errors only
docker logs ark-ascended-primary 2>&1 | grep -i error

# Save logs to file
docker logs ark-ascended-primary > debug.log

# View logs with timestamps
docker logs --timestamps ark-ascended-primary

# Follow logs from specific time
docker logs --since 2024-01-01T00:00:00 ark-ascended-primary
```

## 🛠️ Troubleshooting Quick Fixes

### Container won't start
```bash
# Check logs first
docker logs ark-ascended-primary

# Force remove and restart
docker-compose down
docker-compose up -d
```

### High memory usage
```bash
# Check actual usage
docker stats ark-ascended-primary

# Reduce players
docker exec -it ark-ascended-primary \
  sed -i 's/MAX_PLAYERS=70/MAX_PLAYERS=50/g' /ark/config

# Restart container
docker-compose restart ark-ascended-primary
```

### Port already in use
```bash
# Find what's using the port
lsof -i :7777

# Kill the process
kill -9 <PID>

# Or change Docker port mapping
# Edit docker-compose.yml and change "7777:7777" to "7779:7777"
```

### No players can connect
```bash
# Check firewall
sudo ufw allow 7777/udp
sudo ufw allow 7778/udp
sudo ufw allow 27015

# Verify ports are open
nc -zv your_ip 7777

# Check Docker network
docker network inspect ark-network
```

## 🔐 Security Commands

```bash
# Change admin password
docker exec ark-ascended-primary \
  sed -i 's/old_password/new_password/g' /ark/config

# View current config
docker exec ark-ascended-primary cat /ark/data/config.txt

# Restrict RCON to localhost
docker exec ark-ascended-primary \
  sed -i 's/RCON_OPEN=1/RCON_OPEN=0/g' /ark/config
```

## 📦 Backup & Restore

```bash
# Backup single server
docker exec ark-ascended-primary \
  tar -czf /ark/backups/backup-$(date +%s).tar.gz /ark/data

# Backup all data
docker-compose exec -T ark-ascended-primary \
  tar -czf - /ark/data | gzip > server-backup.tar.gz

# List backups
docker exec ark-ascended-primary ls -lah /ark/backups/

# Restore from backup
docker exec ark-ascended-primary \
  tar -xzf /ark/backups/backup-123456.tar.gz -C /ark

# Backup full volumes
docker run --rm \
  -v ark-ascended-primary-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/volume-backup.tar.gz /data
```

## 🚀 Performance Tuning

```bash
# Increase CPU allocation
docker update --cpus=8 ark-ascended-primary

# Increase memory
docker update --memory=20g ark-ascended-primary

# Set memory swap limit
docker update --memory-swap=24g ark-ascended-primary

# Restart to apply
docker-compose restart ark-ascended-primary

# Monitor changes
docker stats --no-stream
```

## 📡 Networking

```bash
# View bridge network
docker network inspect ark-network

# Create custom network
docker network create ark-custom

# Connect container to network
docker network connect ark-custom ark-ascended-primary

# Check inter-container DNS
docker exec ark-ascended-primary nslookup ark-evolved-primary

# Test connectivity between containers
docker exec ark-ascended-primary \
  ping -c 3 ark-evolved-primary
```

## 🔄 Updates & Maintenance

```bash
# Update images from latest Dockerfile
docker-compose build --no-cache

# Pull latest base images
docker pull ubuntu:22.04
docker pull mcr.microsoft.com/windows/servercore:ltsc2022

# Prune unused resources
docker system prune -a

# Remove dangling volumes
docker volume prune

# Check image sizes
docker images --format "table {{.Repository}}\t{{.Size}}"
```

## 📊 Monitoring

```bash
# Continuous stats
watch -n 5 'docker stats --no-stream'

# Export metrics to file
docker stats --no-stream > metrics.log

# Check container uptime
docker exec ark-ascended-primary uptime

# Monitor in real-time with pretty format
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

## 🆘 Emergency Commands

```bash
# Force stop everything
docker-compose down --force-remove

# Hard reset (WARNING: deletes data)
docker-compose down -v

# Remove all containers, images, volumes
docker system prune -a --volumes

# Emergency shutdown
docker kill $(docker ps -q)

# Restart Docker daemon
sudo systemctl restart docker
```

## 💡 Pro Tips

1. Use aliases for common commands:
```bash
alias dc='docker-compose'
alias dcs='docker-compose ps'
alias dcl='docker-compose logs -f'
```

2. Set up monitoring:
```bash
nohup docker stats > monitoring.log &
```

3. Scheduled backups with cron:
```bash
0 2 * * * docker-compose exec -T ark-ascended-primary tar -czf /ark/backups/$(date +\%Y\%m\%d).tar.gz /ark/data
```

4. Performance baseline:
```bash
docker stats --no-stream > baseline.log
```

5. Health check endpoint:
```bash
curl http://localhost:27015/health
```

## 📚 More Information

- `README.md` - Full overview
- `SETUP_GUIDE.md` - Detailed installation
- `IMPLEMENTATION_SUMMARY.md` - Technical details
- `DEPLOYMENT_CHECKLIST.md` - Pre-deployment
