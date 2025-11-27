// Ollama automatikus beállítás helper
// Ez a fájl biztosítja, hogy az Ollama elérhető legyen

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
// Alapértelmezett: llama3.2:3b - jobb magyar nyelv támogatás, még mindig gyors
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';

export async function ensureOllamaReady(): Promise<boolean> {
  try {
    // Ellenőrzi, hogy az Ollama elérhető-e
    const response = await fetch(`${OLLAMA_URL}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    });
    
    if (!response.ok) {
      return false;
    }

    // Ellenőrzi, hogy a modell letöltve van-e
    const data = await response.json();
    const hasModel = data.models?.some(
      (m: any) => m.name === OLLAMA_MODEL || m.name.startsWith(`${OLLAMA_MODEL}:`)
    );

    if (!hasModel) {
      // Automatikusan letölti a modellt
      console.log(`📥 Ollama modell letöltése: ${OLLAMA_MODEL}...`);
      try {
        const pullResponse = await fetch(`${OLLAMA_URL}/api/pull`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: OLLAMA_MODEL,
            stream: false,
          }),
          signal: AbortSignal.timeout(300000), // 5 perc timeout a letöltéshez
        });

        if (pullResponse.ok) {
          console.log(`✅ Ollama modell letöltve: ${OLLAMA_MODEL}`);
          return true;
        }
      } catch (error) {
        console.error('Hiba a modell letöltése során:', error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Ollama elérhetőségi hiba:', error);
    return false;
  }
}

