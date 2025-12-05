# ARK Docker System - Deployment Checklist

Pre-deployment verification and post-deployment validation checklist.

## ✅ Pre-Deployment Checklist

### System Requirements
- [ ] 8+ CPU cores available
- [ ] 32GB RAM available
- [ ] 500GB+ SSD storage free
- [ ] Gigabit network connectivity
- [ ] Linux/Windows Server with Docker support

### Software Requirements
- [ ] Docker 20.10+ installed (`docker --version`)
- [ ] Docker Compose 2.0+ installed (`docker-compose --version`)
- [ ] Node.js 16+ installed (`node --version`)
- [ ] npm/yarn available
- [ ] Git available (if cloning)

### Network Preparation
- [ ] Primary IP address identified
- [ ] UDP ports 7777-7778 available
- [ ] TCP port 27015 available (RCON)
- [ ] Firewall rules prepared
- [ ] NAT port forwarding configured (if needed)
- [ ] DNS records updated (if needed)

### Security Preparation
- [ ] Strong admin passwords generated (16+ chars, mixed case, symbols)
- [ ] Secure password management system in place
- [ ] SSH keys configured (if remote deployment)
- [ ] API keys/tokens secured
- [ ] Backup encryption configured
- [ ] SSL/TLS certificates ready (if using HTTPS reverse proxy)

### Storage Preparation
- [ ] 100GB+ disk space per ARK Ascended server
- [ ] 150GB+ disk space per ARK Evolved server
- [ ] Backup storage location identified (2x server size)
- [ ] Log storage location identified
- [ ] tmpfs or high-speed storage for cache

### Monitoring Preparation
- [ ] Monitoring/alerting system configured
- [ ] Log aggregation setup ready
- [ ] Backup verification procedure documented
- [ ] On-call rotation established
- [ ] Incident response plan prepared

## 🚀 Deployment Steps

### Phase 1: Setup (30 minutes)

- [ ] Clone/download ARK Docker System
- [ ] Copy `.env.example` to `.env`
- [ ] Configure environment variables
- [ ] Review `docker-compose.yml` configuration
- [ ] Customize server names, maps, max players
- [ ] Verify all ports are unique
- [ ] Test Docker daemon: `docker ps`

### Phase 2: Preparation (45 minutes)

- [ ] Run `npm install`
- [ ] Run `npm test` (verify all tests pass)
- [ ] Run `bash scripts/verify-implementation.sh`
- [ ] Build Docker images: `docker-compose build`
- [ ] Verify images built: `docker images | grep ark`
- [ ] Create `.env` file with passwords
- [ ] Copy `docker-compose.template.yml` to `docker-compose.yml`

### Phase 3: Pre-Flight Checks (15 minutes)

```bash
# Verify Docker
docker --version
docker ps  # Should show empty or existing containers

# Verify Docker Compose
docker-compose --version
docker-compose config  # Should show valid YAML

# Verify network ports
netstat -an | grep 777
netstat -an | grep 27015

# Verify file permissions
ls -la docker-compose.yml
ls -la scripts/verify-implementation.sh
```

- [ ] Docker daemon responding
- [ ] Docker Compose valid configuration
- [ ] Required ports not in use
- [ ] File permissions correct
- [ ] All required files present

### Phase 4: Deployment (10 minutes)

```bash
# Build images with no cache
docker-compose build --no-cache

# Start containers
docker-compose up -d

# Verify containers started
docker-compose ps

# Check logs for startup
docker-compose logs -f
```

- [ ] `docker-compose build` completes successfully
- [ ] `docker-compose up -d` succeeds
- [ ] All containers listed as "running"
- [ ] No startup errors in logs

### Phase 5: Initialization (10-15 minutes)

```bash
# Monitor startup progression
watch -n 5 'docker-compose ps'

# Follow specific server logs
docker logs -f ark-ascended-primary

# Check for error patterns
docker logs ark-ascended-primary 2>&1 | grep -i error
```

- [ ] Containers show "healthy" status (after 5 minutes)
- [ ] No critical errors in logs
- [ ] CPU usage stabilizes
- [ ] Memory usage stabilizes
- [ ] All ports show active listeners

## ✅ Post-Deployment Checklist

### Immediate Verification (5 minutes after startup)

```bash
# Check container status
docker-compose ps

# Verify all containers running
# Expected: all services with status "running"
```

- [ ] All containers show status "running"
- [ ] CPU usage <80%
- [ ] Memory usage reasonable
- [ ] No restarts detected
- [ ] No errors in recent logs

### Functional Testing (15 minutes)

```bash
# Test game port
nc -zv localhost 7777
telnet localhost 7777

# Test query port
nc -zv localhost 7778

# Test RCON port
nc -zv localhost 27015

# Check container logs for "Server started"
docker logs ark-ascended-primary | grep -i "started"
```

- [ ] Port 7777 responds (game port)
- [ ] Port 7778 responds (query port)
- [ ] Port 27015 responds (RCON port)
- [ ] Server shows "started" in logs
- [ ] No connection refused errors

### Configuration Validation (5 minutes)

```bash
# Verify environment variables applied
docker exec ark-ascended-primary env | grep SERVER_NAME
docker exec ark-ascended-primary env | grep MAX_PLAYERS
docker exec ark-ascended-primary env | grep MAP

# Check server configuration files
docker exec ark-ascended-primary ls -la /ark/data/
```

