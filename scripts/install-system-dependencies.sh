#!/bin/bash

# Rendszer függőségek telepítése játékszerverekhez
# Ez a script telepíti az összes szükséges rendszer függőséget

set -e

echo "🚀 Rendszer függőségek telepítése játékszerverekhez"
echo "=================================================="

# Színek
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Ellenőrzés, hogy root vagy-e
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Kérjük, futtasd root-ként vagy sudo-val!${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Csomag lista frissítése...${NC}"
apt-get update

echo -e "${YELLOW}📦 Alapvető rendszer függőségek telepítése...${NC}"
apt-get install -y curl wget git

echo -e "${YELLOW}📦 7 Days to Die szerver függőségei telepítése (Unity motor támogatás)...${NC}"
apt-get install -y libpulse0 libpulse-dev libasound2 libatomic1

echo -e "${YELLOW}📦 Java telepítése (Java játékokhoz, pl. Minecraft)...${NC}"
apt-get install -y openjdk-17-jre-headless

echo -e "${YELLOW}📦 Wine telepítése (Windows játékokhoz, pl. The Forest)...${NC}"
apt-get install -y wine64

echo -e "${YELLOW}📦 SteamCMD telepítése...${NC}"
if [ ! -d "/opt/steamcmd" ]; then
    mkdir -p /opt/steamcmd
    cd /opt/steamcmd
    wget -q https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz
    tar -xzf steamcmd_linux.tar.gz
    chmod +x steamcmd.sh
    ./steamcmd.sh +quit
    echo -e "${GREEN}✓ SteamCMD telepítve: /opt/steamcmd${NC}"
else
    echo -e "${YELLOW}⚠ SteamCMD már telepítve van: /opt/steamcmd${NC}"
fi

echo -e "${GREEN}✅ Rendszer függőségek telepítése sikeresen befejezve!${NC}"
echo ""
echo "Telepített csomagok:"
echo "  - curl, wget, git (alapvető eszközök)"
echo "  - libpulse0, libpulse-dev, libasound2, libatomic1 (7 Days to Die)"
echo "  - openjdk-17-jre-headless (Java játékok)"
echo "  - wine64 (Windows játékok)"
echo "  - SteamCMD (/opt/steamcmd)"

