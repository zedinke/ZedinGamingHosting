#!/bin/bash

# Hestia CP user megtalálása domain alapján
# Futtasd: bash scripts/find-hestia-user.sh zedgaminghosting.hu

DOMAIN="${1:-zedgaminghosting.hu}"

echo "=========================================="
echo "Hestia CP User Keresése"
echo "Domain: $DOMAIN"
echo "=========================================="
echo ""

# 1. Mail domain információk
if [ -f "/usr/local/hestia/bin/v-list-mail-domain" ]; then
    echo "Mail domain információk:"
    /usr/local/hestia/bin/v-list-mail-domain $DOMAIN 2>/dev/null | head -5
    echo ""
fi

# 2. Web domain információk
if [ -f "/usr/local/hestia/bin/v-list-web-domain" ]; then
    echo "Web domain információk:"
    /usr/local/hestia/bin/v-list-web-domain $DOMAIN 2>/dev/null | head -5
    echo ""
fi

# 3. Domain fájlok alapján
echo "Domain fájlok alapján:"
if [ -d "/home" ]; then
    for user_dir in /home/*; do
        if [ -d "$user_dir" ]; then
            user=$(basename "$user_dir")
            if [ -d "$user_dir/web/$DOMAIN" ] || [ -d "$user_dir/mail/$DOMAIN" ]; then
                echo "   ✅ Található user: $user"
                echo "      Web: $([ -d "$user_dir/web/$DOMAIN" ] && echo "Igen" || echo "Nem")"
                echo "      Mail: $([ -d "$user_dir/mail/$DOMAIN" ] && echo "Igen" || echo "Nem")"
            fi
        fi
    done
fi
echo ""

# 4. Hestia CP konfiguráció alapján
if [ -f "/usr/local/hestia/data/users.conf" ]; then
    echo "Hestia CP felhasználók:"
    grep -E "^USER" /usr/local/hestia/data/users.conf | cut -d'=' -f2 | while read user; do
        if [ ! -z "$user" ]; then
            echo "   - $user"
        fi
    done
fi
echo ""

echo "=========================================="
echo "Használat:"
echo "=========================================="
echo ""
echo "Ha megtaláltad a user-t (pl. 'ZedGamingHosting'), akkor:"
echo ""
echo "/usr/local/hestia/bin/v-list-mail-domain-dkim ZedGamingHosting $DOMAIN"
echo "/usr/local/hestia/bin/v-add-mail-domain-dkim ZedGamingHosting $DOMAIN"
echo "/usr/local/hestia/bin/v-delete-mail-domain-dkim ZedGamingHosting $DOMAIN"
echo ""

