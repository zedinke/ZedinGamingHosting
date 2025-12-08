#!/bin/bash

# 7 Days to Die Template Build Script
# Ez a script build-eli a Docker image-t, csomagolja és előkészíti a Google Drive feltöltéshez

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DOCKER_DIR="$PROJECT_ROOT/docker/games/7days2die"
TEMPLATE_NAME="7days2die-template-v1.0"
TEMP_DIR="/tmp/${TEMPLATE_NAME}"
IMAGE_NAME="7days2die:latest"

echo "=== 7 Days to Die Template Build ==="
echo "Project Root: $PROJECT_ROOT"
echo "Docker Dir: $DOCKER_DIR"
echo "Template Name: $TEMPLATE_NAME"

# 1. Docker image build
echo ""
echo "📦 Building Docker image..."
cd "$DOCKER_DIR"
docker build -t "$IMAGE_NAME" .

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed"
    exit 1
fi

echo "✅ Docker image built: $IMAGE_NAME"

# 2. Container indítás és konfigurálás
echo ""
echo "🚀 Starting container for template preparation..."
CONTAINER_NAME="7days2die-template-builder"

# Régi container törlése, ha létezik
docker rm -f "$CONTAINER_NAME" 2>/dev/null || true

# Container indítás
docker run -d --name "$CONTAINER_NAME" "$IMAGE_NAME" sleep 3600

if [ $? -ne 0 ]; then
    echo "❌ Container start failed"
    exit 1
fi

echo "✅ Container started: $CONTAINER_NAME"

# 3. Template fájlok másolása
echo ""
echo "📋 Copying template files..."
mkdir -p "$TEMP_DIR"

# Container fájlok exportálása
docker cp "$CONTAINER_NAME:/opt/7days2die" "$TEMP_DIR/server" || {
    echo "⚠️  Server files not found in container, will be downloaded on first run"
    mkdir -p "$TEMP_DIR/server"
}

# Dockerfile és entrypoint másolása
cp "$DOCKER_DIR/Dockerfile" "$TEMP_DIR/"
cp "$DOCKER_DIR/entrypoint.sh" "$TEMP_DIR/"

# 4. Template csomagolása
echo ""
echo "📦 Packaging template..."
cd /tmp
tar -czf "${TEMPLATE_NAME}.tar.gz" -C /tmp "$TEMPLATE_NAME"

if [ $? -ne 0 ]; then
    echo "❌ Template packaging failed"
    docker rm -f "$CONTAINER_NAME" || true
    exit 1
fi

# 5. Checksum generálás
echo ""
echo "🔐 Generating checksum..."
CHECKSUM=$(sha256sum "${TEMPLATE_NAME}.tar.gz" | cut -d' ' -f1)
FILE_SIZE=$(du -h "${TEMPLATE_NAME}.tar.gz" | cut -f1)

echo "✅ Template packaged:"
echo "   File: ${TEMPLATE_NAME}.tar.gz"
echo "   Size: $FILE_SIZE"
echo "   Checksum (SHA256): $CHECKSUM"

# 6. Container törlése
echo ""
echo "🧹 Cleaning up..."
docker rm -f "$CONTAINER_NAME" || true

echo ""
echo "=== Template Build Complete ==="
echo ""
echo "📁 Template location: /tmp/${TEMPLATE_NAME}.tar.gz"
echo "📋 Next steps:"
echo "   1. Upload to Google Drive manually or use API"
echo "   2. Update lib/game-templates/models/templates.ts with fileId"
echo "   3. Update checksum in template definition"
echo ""
echo "💡 To upload to Google Drive:"
echo "   - File name: ${TEMPLATE_NAME}.tar.gz"
echo "   - File size: $FILE_SIZE"
echo "   - Checksum: $CHECKSUM"

