#!/bin/bash
# ARK Docker Setup Verification Script
# This script verifies the complete ARK Docker implementation is in place

set -e

echo "=================================================="
echo "ARK Docker Implementation Verification"
echo "=================================================="
echo ""

BASE_DIR="lib/games/ark-docker"
TEST_DIR="tests"
VERIFICATION_FAILED=0

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check function
check_file() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        lines=$(wc -l < "$file")
        echo -e "${GREEN}✓${NC} $description (${lines} lines)"
    else
        echo -e "${RED}✗${NC} $description - NOT FOUND"
        VERIFICATION_FAILED=1
    fi
}

check_directory() {
    local dir=$1
    local description=$2
    
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓${NC} $description"
    else
        echo -e "${RED}✗${NC} $description - NOT FOUND"
        VERIFICATION_FAILED=1
    fi
}

# Core Implementation Files
echo "Core Implementation Files:"
echo "------------------------"
check_file "$BASE_DIR/installer.ts" "ArkDockerInstaller class"
check_file "$BASE_DIR/cluster.ts" "ArkClusterManager class"
check_file "$BASE_DIR/deployment.ts" "Deployment automation"
check_file "$BASE_DIR/config-examples.ts" "Configuration examples"
check_file "$BASE_DIR/index.ts" "Module exports"

echo ""
echo "Docker Configuration Files:"
echo "-----------------------------"
check_file "$BASE_DIR/docker-compose.template.yml" "Docker Compose template"

echo ""
echo "Docker Directories:"
echo "-------------------"
check_directory "$BASE_DIR/docker" "Docker directory"
check_directory "$BASE_DIR/docker/ark-ascended" "ARK Ascended Docker directory"
check_directory "$BASE_DIR/docker/ark-evolved" "ARK Evolved Docker directory"

echo ""
echo "Docker Images:"
echo "---------------"
check_file "$BASE_DIR/docker/ark-ascended/Dockerfile" "ARK Ascended Dockerfile"
check_file "$BASE_DIR/docker/ark-ascended/start-server.sh" "ARK Ascended launcher script"
check_file "$BASE_DIR/docker/ark-evolved/Dockerfile" "ARK Evolved Dockerfile"
check_file "$BASE_DIR/docker/ark-evolved/start-server.sh" "ARK Evolved launcher script"

echo ""
echo "Documentation:"
echo "---------------"
check_file "$BASE_DIR/README.md" "Main documentation"
check_file "$BASE_DIR/SETUP_GUIDE.md" "Setup and deployment guide"
check_file "$BASE_DIR/QUICK_REFERENCE.md" "Quick reference guide"
check_file "$BASE_DIR/IMPLEMENTATION_SUMMARY.md" "Implementation summary"

echo ""
echo "Test Suite:"
echo "------------"
check_file "$TEST_DIR/ark-docker.test.ts" "ARK Docker test suite"

echo ""
echo "=================================================="
echo "File Statistics:"
echo "=================================================="

# Count files and lines
total_ts_lines=$(find $BASE_DIR -name "*.ts" -type f | xargs wc -l | tail -1 | awk '{print $1}')
total_md_lines=$(find $BASE_DIR -name "*.md" -type f | xargs wc -l | tail -1 | awk '{print $1}')
total_docker_lines=$(find $BASE_DIR/docker -name "Dockerfile" -o -name "*.sh" | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}')
test_lines=$(wc -l < "$TEST_DIR/ark-docker.test.ts")

echo "TypeScript Implementation: $total_ts_lines lines"
echo "Documentation: $total_md_lines lines"
echo "Docker Configuration: $total_docker_lines lines"
echo "Test Suite: $test_lines lines"
echo "---"
total_lines=$((total_ts_lines + total_md_lines + total_docker_lines + test_lines))
echo "TOTAL: $total_lines lines"

echo ""
echo "File Breakdown:"
echo "---------------"

for file in $(find $BASE_DIR -name "*.ts" -type f); do
    lines=$(wc -l < "$file")
    echo "  $(basename $file): $lines lines"
done

echo ""
echo "=================================================="
echo "Configuration Validation:"
echo "=================================================="

# Check for required strings in installer.ts
echo "Checking implementation features..."

if grep -q "class ArkDockerInstaller" "$BASE_DIR/installer.ts"; then
    echo -e "${GREEN}✓${NC} ArkDockerInstaller class defined"
else
    echo -e "${RED}✗${NC} ArkDockerInstaller class NOT found"
    VERIFICATION_FAILED=1
fi

if grep -q "async install" "$BASE_DIR/installer.ts"; then
    echo -e "${GREEN}✓${NC} install() method implemented"
else
    echo -e "${RED}✗${NC} install() method NOT found"
    VERIFICATION_FAILED=1
