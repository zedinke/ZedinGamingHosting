#!/bin/bash

# Script to set proper permissions for uploads directories
# This allows FTP uploads to work properly

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Uploads mappák engedélyeinek beállítása ===${NC}"

# Get project root directory
PROJECT_ROOT=$(pwd)
if [ -d ".next/standalone" ]; then
    PROJECT_ROOT=$(cd .next/standalone/../.. && pwd)
fi

echo -e "${YELLOW}Project root: ${PROJECT_ROOT}${NC}"

# Uploads directories
UPLOADS_DIRS=(
    "public/uploads"
    "public/uploads/slideshow"
    "public/uploads/slideshow/videos"
    "public/uploads/blog"
    "public/uploads/team"
    "public/uploads/games"
)

# Create directories and set permissions
for dir in "${UPLOADS_DIRS[@]}"; do
    FULL_PATH="${PROJECT_ROOT}/${dir}"
    
    # Create directory if it doesn't exist
    if [ ! -d "$FULL_PATH" ]; then
        echo -e "${YELLOW}Creating directory: ${FULL_PATH}${NC}"
        mkdir -p "$FULL_PATH"
    fi
    
    # Set permissions: 755 for directories (rwxr-xr-x)
    # This allows:
    # - Owner: read, write, execute
    # - Group: read, execute
    # - Others: read, execute
    chmod 755 "$FULL_PATH"
    echo -e "${GREEN}✓ Set permissions for: ${dir}${NC}"
    
    # Also set ownership if running as root (optional)
    # Uncomment if needed:
    # chown -R www-data:www-data "$FULL_PATH"
done

# Set permissions for public directory
PUBLIC_DIR="${PROJECT_ROOT}/public"
if [ -d "$PUBLIC_DIR" ]; then
    chmod 755 "$PUBLIC_DIR"
    echo -e "${GREEN}✓ Set permissions for: public${NC}"
fi

echo -e "${GREEN}=== Engedélyek beállítva! ===${NC}"
echo -e "${YELLOW}Most már FTP-n keresztül is feltölthetsz fájlokat a public/uploads mappákba.${NC}"

