/**
 * AI Server Agent
 * 
 * Szerver gépeken fut, proaktív monitoring, hibakeresés, optimalizálás.
 * Erőforrás optimalizált: nagyobb modell is mehet (32 mag, 256GB RAM)
 */

import { logger } from '@/lib/logger';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
// Szerver gépen nagyobb modell is mehet (32 mag, 256GB RAM)
// De alapértelmezetten használjuk a könnyűt is a sebesség miatt
const AI_MODEL = process.env.AI_SERVER_MODEL || process.env.OLLAMA_MODEL || 'llama3.2:3b';

interface SystemMetrics {
  cpu: number;
  ram: number;
  disk: number;
  networkIn: number;
  networkOut: number;
  processes: number;
  uptime: number;
}

interface SystemIssue {
  severity: 'critical' | 'warning' | 'info';
  type: 'resource' | 'performance' | 'security' | 'error';
  message: string;
  suggestion: string;
  autoFixable: boolean;
}

/**
 * Rendszer elemzése AI-val
 */
export async function analyzeSystem(
  metrics: SystemMetrics,
  logs?: string[]
): Promise<{ issues: SystemIssue[]; recommendations: string[]; confidence: number }> {
  try {
    logger.info('AI rendszer elemzés indítása');

    const metricsText = `
CPU használat: ${metrics.cpu}%
RAM használat: ${metrics.ram}%
Disk használat: ${metrics.disk}%
Network In: ${metrics.networkIn} MB
Network Out: ${metrics.networkOut} MB
Processes: ${metrics.processes}
Uptime: ${metrics.uptime} másodperc
`;

    const logsText = logs && logs.length > 0 
      ? `\nUtolsó log bejegyzések:\n${logs.slice(-20).join('\n')}`
      : '';

    const systemPrompt = `Te egy tapasztalt system administrator vagy. Elemezd a szerver metrikákat és logokat.

Válaszolj JSON formátumban:
{
  "issues": [
    {
      "severity": "critical|warning|info",
      "type": "resource|performance|security|error",
      "message": "Probléma leírása",
      "suggestion": "Hogyan javítsd",
      "autoFixable": true/false
    }
  ],
  "recommendations": ["javaslat1", "javaslat2"],
  "confidence": 0.0-1.0
}`;

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Metrikák:\n${metricsText}${logsText}` },
        ],
        stream: false,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      throw new Error(`Ollama API hiba: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.message?.content || '{}';

    let jsonStr = aiResponse;
    const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || 
                      aiResponse.match(/```\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const result = JSON.parse(jsonStr);

    logger.info('AI rendszer elemzés befejezve', { 
      issues: result.issues?.length || 0,
      confidence: result.confidence 
    });

    return result;
  } catch (error: any) {
    logger.error('AI rendszer elemzés hiba', error);
    throw error;
  }
}

/**
 * Konfiguráció optimalizálás javaslatok
 */
export async function optimizeConfig(
  configType: string,
  currentConfig: string,
  metrics: SystemMetrics
): Promise<{ optimized: string; changes: string[]; expectedImprovement: string }> {
  try {
    logger.info('AI konfiguráció optimalizálás', { configType });

    const systemPrompt = `Te egy tapasztalt system optimizer vagy. Optimalizáld a következő konfigurációt a metrikák alapján.

Válaszolj JSON formátumban:
{
  "optimized": "Optimalizált konfiguráció",
  "changes": ["változás1", "változás2"],
  "expectedImprovement": "Várható javulás leírása"
}`;

    const metricsText = `
CPU: ${metrics.cpu}%
RAM: ${metrics.ram}%
Disk: ${metrics.disk}%
`;

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Konfiguráció típus: ${configType}\n\nJelenlegi konfig:\n\`\`\`\n${currentConfig}\n\`\`\`\n\nMetrikák:\n${metricsText}` },
        ],
        stream: false,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      throw new Error(`Ollama API hiba: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.message?.content || '{}';

    let jsonStr = aiResponse;
    const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || 
                      aiResponse.match(/```\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const result = JSON.parse(jsonStr);

    logger.info('AI konfiguráció optimalizálás befejezve', { configType });
    return result;
  } catch (error: any) {
    logger.error('AI konfiguráció optimalizálás hiba', error, { configType });
    throw error;
  }
}

/**
 * Prediktív karbantartás
 */
export async function predictMaintenance(
  metrics: SystemMetrics,
  history: SystemMetrics[]
): Promise<{ predictions: Array<{ issue: string; probability: number; timeframe: string }> }> {
  try {
    logger.info('AI prediktív karbantartás');

    const historyText = history.slice(-10).map((m, i) => 
      `${i + 1}. CPU: ${m.cpu}%, RAM: ${m.ram}%, Disk: ${m.disk}%`
    ).join('\n');

    const systemPrompt = `Te egy tapasztalt system analyst vagy. Jósold meg a lehetséges problémákat a metrika trendek alapján.

Válaszolj JSON formátumban:
{
  "predictions": [
    {
      "issue": "Lehetséges probléma",
      "probability": 0.0-1.0,
      "timeframe": "mikor várható (pl. '1-2 nap', '1 hét')"
    }
  ]
}`;

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Jelenlegi metrikák:\nCPU: ${metrics.cpu}%, RAM: ${metrics.ram}%, Disk: ${metrics.disk}%\n\nElőzmények:\n${historyText}` },
        ],
        stream: false,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      throw new Error(`Ollama API hiba: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.message?.content || '{}';

    let jsonStr = aiResponse;
    const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || 
                      aiResponse.match(/```\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const result = JSON.parse(jsonStr);

    logger.info('AI prediktív karbantartás befejezve', { 
      predictions: result.predictions?.length || 0 
    });

    return result;
  } catch (error: any) {
    logger.error('AI prediktív karbantartás hiba', error);
    throw error;
  }
}

/**
 * Automatikus javítás javaslatok alapján
 */
export async function suggestAutoFix(
  issue: SystemIssue,
  systemInfo: any
): Promise<{ fix: string; commands: string[]; rollback?: string }> {
  try {
    logger.info('AI automatikus javítás javaslat', { issue: issue.message });

    const systemPrompt = `Te egy tapasztalt system administrator vagy. Javasolj automatikus javítást.

Válaszolj JSON formátumban:
{
  "fix": "Mit csinál a javítás",
  "commands": ["parancs1", "parancs2"],
  "rollback": "Visszavonás parancsok (opcionális)"
}`;

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Probléma: ${issue.message}\nTípus: ${issue.type}\nSúlyosság: ${issue.severity}\nJavaslat: ${issue.suggestion}\n\nRendszer info: ${JSON.stringify(systemInfo)}` },
        ],
        stream: false,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      throw new Error(`Ollama API hiba: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.message?.content || '{}';

    let jsonStr = aiResponse;
    const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || 
                      aiResponse.match(/```\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const result = JSON.parse(jsonStr);

    logger.info('AI automatikus javítás javaslat kész', { issue: issue.message });
    return result;
  } catch (error: any) {
    logger.error('AI automatikus javítás javaslat hiba', error);
    throw error;
  }
}

