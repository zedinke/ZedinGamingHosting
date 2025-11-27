#!/bin/bash

# Docker Ollama init script - automatikusan letölti a modellt
# Ezt a scriptet a Docker Compose entrypoint-ként használjuk

OLLAMA_URL="${OLLAMA_URL:-http://localhost:11434}"
# Alapértelmezett: phi3:mini - erőforráshatékony, gyors
OLLAMA_MODEL="${OLLAMA_MODEL:-phi3:mini}"

echo "🤖 Ollama Docker Init Script"
echo "📍 Ollama URL: $OLLAMA_URL"
echo "📦 Modell: $OLLAMA_MODEL"

# Várunk, amíg az Ollama elérhető lesz
echo "⏳ Várakozás az Ollama elérhetőségére..."
for i in {1..30}; do
    if curl -s -f "$OLLAMA_URL/api/tags" > /dev/null 2>&1; then
        echo "✅ Ollama elérhető!"
        break
    fi
    sleep 2
    echo -ne "\r⏳ Várakozás... ($((i * 2))s)"
done
echo ""

# Ellenőrzi, hogy a modell letöltve van-e
echo "🔍 Modell ellenőrzése: $OLLAMA_MODEL..."
if curl -s -f "$OLLAMA_URL/api/tags" | grep -q "$OLLAMA_MODEL"; then
    echo "✅ Modell már letöltve: $OLLAMA_MODEL"
else
    echo "📥 Modell letöltése: $OLLAMA_MODEL..."
    curl -X POST "$OLLAMA_URL/api/pull" \
        -H "Content-Type: application/json" \
        -d "{\"name\": \"$OLLAMA_MODEL\", \"stream\": false}"
    echo ""
    echo "✅ Modell letöltése befejezve!"
fi

echo "🎉 Ollama init kész!"

