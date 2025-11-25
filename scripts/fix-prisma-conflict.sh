#!/bin/bash

# Script a Prisma schema fájl merge conflict marker-ek eltávolításához

SCHEMA_FILE="prisma/schema.prisma"

if [ ! -f "$SCHEMA_FILE" ]; then
    echo "Hiba: A $SCHEMA_FILE fájl nem található!"
    exit 1
fi

# Conflict marker-ek eltávolítása
sed -i '/^<<<<<<< Updated upstream$/d' "$SCHEMA_FILE"
sed -i '/^=======$/d' "$SCHEMA_FILE"
sed -i '/^>>>>>>> Stashed changes$/d' "$SCHEMA_FILE"
sed -i '/^<<<<<<< HEAD$/d' "$SCHEMA_FILE"
sed -i '/^>>>>>>> .*$/d' "$SCHEMA_FILE"

echo "Merge conflict marker-ek eltávolítva a $SCHEMA_FILE fájlból."

# Ellenőrzés, hogy még mindig vannak-e conflict marker-ek
if grep -q "<<<<<<\|>>>>>>\|======" "$SCHEMA_FILE"; then
    echo "Figyelem: Még mindig vannak conflict marker-ek a fájlban!"
    echo "Kézi javítás szükséges."
    exit 1
else
    echo "A fájl tiszta, nincs conflict marker."
    exit 0
fi