fi

if grep -q "async start\|async stop\|async restart\|async delete" "$BASE_DIR/installer.ts"; then
    echo -e "${GREEN}✓${NC} Server lifecycle methods implemented"
else
    echo -e "${RED}✗${NC} Server lifecycle methods NOT found"
    VERIFICATION_FAILED=1
fi

if grep -q "class ArkClusterManager" "$BASE_DIR/cluster.ts"; then
    echo -e "${GREEN}✓${NC} ArkClusterManager class defined"
else
    echo -e "${RED}✗${NC} ArkClusterManager class NOT found"
    VERIFICATION_FAILED=1
fi

if grep -q "validateConfig" "$BASE_DIR/installer.ts"; then
    echo -e "${GREEN}✓${NC} Configuration validation implemented"
else
    echo -e "${RED}✗${NC} Configuration validation NOT found"
    VERIFICATION_FAILED=1
fi

echo ""
echo "=================================================="
echo "Docker Configuration Verification:"
echo "=================================================="

if grep -q "FROM ubuntu" "$BASE_DIR/docker/ark-ascended/Dockerfile"; then
    echo -e "${GREEN}✓${NC} ARK Ascended Dockerfile valid"
else
    echo -e "${RED}✗${NC} ARK Ascended Dockerfile invalid"
    VERIFICATION_FAILED=1
fi

if grep -q "FROM ubuntu" "$BASE_DIR/docker/ark-evolved/Dockerfile"; then
    echo -e "${GREEN}✓${NC} ARK Evolved Dockerfile valid"
else
    echo -e "${RED}✗${NC} ARK Evolved Dockerfile invalid"
    VERIFICATION_FAILED=1
fi

if grep -q "#!/bin/bash" "$BASE_DIR/docker/ark-ascended/start-server.sh"; then
    echo -e "${GREEN}✓${NC} ARK Ascended launcher script valid"
else
    echo -e "${RED}✗${NC} ARK Ascended launcher script invalid"
    VERIFICATION_FAILED=1
fi

if grep -q "version:" "$BASE_DIR/docker-compose.template.yml"; then
    echo -e "${GREEN}✓${NC} Docker Compose template valid"
else
    echo -e "${RED}✗${NC} Docker Compose template invalid"
    VERIFICATION_FAILED=1
fi

echo ""
echo "=================================================="
echo "Test Suite Verification:"
echo "=================================================="

if grep -q "describe.*ArkDockerInstaller" "$TEST_DIR/ark-docker.test.ts"; then
    echo -e "${GREEN}✓${NC} ArkDockerInstaller tests defined"
else
    echo -e "${RED}✗${NC} ArkDockerInstaller tests NOT found"
    VERIFICATION_FAILED=1
fi

if grep -q "describe.*ArkClusterManager" "$TEST_DIR/ark-docker.test.ts"; then
    echo -e "${GREEN}✓${NC} ArkClusterManager tests defined"
else
    echo -e "${RED}✗${NC} ArkClusterManager tests NOT found"
    VERIFICATION_FAILED=1
fi

echo ""
echo "=================================================="
echo "Documentation Verification:"
echo "=================================================="

for doc in README SETUP_GUIDE QUICK_REFERENCE IMPLEMENTATION_SUMMARY; do
    if [ -f "$BASE_DIR/${doc}.md" ]; then
        lines=$(wc -l < "$BASE_DIR/${doc}.md")
        echo -e "${GREEN}✓${NC} $doc.md ($lines lines)"
    else
        echo -e "${RED}✗${NC} $doc.md NOT found"
        VERIFICATION_FAILED=1
    fi
done

echo ""
echo "=================================================="

if [ $VERIFICATION_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ ALL CHECKS PASSED${NC}"
    echo ""
    echo "ARK Docker implementation is complete and ready!"
    echo ""
    echo "Next steps:"
    echo "1. Build Docker images:"
    echo "   docker build -t zedin-gaming/ark-ascended:latest ./lib/games/ark-docker/docker/ark-ascended/"
    echo "   docker build -t zedin-gaming/ark-evolved:latest ./lib/games/ark-docker/docker/ark-evolved/"
    echo ""
    echo "2. Run tests:"
    echo "   npm test -- ark-docker.test.ts"
    echo ""
    echo "3. Review documentation:"
    echo "   - README.md for full API reference"
    echo "   - SETUP_GUIDE.md for deployment instructions"
    echo "   - QUICK_REFERENCE.md for quick start"
    echo ""
    exit 0
else
    echo -e "${RED}✗ VERIFICATION FAILED${NC}"
    echo ""
    echo "Some checks did not pass. Please review the errors above."
    exit 1
fi
