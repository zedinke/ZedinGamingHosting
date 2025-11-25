#!/bin/bash

# Script to fix Git merge conflict markers in prisma/schema.prisma

SCHEMA_FILE="prisma/schema.prisma"

if [ ! -f "$SCHEMA_FILE" ]; then
  echo "Error: $SCHEMA_FILE not found"
  exit 1
fi

# Remove conflict markers and keep the correct version
sed -i '/^<<<<<<< Updated upstream$/d' "$SCHEMA_FILE"
sed -i '/^=======$/d' "$SCHEMA_FILE"
sed -i '/^>>>>>>> Stashed changes$/d' "$SCHEMA_FILE"

# Remove duplicate provider lines if any
# Keep only the first occurrence
sed -i '/^  provider = "mysql"/{ 
  :a
  N
  $!ba
  s/  provider = "mysql"[^\n]*\n  provider = "mysql"[^\n]*/  provider = "mysql" \/\/ MySQL használata Hestia CP-hez/
}' "$SCHEMA_FILE"

echo "✅ Conflict markers removed from $SCHEMA_FILE"
echo "📝 Please verify the file manually:"
echo "   nano $SCHEMA_FILE"

