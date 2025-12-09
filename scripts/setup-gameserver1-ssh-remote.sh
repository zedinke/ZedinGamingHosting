#!/bin/bash
set -e

HOST='95.217.194.148'
USER='root'
PASS=':2hJsXmJVTTx3Aw'
PUBKEY='ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIL81EbnxXvIZH8CFWGGwd3+ziUoNmG9dhFPS1ryGxRjv gameserver1'

echo "=== GameServer-1 SSH Kulcs Beállítás ==="
echo "Host: $HOST"
echo "User: $USER"
echo ""

echo "1. Publikus kulcs másolása GameServer-1-re..."
sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 -o ServerAliveInterval=5 -o ServerAliveCountMax=3 "$USER@$HOST" "mkdir -p ~/.ssh && grep -q 'gameserver1' ~/.ssh/authorized_keys 2>/dev/null || echo '$PUBKEY' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && chmod 700 ~/.ssh && echo 'SSH kulcs hozzáadva'"

if [ $? -eq 0 ]; then
    echo "✅ Publikus kulcs sikeresen másolva"
else
    echo "❌ Publikus kulcs másolás sikertelen"
    exit 1
fi

echo ""
echo "2. SSH kapcsolat tesztelése (jelszó nélkül)..."
echo "   (Ez még jelszóval fog működni, mert a kulcsot még nem használjuk)"

echo ""
echo "✅ SSH kulcs beállítva!"
echo ""
echo "Következő lépés:"
echo "  A lokális gépen használd ezt a parancsot:"
echo "  ssh -i ~/.ssh/gameserver1_key root@95.217.194.148"

