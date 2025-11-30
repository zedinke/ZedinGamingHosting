/**
 * AI Rendszer Automatikus Telepítése
 * 
 * Ez a script automatikusan telepíti az AI rendszert:
 * - Központi gépen: AI Development Assistant
 * - Szerver gépeken: AI Server Agent
 * 
 * Automatikusan meghívódik:
 * - Rendszer frissítéskor (központi gép)
 * - Agent telepítéskor (szerver gépek)
 */

const { execSync, spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const AI_DEV_MODEL = process.env.AI_DEV_MODEL || process.env.OLLAMA_MODEL || 'phi3:mini';
const AI_SERVER_MODEL = process.env.AI_SERVER_MODEL || process.env.OLLAMA_MODEL || 'llama3.2:3b';

console.log('🤖 AI Rendszer automatikus telepítés...');
console.log(`📍 Ollama URL: ${OLLAMA_URL}`);
console.log(`📦 Dev modell: ${AI_DEV_MODEL}`);
console.log(`📦 Server modell: ${AI_SERVER_MODEL}`);

// Környezet típus meghatározása
const isServerMachine = process.env.AI_SERVER_MODE === 'true' || process.env.SERVER_MACHINE === 'true';
const modelToUse = isServerMachine ? AI_SERVER_MODEL : AI_DEV_MODEL;

console.log(`🔧 Környezet: ${isServerMachine ? 'Szerver gép' : 'Központi gép'}`);
console.log(`📦 Használt modell: ${modelToUse}`);

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
function checkModelAvailable(model) {
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
            (m) => m.name === model || m.name.startsWith(`${model}:`)
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
function pullModel(model) {
  return new Promise((resolve, reject) => {
    console.log(`📥 Modell letöltése: ${model}...`);
    const url = new URL(`${OLLAMA_URL}/api/pull`);
    
    const postData = JSON.stringify({
      name: model,
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
      if (process.platform === 'linux') {
        console.log('🐧 Linux rendszer észlelve, Ollama telepítése...');
        execSync('curl -fsSL https://ollama.com/install.sh | sh', {
          stdio: 'inherit',
        });
        console.log('✅ Ollama telepítve!');
        console.log('🔄 Ollama szolgáltatás indítása...');
        
        // Systemd service indítása
        try {
          execSync('systemctl start ollama', { stdio: 'inherit' });
          execSync('systemctl enable ollama', { stdio: 'inherit' });
        } catch {
          // Ha systemd nincs, háttérben indítjuk
          const ollamaProcess = spawn('ollama', ['serve'], {
            detached: true,
            stdio: 'ignore',
          });
          ollamaProcess.unref();
        }
        
        setTimeout(() => {
          resolve();
        }, 5000);
      } else {
        console.log(`⚠️  Platform: ${process.platform}`);
        console.log('💡 Használd a Docker Compose-t vagy telepítsd manuálisan.');
        reject(new Error(`Nem támogatott platform: ${process.platform}`));
      }
    } catch (error) {
      reject(error);
    }
  });
}

// Fő telepítési függvény
async function setupAISystem() {
  try {
    // 1. Ellenőrzi, hogy az Ollama elérhető-e
    console.log('🔍 Ollama elérhetőség ellenőrzése...');
    let isAvailable = await checkOllamaAvailable();

    if (!isAvailable) {
      console.log('⚠️  Ollama nem elérhető, telepítés megkísérlése...');
      
      // Docker Compose esetén várunk
      if (process.env.DOCKER_COMPOSE === 'true' || OLLAMA_URL.includes('ollama')) {
        console.log('🐳 Docker Compose mód észlelve, várunk az Ollama container-re...');
        for (let i = 0; i < 24; i++) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
          isAvailable = await checkOllamaAvailable();
          if (isAvailable) {
            console.log('✅ Ollama elérhető!');
            break;
          }
          process.stdout.write(`\r⏳ Várakozás az Ollama-ra... (${(i + 1) * 5}s)`);
        }
        console.log('');
      } else {
        try {
          await installOllama();
          isAvailable = await checkOllamaAvailable();
        } catch (error) {
          console.warn(`⚠️  Ollama telepítési hiba: ${error.message}`);
          console.log('💡 A Docker Compose automatikusan telepíti, vagy telepítsd manuálisan.');
          return;
        }
      }
    } else {
      console.log('✅ Ollama elérhető!');
    }

    if (!isAvailable) {
      console.log('⚠️  Ollama nem elérhető, de folytatjuk...');
      console.log('💡 Az AI funkciók csak akkor működnek, ha az Ollama elérhető.');
      return;
    }

    // 2. Ellenőrzi és letölti a modellt
    console.log(`🔍 Modell ellenőrzése: ${modelToUse}...`);
    const hasModel = await checkModelAvailable(modelToUse);

    if (!hasModel) {
      console.log(`📥 Modell letöltése: ${modelToUse}...`);
      try {
        await pullModel(modelToUse);
      } catch (error) {
        console.warn(`⚠️  Modell letöltési hiba: ${error.message}`);
        console.log('💡 A modell letöltése később is megtörténhet automatikusan.');
      }
    } else {
      console.log(`✅ Modell már letöltve: ${modelToUse}`);
    }

    // 3. Központi gépen: AI Development Assistant fájlok ellenőrzése
    if (!isServerMachine) {
      console.log('🔍 AI Development Assistant fájlok ellenőrzése...');
      const aiFiles = [
        'lib/ai/development-assistant.ts',
        'lib/ai/code-writer.ts',
        'lib/ai/web-search.ts',
        'app/api/admin/ai/chat/route.ts',
        'app/api/admin/ai/analyze/route.ts',
        'app/api/admin/ai/code/route.ts',
      ];

      let allFilesExist = true;
      for (const file of aiFiles) {
        if (!fs.existsSync(path.join(process.cwd(), file))) {
          console.warn(`⚠️  Hiányzó fájl: ${file}`);
          allFilesExist = false;
        }
      }

      if (allFilesExist) {
        console.log('✅ AI Development Assistant fájlok megtalálhatók');
      } else {
        console.warn('⚠️  Néhány AI fájl hiányzik, de a rendszer frissítés során települnek');
      }
    }

    // 4. Szerver gépen: AI Server Agent fájlok ellenőrzése
    if (isServerMachine) {
      console.log('🔍 AI Server Agent fájlok ellenőrzése...');
      const agentFiles = [
        'lib/ai/server-agent.ts',
      ];

      let allFilesExist = true;
      for (const file of agentFiles) {
        if (!fs.existsSync(path.join(process.cwd(), file))) {
          console.warn(`⚠️  Hiányzó fájl: ${file}`);
          allFilesExist = false;
        }
      }

      if (allFilesExist) {
        console.log('✅ AI Server Agent fájlok megtalálhatók');
      } else {
        console.warn('⚠️  Néhány AI fájl hiányzik, de az agent telepítés során települnek');
      }
    }

    console.log('🎉 AI rendszer telepítés kész!');
    console.log(`✅ Modell: ${modelToUse}`);
    console.log(`✅ Környezet: ${isServerMachine ? 'Szerver gép' : 'Központi gép'}`);
  } catch (error) {
    console.error('❌ Hiba az AI rendszer telepítése során:', error.message);
    console.log('💡 Az AI funkciók csak akkor működnek, ha az Ollama elérhető és a modell letöltve van.');
  }
}

// Futtatás
if (require.main === module) {
  setupAISystem();
}

module.exports = { setupAISystem, checkOllamaAvailable, checkModelAvailable, pullModel };






