// Chat API tesztelési script
// Használat: node scripts/test-chat-api.js

const http = require('http');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';

console.log('🔍 Chat API diagnosztika\n');
console.log(`📍 Ollama URL: ${OLLAMA_URL}`);
console.log(`📦 Modell: ${OLLAMA_MODEL}\n`);

// 1. Ollama elérhetőség ellenőrzése
async function checkOllama() {
  console.log('1️⃣ Ollama elérhetőség ellenőrzése...');
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Ollama elérhető!');
      console.log(`   Letöltött modellek: ${data.models?.length || 0}`);
      
      // Modell ellenőrzése
      const hasModel = data.models?.some(
        (m) => {
          const name = m.name || '';
          return name === OLLAMA_MODEL || 
                 name.startsWith(`${OLLAMA_MODEL}:`) ||
                 name.includes(OLLAMA_MODEL);
        }
      );
      
      if (hasModel) {
        console.log(`✅ Modell megtalálható: ${OLLAMA_MODEL}`);
      } else {
        console.log(`❌ Modell NEM található: ${OLLAMA_MODEL}`);
        console.log(`   Elérhető modellek:`);
        data.models?.forEach((m) => {
          console.log(`   - ${m.name}`);
        });
        console.log(`\n   Telepítés: ollama pull ${OLLAMA_MODEL}`);
      }
      return true;
    } else {
      console.log(`❌ Ollama nem elérhető: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Ollama kapcsolati hiba: ${error.message}`);
    console.log(`\n   Ellenőrizd:`);
    console.log(`   - Fut-e az Ollama? (docker-compose ps ollama)`);
    console.log(`   - Elérhető-e a ${OLLAMA_URL}?`);
    return false;
  }
}

// 2. Modell tesztelése
async function testModel() {
  console.log('\n2️⃣ Modell tesztelése...');
  try {
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          { role: 'system', content: 'Válaszolj magyarul, röviden.' },
          { role: 'user', content: 'Szia! Működsz?' },
        ],
        stream: false,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.message?.content) {
        console.log('✅ Modell válaszol!');
        console.log(`   Válasz: ${data.message.content.substring(0, 100)}...`);
        return true;
      } else {
        console.log('❌ Modell nem adott választ');
        console.log(`   Válasz: ${JSON.stringify(data)}`);
        return false;
      }
    } else {
      const errorText = await response.text();
      console.log(`❌ Modell hiba: ${response.status}`);
      console.log(`   Hiba: ${errorText}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Modell tesztelési hiba: ${error.message}`);
    return false;
  }
}

// 3. API endpoint tesztelése (ha elérhető)
async function testAPIEndpoint() {
  console.log('\n3️⃣ API endpoint tesztelése...');
  console.log('   (Ez csak akkor működik, ha az alkalmazás fut)');
  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Teszt üzenet',
        stream: false,
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (response.status === 401) {
      console.log('✅ API endpoint elérhető (401 - bejelentkezés szükséges, ez normális)');
      return true;
    } else if (response.ok) {
      console.log('✅ API endpoint működik!');
      return true;
    } else {
      console.log(`⚠️  API endpoint válasz: ${response.status}`);
      return false;
    }
  } catch (error) {
    if (error.message.includes('ECONNREFUSED')) {
      console.log('⚠️  API endpoint nem elérhető (alkalmazás nem fut?)');
    } else {
      console.log(`⚠️  API endpoint hiba: ${error.message}`);
    }
    return false;
  }
}

// Fő függvény
async function main() {
  const ollamaOk = await checkOllama();
  
  if (ollamaOk) {
    await testModel();
  }
  
  await testAPIEndpoint();
  
  console.log('\n📋 Összefoglalás:');
  if (ollamaOk) {
    console.log('✅ Ollama beállítva és működik');
    console.log('💡 Ha a chat még mindig nem működik, ellenőrizd:');
    console.log('   - Az alkalmazás fut-e?');
    console.log('   - A .env fájlban helyes-e az OLLAMA_URL?');
    console.log('   - A böngésző konzolban vannak-e hibák?');
  } else {
    console.log('❌ Ollama nincs beállítva vagy nem elérhető');
    console.log('💡 Telepítés:');
    console.log('   Docker: docker-compose up -d ollama');
    console.log('   Vagy: ollama serve');
    console.log(`   Modell: ollama pull ${OLLAMA_MODEL}`);
  }
}

main().catch(console.error);










