const { execSync, spawn } = require('child_process');
const http = require('http');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
// Alapértelmezett: phi3:mini - erőforráshatékony, gyors, jó minőség (3.8B paraméter, ~2.3GB)
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'phi3:mini';

console.log('🤖 Ollama automatikus beállítás...');
console.log(`📍 Ollama URL: ${OLLAMA_URL}`);
console.log(`📦 Modell: ${OLLAMA_MODEL}`);

// Ellenőrzi, hogy az Ollama elérhető-e
function checkOllamaAvailable() {
  return new Promise((resolve) => {
    const url = new URL(`${OLLAMA_URL}/api/tags`);
    const req = http.get(url, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(5000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Ellenőrzi, hogy a modell letöltve van-e
function checkModelAvailable() {
  return new Promise((resolve) => {
    const url = new URL(`${OLLAMA_URL}/api/tags`);
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const models = JSON.parse(data);
          const hasModel = models.models?.some(
            (m) => m.name === OLLAMA_MODEL || m.name.startsWith(`${OLLAMA_MODEL}:`)
          );
          resolve(hasModel);
        } catch {
          resolve(false);
        }
      });
    });
    req.on('error', () => resolve(false));
    req.setTimeout(5000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Letölti a modellt
function pullModel() {
  return new Promise((resolve, reject) => {
    console.log(`📥 Modell letöltése: ${OLLAMA_MODEL}...`);
    const url = new URL(`${OLLAMA_URL}/api/pull`);
    
    const postData = JSON.stringify({
      name: OLLAMA_MODEL,
      stream: false,
    });

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk.toString();
        // Progress jelzés
        try {
          const lines = data.split('\n').filter((l) => l.trim());
          const lastLine = lines[lines.length - 1];
          if (lastLine) {
            const parsed = JSON.parse(lastLine);
            if (parsed.status) {
              process.stdout.write(`\r📥 ${parsed.status}`);
            }
          }
        } catch {}
      });
      res.on('end', () => {
        console.log('\n✅ Modell letöltése befejezve!');
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error(`\n❌ Hiba a modell letöltése során: ${error.message}`);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Telepíti az Ollama-t (ha nincs Docker)
function installOllama() {
  return new Promise((resolve, reject) => {
    console.log('📦 Ollama telepítése...');
    
    try {
      // Linux telepítés
      if (process.platform === 'linux') {
        console.log('🐧 Linux rendszer észlelve, Ollama telepítése...');
        execSync('curl -fsSL https://ollama.com/install.sh | sh', {
          stdio: 'inherit',
        });
        console.log('✅ Ollama telepítve!');
        console.log('🔄 Ollama szolgáltatás indítása...');
        
        // Indítja az Ollama-t háttérben
        const ollamaProcess = spawn('ollama', ['serve'], {
          detached: true,
          stdio: 'ignore',
        });
        ollamaProcess.unref();
        
        // Várunk egy kicsit, hogy elinduljon
        setTimeout(() => {
          resolve();
        }, 5000);
      } else if (process.platform === 'win32') {
        console.log('🪟 Windows rendszer észlelve.');
        console.log('⚠️  Kérjük, telepítsd az Ollama-t manuálisan: https://ollama.com/download');
        console.log('   Vagy használd a Docker Compose-t, ami automatikusan telepíti.');
        reject(new Error('Windows rendszer - manuális telepítés szükséges'));
      } else if (process.platform === 'darwin') {
        console.log('🍎 macOS rendszer észlelve.');
        console.log('⚠️  Kérjük, telepítsd az Ollama-t: brew install ollama');
        console.log('   Vagy használd a Docker Compose-t.');
        reject(new Error('macOS rendszer - manuális telepítés szükséges'));
      } else {
        reject(new Error(`Nem támogatott platform: ${process.platform}`));
      }
    } catch (error) {
      reject(error);
    }
  });
}

// Fő függvény
async function setupOllama() {
  // Skip in CI/sandbox environments
  if (process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true') {
    console.log('⏭️  CI környezet észlelve, Ollama telepítés kihagyása');
    console.log('💡 Az AI funkciók csak production környezetben érhetők el.');
    return;
  }

  try {
    // 1. Ellenőrzi, hogy az Ollama elérhető-e
    console.log('🔍 Ollama elérhetőség ellenőrzése...');
    const isAvailable = await checkOllamaAvailable();

    if (!isAvailable) {
      console.log('⚠️  Ollama nem elérhető, telepítés megkísérlése...');
      
      // Docker Compose esetén nem kell telepíteni, csak várni
      if (process.env.DOCKER_COMPOSE === 'true' || OLLAMA_URL.includes('ollama')) {
        console.log('🐳 Docker Compose mód észlelve, várunk az Ollama container-re...');
        // Várunk maximum 2 percet
        for (let i = 0; i < 24; i++) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
          const available = await checkOllamaAvailable();
          if (available) {
            console.log('✅ Ollama elérhető!');
            break;
          }
          process.stdout.write(`\r⏳ Várakozás az Ollama-ra... (${(i + 1) * 5}s)`);
        }
        console.log('');
      } else {
        try {
          await installOllama();
        } catch (error) {
          console.warn(`⚠️  Ollama telepítési hiba: ${error.message}`);
          console.log('💡 Használd a Docker Compose-t vagy telepítsd manuálisan.');
          return;
        }
      }
    } else {
      console.log('✅ Ollama elérhető!');
    }

    // 2. Ellenőrzi, hogy a modell letöltve van-e
    console.log(`🔍 Modell ellenőrzése: ${OLLAMA_MODEL}...`);
    const hasModel = await checkModelAvailable();

    if (!hasModel) {
      console.log(`📥 Modell letöltése: ${OLLAMA_MODEL}...`);
      await pullModel();
    } else {
      console.log(`✅ Modell már letöltve: ${OLLAMA_MODEL}`);
    }

    console.log('🎉 Ollama beállítás kész!');
  } catch (error) {
    console.error('❌ Hiba az Ollama beállítása során:', error.message);
    console.log('💡 A chat funkció nem lesz elérhető, amíg az Ollama nincs beállítva.');
    console.log('   Használd a Docker Compose-t vagy telepítsd manuálisan.');
  }
}

// Futtatás
if (require.main === module) {
  setupOllama();
}

module.exports = { setupOllama, checkOllamaAvailable, checkModelAvailable };

