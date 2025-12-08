#!/bin/bash

# Fájlok szinkronizálása: Lokális -> GitHub -> Webszerver

set -e

echo "=== Fájlok szinkronizálása ==="
echo ""

# 1. Lokális változások commitolása
echo "📦 1. Lokális változások commitolása..."
cd "$(dirname "$0")/.."

# Új fájlok hozzáadása
git add -A

# Commit üzenet
COMMIT_MSG="feat: Docker template rendszer implementálása - Port Manager, 7 Days to Die template, ARK cluster támogatás"

# Commit (ha vannak változások)
if ! git diff --cached --quiet || ! git diff --quiet; then
    git commit -m "$COMMIT_MSG"
    echo "✅ Lokális változások commitolva"
else
    echo "ℹ️  Nincs lokális változás a commitoláshoz"
fi

# 2. GitHub-ra push
echo ""
echo "🚀 2. GitHub-ra push..."
git push origin main
echo "✅ GitHub-ra pusholva"

# 3. Webszerveren pull
echo ""
echo "📥 3. Webszerveren pull..."
ssh -i ~/.ssh/webserver_key root@116.203.226.140 << 'EOF'
cd /opt/zedingaming

# Git pull (merge nélkül, ha van konfliktus)
git fetch origin
git merge origin/main || echo "⚠️  Merge konfliktus, manuális beavatkozás szükséges"

# .bak fájlok és ideiglenes fájlok törlése
echo "🧹 Ideiglenes fájlok törlése..."
find . -name "*.bak" -type f -delete
find . -name "*.tmp" -type f -delete
rm -f MachineDetail.tsx MachineManagement.tsx page.tsx route.ts ssh-key-manager.ts 2>/dev/null || true

# Git status
echo ""
echo "📊 Git status:"
git status --short

echo ""
echo "✅ Webszerver szinkronizálva"
EOF

echo ""
echo "=== Szinkronizálás kész ==="