- [ ] Server name correct
- [ ] Max players set correctly
- [ ] Map selection correct
- [ ] All configurations applied
- [ ] Data directory exists and writable

### Health Check Verification (5 minutes)

```bash
# Manually verify health check endpoint
curl http://localhost:27015/health

# Check Docker health status
docker ps --format "table {{.Names}}\t{{.Status}}"

# View health check details
docker inspect ark-ascended-primary | grep -A 5 '"Health"'
```

- [ ] Health endpoint responds
- [ ] All containers show "healthy"
- [ ] Health checks not failing
- [ ] Status shows "(healthy)"

### Network Verification (5 minutes)

```bash
# Test inter-container communication
docker exec ark-ascended-primary ping -c 3 ark-evolved-primary

# Check network configuration
docker network inspect ark-network

# Verify DNS resolution
docker exec ark-ascended-primary nslookup ark-evolved-primary
```

- [ ] Containers can reach each other
- [ ] Network bridge configured correctly
- [ ] DNS resolution working
- [ ] Network latency <10ms

### Storage Verification (5 minutes)

```bash
# Check disk usage
docker exec ark-ascended-primary df -h

# Verify volumes mounted
docker inspect ark-ascended-primary | grep -A 10 '"Mounts"'

# Check data directory
docker exec ark-ascended-primary ls -lah /ark/data/
docker exec ark-ascended-primary du -sh /ark/data/
```

- [ ] Disk space >50% available
- [ ] All volumes mounted
- [ ] Data directory accessible
- [ ] Backup directory writable

### Logging Verification (5 minutes)

```bash
# Check log files exist
docker exec ark-ascended-primary ls -la /ark/logs/

# Verify log rotation configured
docker logs --tail 100 ark-ascended-primary

# Check for log errors
docker logs ark-ascended-primary 2>&1 | tail -50
```

- [ ] Log files created
- [ ] Recent entries present
- [ ] No "ERROR" patterns
- [ ] Log format readable
- [ ] Log directory writable

### Performance Baseline (5 minutes)

```bash
# Capture baseline metrics
docker stats --no-stream > baseline.log

# Check CPU usage per container
docker stats --no-stream | grep ark

# Check memory efficiency
docker exec ark-ascended-primary free -h
```

- [ ] CPU usage <50%
- [ ] Memory usage <70%
- [ ] No memory leaks detected
- [ ] Metrics within expectations
- [ ] Baseline recorded

### Security Verification (5 minutes)

```bash
# Verify no exposed secrets in logs
docker logs ark-ascended-primary | grep -i password

# Check container user
docker inspect ark-ascended-primary | grep '"User"'

# Verify network isolation
docker network inspect ark-network
```

- [ ] No passwords in logs
- [ ] Running as non-root user (where applicable)
- [ ] Network correctly isolated
- [ ] Firewall rules applied
- [ ] No security warnings

## 🔄 Rollback Procedure (If issues detected)

```bash
# Stop all services
docker-compose down

# Remove containers (keep volumes)
docker-compose down --remove-orphans

# Remove images
docker image rm ark-ascended:latest ark-evolved:latest

# Restore from backup (if available)
docker-compose up -d
```

### Rollback Steps
- [ ] Save error logs for analysis
- [ ] Stop all containers: `docker-compose down`
- [ ] Restore previous configuration
- [ ] Review changes that caused issue
- [ ] Retest before re-deployment

## 📋 Production Sign-Off

After ALL above checks complete:

- [ ] System Administrator approval
- [ ] Security review completed
- [ ] Performance baseline established
- [ ] Backup procedures tested
- [ ] Monitoring system verified
- [ ] Incident response team briefed
- [ ] Documentation reviewed
- [ ] Production deployment authorized

## 🚨 Common Issues & Resolution

### Issue: Containers not starting
**Resolution:**
1. Check logs: `docker-compose logs`
2. Verify ports free: `netstat -an | grep 777`
3. Rebuild: `docker-compose build --no-cache`

### Issue: High memory usage
**Resolution:**
1. Check actual usage: `docker stats`
2. Reduce MAX_PLAYERS
3. Enable aggressive memory management

### Issue: Players can't connect
**Resolution:**
1. Verify ports open: `nc -zv localhost 7777`
2. Check firewall: `sudo ufw status`
3. Test from remote: `telnet your_ip 7777`

### Issue: Cluster not syncing
**Resolution:**
1. Verify inter-container networking
2. Check cluster logs
3. Restart cluster manager

## ✅ Post-Deployment Operations

### Daily Tasks
- [ ] Monitor container health (5 min)
- [ ] Check error logs (10 min)
- [ ] Verify player connections (5 min)

### Weekly Tasks
- [ ] Full backup verification (30 min)
- [ ] Performance review (15 min)
- [ ] Log rotation check (10 min)

### Monthly Tasks
- [ ] Security audit (1 hour)
- [ ] Capacity planning review (30 min)
- [ ] Update base images (1 hour)

## 📞 Support Contacts

- Docker Issues: https://docs.docker.com
- ARK Issues: https://ark.fandom.com
- System Admin: [Contact info]
- On-Call Support: [Contact info]

## 🎉 Deployment Complete!

When all checkboxes are checked:
1. ✅ System is production-ready
2. ✅ All servers functioning
3. ✅ Health monitoring active
4. ✅ Backups operational
5. ✅ Team trained and ready

**Deployment Status: READY FOR PRODUCTION**
