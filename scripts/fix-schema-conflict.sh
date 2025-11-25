#!/bin/bash

# Script to fix Git merge conflict markers in prisma/schema.prisma

SCHEMA_FILE="prisma/schema.prisma"

if [ ! -f "$SCHEMA_FILE" ]; then
  echo "Error: $SCHEMA_FILE not found"
  exit 1
fi

echo "🔧 Fixing merge conflict in $SCHEMA_FILE..."

# Create a backup
cp "$SCHEMA_FILE" "${SCHEMA_FILE}.backup"

# Remove all conflict markers
sed -i '/^<<<<<<< Updated upstream$/d' "$SCHEMA_FILE"
sed -i '/^=======$/d' "$SCHEMA_FILE"
sed -i '/^>>>>>>> Stashed changes$/d' "$SCHEMA_FILE"

# Remove duplicate provider lines - keep only the first one with the correct comment
# This sed command removes lines that contain "vagy" (the duplicate comment)
sed -i '/provider = "mysql" \/\/ vagy "mysql"/d' "$SCHEMA_FILE"

# Ensure there's only one provider line with the correct comment
# If there are still duplicates, keep the first one
sed -i '/^  provider = "mysql"/{ 
  :a
  N
  $!ba
  s/  provider = "mysql"[^\n]*\n  provider = "mysql"[^\n]*/  provider = "mysql" \/\/ MySQL használata Hestia CP-hez\n/
}' "$SCHEMA_FILE"

echo "✅ Conflict markers removed from $SCHEMA_FILE"
echo "📝 Verifying the datasource section:"
sed -n '9,15p' "$SCHEMA_FILE"
echo ""
echo "✅ Done! Backup saved to ${SCHEMA_FILE}.backup"

