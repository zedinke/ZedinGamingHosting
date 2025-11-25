#!/bin/bash

# Script a Prisma schema fájl duplikált provider sor eltávolításához

SCHEMA_FILE="prisma/schema.prisma"

if [ ! -f "$SCHEMA_FILE" ]; then
    echo "Hiba: A $SCHEMA_FILE fájl nem található!"
    exit 1
fi

# Duplikált provider sor eltávolítása (a második előfordulást)
# Csak akkor távolítja el, ha két egymás utáni provider sor van
sed -i '/provider = "mysql" \/\/ vagy "mysql" ha MySQL-t használsz a Hestia CP-ben/d' "$SCHEMA_FILE"

# Vagy ha más formátumban van, távolítsuk el a duplikált sort
# Ha két provider sor van egymás után, tartsuk meg csak az elsőt
awk '/datasource db \{/,/^}/ {
    if (/provider = "mysql"/) {
        if (seen_provider) {
            next  # Távolítsuk el a második előfordulást
        }
        seen_provider = 1
    }
    print
}' "$SCHEMA_FILE" > "$SCHEMA_FILE.tmp" && mv "$SCHEMA_FILE.tmp" "$SCHEMA_FILE"

echo "Duplikált provider sor eltávolítva a $SCHEMA_FILE fájlból."

# Ellenőrzés
provider_count=$(grep -c 'provider = "mysql"' "$SCHEMA_FILE")
if [ "$provider_count" -gt 1 ]; then
    echo "Figyelem: Még mindig több provider sor van a fájlban!"
    echo "Kézi javítás szükséges."
    exit 1
else
    echo "A fájl rendben van, csak egy provider sor van."
    exit 0
fi

