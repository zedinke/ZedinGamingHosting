// Docker Ollama init script - Node.js verzió
// Automatikusan letölti a modellt, amikor az Ollama container elindul

const http = require('http');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3';

console.log('🤖 Ollama Docker Init Script');
console.log(`📍 Ollama URL: ${OLLAMA_URL}`);
console.log(`📦 Modell: ${OLLAMA_MODEL}`);

// Várunk, amíg az Ollama elérhető lesz
async function waitForOllama(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`${OLLAMA_URL}/api/tags`, {
        signal: AbortSignal.timeout(2000),
      });
      if (response.ok) {
        console.log('✅ Ollama elérhető!');
        return true;
      }
    } catch (error) {
      // Folytatjuk
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
    process.stdout.write(`\r⏳ Várakozás... (${(i + 1) * 2}s)`);
  }
  console.log('\n⚠️  Ollama nem elérhető a megadott időn belül');
  return false;
}

// Ellenőrzi, hogy a modell letöltve van-e
async function checkModel() {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return false;

    const data = await response.json();
    return data.models?.some(
      (m) => m.name === OLLAMA_MODEL || m.name.startsWith(`${OLLAMA_MODEL}:`)
    );
  } catch {
    return false;
  }
}

// Letölti a modellt
async function pullModel() {
  console.log(`📥 Modell letöltése: ${OLLAMA_MODEL}...`);
  try {
    const response = await fetch(`${OLLAMA_URL}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: OLLAMA_MODEL,
        stream: false,
      }),
      signal: AbortSignal.timeout(300000), // 5 perc timeout
    });

    if (response.ok) {
      console.log('✅ Modell letöltése befejezve!');
      return true;
    } else {
      console.error('❌ Hiba a modell letöltése során');
      return false;
    }
  } catch (error) {
    console.error('❌ Hiba a modell letöltése során:', error.message);
    return false;
  }
}

// Fő függvény
async function init() {
  const available = await waitForOllama();
  if (!available) {
    console.log('⚠️  Ollama nem elérhető, a modell letöltése később történik');
    return;
  }

  console.log(`🔍 Modell ellenőrzése: ${OLLAMA_MODEL}...`);
  const hasModel = await checkModel();

  if (!hasModel) {
    await pullModel();
  } else {
    console.log(`✅ Modell már letöltve: ${OLLAMA_MODEL}`);
  }

  console.log('🎉 Ollama init kész!');
}

// Futtatás
if (require.main === module) {
  init().catch(console.error);
}

module.exports = { init, waitForOllama, checkModel, pullModel };

