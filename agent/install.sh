#!/bin/bash

# Game Server Agent Installation Script
# Ez a script telepíti az agent daemon-t a game szerver gépre

set -e

echo "=== Game Server Agent telepítés kezdete ==="

# Konfigurációs paraméterek
MANAGER_URL="${1:-https://zedgaminghosting.hu/api/agent}"
AGENT_ID="${2:-agent-$(hostname)-$(date +%s)}"
API_KEY="${3:-}"  # Opcionális - a regisztráció során generálódik
SERVER_DIR="${4:-/opt/servers}"
BACKUP_DIR="${5:-/opt/backups}"

echo "Paraméterek:"
echo "  Manager URL: $MANAGER_URL"
echo "  Agent ID: $AGENT_ID"
echo "  Server Dir: $SERVER_DIR"
echo "  Backup Dir: $BACKUP_DIR"

# Node.js verzió ellenőrzése
if ! command -v node &> /dev/null; then
    echo "❌ Node.js nincs telepítve!"
    echo "Node.js telepítéshez futtassa:"
    echo "  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
    echo "  sudo apt-get install -y nodejs"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js verzió: $NODE_VERSION"

# Docker ellenőrzése (opcionális)
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo "✅ Docker telepítve: $DOCKER_VERSION"
else
    echo "⚠️  Docker nincs telepítve (opcionális, de ajánlott)"
fi

# Agent könyvtár létrehozása
echo "Agent könyvtár létrehozása: /opt/gaming-agent"
sudo mkdir -p /opt/gaming-agent
cd /opt/gaming-agent

# Agent fájlok másolása (ha az install scriptből fut)
if [ -f "index.js" ]; then
    echo "✅ Agent fájlok már léteznek"
else
    echo "⚠️  Agent fájlok másolása szükséges a /opt/gaming-agent könyvtárba"
    echo "Másolja a sor agent könyvtár tartalmát ide:"
    echo "  cp /path/to/agent/index.js /opt/gaming-agent/"
    echo "  cp /path/to/agent/package.json /opt/gaming-agent/"
fi

# Dependencies telepítése
if [ ! -d "node_modules" ]; then
    echo "NPM dependencies telepítése..."
    sudo npm install --prefix /opt/gaming-agent
else
    echo "✅ Node modules már léteznek"
fi

# Szerver és backup könyvtárak létrehozása
sudo mkdir -p "$SERVER_DIR"
sudo mkdir -p "$BACKUP_DIR"
sudo chmod 755 "$SERVER_DIR"
sudo chmod 755 "$BACKUP_DIR"

echo "✅ Szerver könyvtárak létrehozva"

# Systemd service fájl létrehozása
echo "Systemd service fájl létrehozása..."
sudo tee /etc/systemd/system/gaming-agent.service > /dev/null <<EOF
[Unit]
Description=Game Server Agent
After=network.target docker.service
Wants=docker.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/gaming-agent
Environment="MANAGER_URL=$MANAGER_URL"
Environment="AGENT_ID=$AGENT_ID"
Environment="API_KEY=$API_KEY"
Environment="SERVER_DIR=$SERVER_DIR"
Environment="BACKUP_DIR=$BACKUP_DIR"
Environment="NODE_ENV=production"
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

echo "✅ Systemd service fájl létrehozva"

# Systemd daemon reload
sudo systemctl daemon-reload

# Service indítása
echo "Gaming Agent service indítása..."
sudo systemctl enable gaming-agent
sudo systemctl start gaming-agent

# Státusz ellenőrzése
sleep 2
if sudo systemctl is-active --quiet gaming-agent; then
    echo "✅ Gaming Agent sikeresen elindítva!"
    echo ""
    echo "Státusz ellenőrzés:"
    sudo systemctl status gaming-agent --no-pager
    echo ""
    echo "Logok megtekintéséhez:"
    echo "  sudo journalctl -u gaming-agent -f"
else
    echo "❌ Gaming Agent indítása sikertelen!"
    echo "Logok:"
    sudo journalctl -u gaming-agent -n 20
    exit 1
fi

echo ""
echo "=== Agent telepítés befejezve ==="
echo ""
echo "Következő lépések:"
echo "1. Ellenőrizze, hogy az agent regisztrálja-e magát:"
echo "   sudo journalctl -u gaming-agent -f"
echo "2. Az admin panelben keresse meg az agent-t és erősítse meg!"
