#!/bin/bash

# Ollama automatikus telepítési és beállítási script
# Használat: ./scripts/setup-ollama.sh

set -e

OLLAMA_URL="${OLLAMA_URL:-http://localhost:11434}"
OLLAMA_MODEL="${OLLAMA_MODEL:-llama3}"

echo "🤖 Ollama automatikus beállítás..."
echo "📍 Ollama URL: $OLLAMA_URL"
echo "📦 Modell: $OLLAMA_MODEL"

# Ellenőrzi, hogy az Ollama elérhető-e
check_ollama() {
    if curl -s -f "$OLLAMA_URL/api/tags" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Ellenőrzi, hogy a modell letöltve van-e
check_model() {
    if curl -s -f "$OLLAMA_URL/api/tags" | grep -q "$OLLAMA_MODEL"; then
        return 0
    else
        return 1
    fi
}

# Letölti a modellt
pull_model() {
    echo "📥 Modell letöltése: $OLLAMA_MODEL..."
    curl -X POST "$OLLAMA_URL/api/pull" \
        -H "Content-Type: application/json" \
        -d "{\"name\": \"$OLLAMA_MODEL\", \"stream\": false}" \
        --progress-bar | while IFS= read -r line; do
            echo "$line" | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || true
        done
    echo ""
    echo "✅ Modell letöltése befejezve!"
}

# Telepíti az Ollama-t
install_ollama() {
    echo "📦 Ollama telepítése..."
    
    if command -v docker &> /dev/null && docker ps &> /dev/null; then
        echo "🐳 Docker észlelve, használd a docker-compose.yml fájlt!"
        echo "   Futtasd: docker-compose up -d ollama"
        return 1
    fi
    
    if [ ! -f "/usr/local/bin/ollama" ]; then
        echo "📥 Ollama letöltése és telepítése..."
        curl -fsSL https://ollama.com/install.sh | sh
    else
        echo "✅ Ollama már telepítve van"
    fi
    
    # Indítja az Ollama-t háttérben, ha még nem fut
    if ! pgrep -x "ollama" > /dev/null; then
        echo "🔄 Ollama szolgáltatás indítása..."
        ollama serve > /dev/null 2>&1 &
        sleep 5
    fi
}

# Fő logika
main() {
    # 1. Ellenőrzi, hogy az Ollama elérhető-e
    echo "🔍 Ollama elérhetőség ellenőrzése..."
    if ! check_ollama; then
        echo "⚠️  Ollama nem elérhető, telepítés megkísérlése..."
        
        # Docker Compose esetén
        if echo "$OLLAMA_URL" | grep -q "ollama"; then
            echo "🐳 Docker Compose mód észlelve, várunk az Ollama container-re..."
            for i in {1..24}; do
                sleep 5
                if check_ollama; then
                    echo "✅ Ollama elérhető!"
                    break
                fi
                echo -ne "\r⏳ Várakozás az Ollama-ra... ($((i * 5))s)"
            done
            echo ""
        else
            if ! install_ollama; then
                echo "⚠️  Ollama telepítése nem sikerült vagy Docker módban vagyunk"
                return
            fi
        fi
    else
        echo "✅ Ollama elérhető!"
    fi
    
    # 2. Ellenőrzi, hogy a modell letöltve van-e
    echo "🔍 Modell ellenőrzése: $OLLAMA_MODEL..."
    if ! check_model; then
        pull_model
    else
        echo "✅ Modell már letöltve: $OLLAMA_MODEL"
    fi
    
    echo "🎉 Ollama beállítás kész!"
}

main

