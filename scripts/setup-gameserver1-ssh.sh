#!/bin/bash
set -e
HOST='95.217.194.148'
USER='root'
PASS=':2hJsXmJVTTx3Aw'
PUBKEY='ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIL81EbnxXvIZH8CFWGGwd3+ziUoNmG9dhFPS1ryGxRjv gameserver1'

echo 'Publikus kulcs másolása GameServer-1-re...'
sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no "$USER@$HOST" "mkdir -p ~/.ssh && grep -q 'gameserver1' ~/.ssh/authorized_keys 2>/dev/null || echo '$PUBKEY' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && chmod 700 ~/.ssh && echo 'SSH kulcs hozzáadva'"

echo 'Tesztelés...'
sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no "$USER@$HOST" "echo 'SSH kapcsolat OK'"
echo '✅ SSH kulcs beállítva!'

