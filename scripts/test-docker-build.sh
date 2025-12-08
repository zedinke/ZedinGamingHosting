#!/bin/bash

# Docker Image Build és Container Indítás Teszt
# GameServer-1-en futtatandó

set -e

echo "=== Docker Image Build és Container Teszt ==="
echo ""

# 1. Docker ellenőrzés
echo "📌 1. Docker ellenőrzés..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker nincs telepítve!"
    exit 1
fi

docker --version
echo "✅ Docker elérhető"
echo ""

# 2. Dockerfile ellenőrzés
echo "📌 2. Dockerfile ellenőrzés..."
DOCKERFILE_PATH="docker/games/7days2die/Dockerfile"
if [ ! -f "$DOCKERFILE_PATH" ]; then
    echo "❌ Dockerfile nem található: $DOCKERFILE_PATH"
    exit 1
fi

echo "✅ Dockerfile található: $DOCKERFILE_PATH"
echo ""

# 3. Docker image build
echo "📌 3. Docker image build..."
IMAGE_NAME="7days2die:latest"
cd "$(dirname "$0")/.."

echo "   Build indítása: $IMAGE_NAME"
docker build -t "$IMAGE_NAME" -f "$DOCKERFILE_PATH" .

if [ $? -ne 0 ]; then
    echo "❌ Docker build sikertelen"
    exit 1
fi

echo "✅ Docker image build sikeres: $IMAGE_NAME"
docker images | grep 7days2die
echo ""

# 4. Teszt könyvtár létrehozása
echo "📌 4. Teszt könyvtár létrehozása..."
TEST_DIR="/tmp/test-7dtd-server"
mkdir -p "$TEST_DIR/server"
echo "✅ Teszt könyvtár: $TEST_DIR"
echo ""

# 5. Konfigurációs fájlok generálása (teszt)
echo "📌 5. Konfigurációs fájlok generálása..."
cat > "$TEST_DIR/server/serverconfig.xml" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<serverconfig>
    <property name="ServerName" value="Test 7DTD Server"/>
    <property name="ServerPort" value="26900"/>
    <property name="ServerMaxPlayerCount" value="8"/>
    <property name="TelnetPort" value="26901"/>
    <property name="ControlPanelPort" value="26902"/>
    <property name="GameWorld" value="Navezgane"/>
    <property name="GameMode" value="Survival"/>
    <property name="GameDifficulty" value="1"/>
    <property name="EACEnabled" value="true"/>
</serverconfig>
EOF

cat > "$TEST_DIR/server/admin.xml" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<admins>
    <user name="76561198000000000" permission_level="0" />
</admins>
EOF

echo "✅ Konfigurációs fájlok generálva"
echo ""

# 6. Container indítás teszt
echo "📌 6. Container indítás teszt..."
CONTAINER_NAME="test-7dtd-$(date +%s)"

# Régi container törlése, ha létezik
docker rm -f "$CONTAINER_NAME" 2>/dev/null || true

echo "   Container indítása: $CONTAINER_NAME"
docker run -d \
    --name "$CONTAINER_NAME" \
    --restart unless-stopped \
    -v "$TEST_DIR/server:/opt/7days2die" \
    -p 26900:26900/udp \
    -p 26901:26901/tcp \
    -p 26902:26902/tcp \
    "$IMAGE_NAME" sleep 3600

if [ $? -ne 0 ]; then
    echo "❌ Container indítás sikertelen"
    exit 1
fi

echo "✅ Container indítva: $CONTAINER_NAME"
docker ps | grep "$CONTAINER_NAME"
echo ""

# 7. Container logok ellenőrzése
echo "📌 7. Container logok ellenőrzése..."
sleep 2
docker logs "$CONTAINER_NAME" --tail 20
echo ""

# 8. Container státusz
echo "📌 8. Container státusz..."
docker inspect "$CONTAINER_NAME" --format='{{.State.Status}}' | grep -q running && echo "✅ Container fut" || echo "⚠️  Container nem fut"
echo ""

# 9. Port ellenőrzés
echo "📌 9. Port ellenőrzés..."
if netstat -tuln 2>/dev/null | grep -q ":26900" || ss -tuln 2>/dev/null | grep -q ":26900"; then
    echo "✅ Port 26900 bind-olva"
else
    echo "⚠️  Port 26900 nem látható (lehet, hogy csak UDP)"
fi
echo ""

# 10. Cleanup (opcionális)
echo "📌 10. Cleanup..."
echo "   Container törlése: $CONTAINER_NAME"
docker rm -f "$CONTAINER_NAME" 2>/dev/null || true
echo "✅ Cleanup kész"
echo ""

echo "=== Docker Build és Container Teszt Kész ==="
echo ""
echo "📋 Következő lépések:"
echo "   1. Template build: bash scripts/build-7days-template.sh"
echo "   2. Template feltöltés Google Drive-ra"
echo "   3. Teljes deployment teszt"

