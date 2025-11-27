/**
 * AI Development Assistant
 * 
 * Segít a fejlesztésben, tesztelésben, hibakeresésben és javításban.
 * Erőforrás optimalizált: könnyű modellt használ (phi3:mini vagy tinyllama)
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { ensureOllamaReady } from '@/lib/ollama-setup';
import { readFile, readdir, stat } from 'fs/promises';
import { join, extname } from 'path';
import { searchAndFormatContext } from './web-search';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
// Könnyű modell a központi gépen (4 vCPU, 8GB RAM)
const AI_MODEL = process.env.AI_DEV_MODEL || process.env.OLLAMA_MODEL || 'phi3:mini';

/**
 * Optimalizált Ollama opciók az erőforrás hatékony használathoz
 */
function getOptimizedOllamaOptions() {
  return {
    num_predict: 512, // Maximum 512 token (közepes válaszokhoz)
    temperature: 0.7, // Alapértelmezett kreativitás
    num_ctx: 2048, // Context window mérete
    repeat_penalty: 1.1, // Ismétlés büntetés
    top_k: 40, // Top-k sampling
    top_p: 0.9, // Nucleus sampling
  };
}

interface AnalysisResult {
  issues: Array<{
    severity: 'error' | 'warning' | 'info';
    message: string;
    location?: string;
    suggestion?: string;
  }>;
  suggestions: Array<{
    type: 'refactor' | 'optimize' | 'security' | 'best-practice';
    message: string;
    code?: string;
  }>;
  confidence: number;
  [key: string]: any; // Index signature for Prisma Json compatibility
}

interface TestResult {
  tests: Array<{
    name: string;
    description: string;
    code: string;
  }>;
  coverage?: string;
}

/**
 * Kód elemzése AI-val
 */
export async function analyzeCode(
  filePath: string,
  userId?: string
): Promise<AnalysisResult> {
  try {
    logger.info('AI kód elemzés indítása', { filePath });

    // Fájl olvasása
    const content = await readFile(filePath, 'utf-8');
    const extension = extname(filePath).slice(1);

    // AI elemzés
    const ollamaReady = await ensureOllamaReady();
    if (!ollamaReady) {
      throw new Error('Ollama nem elérhető');
    }

    const systemPrompt = `Te egy tapasztalt szoftverfejlesztő vagy, aki TypeScript/JavaScript kódot elemz.
    
FELADAT: Elemezd a következő ${extension} fájlt és keresd meg:
1. Hibákat (syntax, logikai hibák)
2. Biztonsági problémákat
3. Teljesítmény problémákat
4. Best practice megsértéseket
5. Refactoring lehetőségeket

Válaszolj JSON formátumban:
{
  "issues": [
    {
      "severity": "error|warning|info",
      "message": "Hiba leírása",
      "location": "sor:oszlop vagy függvény neve",
      "suggestion": "Javasolt javítás"
    }
  ],
  "suggestions": [
    {
      "type": "refactor|optimize|security|best-practice",
      "message": "Javaslat leírása",
      "code": "Javasolt kód (opcionális)"
    }
  ],
  "confidence": 0.0-1.0
}`;

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Fájl: ${filePath}\n\nKód:\n\`\`\`${extension}\n${content}\n\`\`\`` },
        ],
        stream: false,
        options: getOptimizedOllamaOptions(),
      }),
      signal: AbortSignal.timeout(60000), // 60 másodperc timeout
    });

    if (!response.ok) {
      throw new Error(`Ollama API hiba: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.message?.content || '{}';

    // JSON kinyerése a válaszból (ha markdown kódblokkban van)
    let jsonStr = aiResponse;
    const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || 
                      aiResponse.match(/```\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const result: AnalysisResult = JSON.parse(jsonStr);

    // Eredmény mentése
    await prisma.aIAnalysis.create({
      data: {
        type: 'code',
        target: filePath,
        targetType: 'file',
        status: 'completed',
        findings: result as any,
        confidence: result.confidence,
        model: AI_MODEL,
        userId,
        completedAt: new Date(),
      },
    });

    logger.info('AI kód elemzés befejezve', { filePath, issues: result.issues.length });
    return result;
  } catch (error: any) {
    logger.error('AI kód elemzés hiba', error, { filePath });
    
    // Hiba mentése
    await prisma.aIAnalysis.create({
      data: {
        type: 'code',
        target: filePath,
        targetType: 'file',
        status: 'failed',
        error: error.message,
        userId,
      },
    });

    throw error;
  }
}

/**
 * Tesztek generálása AI-val
 */
export async function generateTests(
  filePath: string,
  userId?: string
): Promise<TestResult> {
  try {
    logger.info('AI teszt generálás indítása', { filePath });

    const content = await readFile(filePath, 'utf-8');
    const extension = extname(filePath).slice(1);

    const ollamaReady = await ensureOllamaReady();
    if (!ollamaReady) {
      throw new Error('Ollama nem elérhető');
    }

    const systemPrompt = `Te egy tapasztalt tesztfejlesztő vagy. Generálj unit teszteket a következő kódhoz.

Válaszolj JSON formátumban:
{
  "tests": [
    {
      "name": "teszt neve",
      "description": "teszt leírása",
      "code": "teszt kód"
    }
  ],
  "coverage": "lefedettség százalék (becslés)"
}`;

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Fájl: ${filePath}\n\nKód:\n\`\`\`${extension}\n${content}\n\`\`\`` },
        ],
        stream: false,
      }),
      signal: AbortSignal.timeout(120000),
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

    const result: TestResult = JSON.parse(jsonStr);

    // Task mentése
    await prisma.aITask.create({
      data: {
        type: 'test',
        target: filePath,
        targetType: 'code',
        status: 'completed',
        result: result as any,
        userId,
        completedAt: new Date(),
      },
    });

    logger.info('AI teszt generálás befejezve', { filePath, tests: result.tests.length });
    return result;
  } catch (error: any) {
    logger.error('AI teszt generálás hiba', error, { filePath });
    throw error;
  }
}

/**
 * Hibakeresés logokból
 */
export async function findBugsFromLogs(
  logContent: string,
  context?: string,
  userId?: string
): Promise<AnalysisResult> {
  try {
    logger.info('AI hibakeresés logokból');

    const ollamaReady = await ensureOllamaReady();
    if (!ollamaReady) {
      throw new Error('Ollama nem elérhető');
    }

    const systemPrompt = `Te egy tapasztalt debugger vagy. Elemezd a log fájlt és keresd meg a hibákat.

Válaszolj JSON formátumban:
{
  "issues": [
    {
      "severity": "error|warning|info",
      "message": "Hiba leírása",
      "location": "hol történt (ha van)",
      "suggestion": "Hogyan javítsd"
    }
  ],
  "suggestions": [
    {
      "type": "fix",
      "message": "Javaslat",
      "code": "Javasolt kód (ha van)"
    }
  ],
  "confidence": 0.0-1.0
}`;

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Log tartalom:\n\`\`\`\n${logContent}\n\`\`\`\n\nKontextus: ${context || 'Nincs'}` },
        ],
        stream: false,
      }),
      signal: AbortSignal.timeout(120000),
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

    const result: AnalysisResult = JSON.parse(jsonStr);

    await prisma.aIAnalysis.create({
      data: {
        type: 'error',
        target: 'logs',
        targetType: 'logs',
        status: 'completed',
        findings: result as any,
        confidence: result.confidence,
        model: AI_MODEL,
        userId,
        completedAt: new Date(),
      },
    });

    return result;
  } catch (error: any) {
    logger.error('AI hibakeresés hiba', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Automatikus javítás javaslatok alapján
 */
export async function suggestFixes(
  filePath: string,
  issues: Array<{ message: string; location?: string }>,
  userId?: string
): Promise<{ fixes: Array<{ description: string; code: string }> }> {
  try {
    logger.info('AI javítás javaslatok generálása', { filePath });

    const content = await readFile(filePath, 'utf-8');
    const extension = extname(filePath).slice(1);

    const ollamaReady = await ensureOllamaReady();
    if (!ollamaReady) {
      throw new Error('Ollama nem elérhető');
    }

    const systemPrompt = `Te egy tapasztalt fejlesztő vagy. Javasolj javításokat a következő problémákhoz.

Válaszolj JSON formátumban:
{
  "fixes": [
    {
      "description": "Mit javít",
      "code": "Javított kód részlet"
    }
  ]
}`;

    const issuesText = issues.map((i, idx) => 
      `${idx + 1}. ${i.message}${i.location ? ` (${i.location})` : ''}`
    ).join('\n');

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Fájl: ${filePath}\n\nEredeti kód:\n\`\`\`${extension}\n${content}\n\`\`\`\n\nProblémák:\n${issuesText}` },
        ],
        stream: false,
      }),
      signal: AbortSignal.timeout(120000),
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

    await prisma.aITask.create({
      data: {
        type: 'fix',
        target: filePath,
        targetType: 'code',
        status: 'completed',
        result: result as any,
        userId,
        completedAt: new Date(),
      },
    });

    return result;
  } catch (error: any) {
    logger.error('AI javítás javaslatok hiba', error, { filePath });
    throw error;
  }
}

/**
 * Kód generálása AI-val (web kereséssel, ha kell)
 */
export async function generateCodeWithAI(
  prompt: string,
  filePath?: string,
  context?: string,
  useWebSearch: boolean = false,
  userId?: string
): Promise<{ code: string; explanation: string; filePath?: string }> {
  const { generateCode } = await import('./code-writer');
  return generateCode(prompt, filePath, context, useWebSearch, userId);
}

/**
 * Automatikus kód javítás (web kereséssel, ha kell)
 */
export async function autoFixCodeWithAI(
  filePath: string,
  issues: Array<{ message: string; location?: string }>,
  useWebSearch: boolean = false,
  userId?: string
): Promise<{ success: boolean; modified: boolean; backupPath?: string; changes: string[] }> {
  const { autoFixCode } = await import('./code-writer');
  return autoFixCode(filePath, issues, useWebSearch, userId);
}

/**
 * Kód review AI-val
 */
export async function reviewCode(
  filePath: string,
  userId?: string
): Promise<{ review: string; score: number; suggestions: string[] }> {
  try {
    logger.info('AI kód review indítása', { filePath });

    const content = await readFile(filePath, 'utf-8');
    const extension = extname(filePath).slice(1);

    const ollamaReady = await ensureOllamaReady();
    if (!ollamaReady) {
      throw new Error('Ollama nem elérhető');
    }

    const systemPrompt = `Te egy tapasztalt code reviewer vagy. Végezz kód review-t.

Válaszolj JSON formátumban:
{
  "review": "Részletes review szöveg",
  "score": 0-10,
  "suggestions": ["javaslat1", "javaslat2"]
}`;

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Fájl: ${filePath}\n\nKód:\n\`\`\`${extension}\n${content}\n\`\`\`` },
        ],
        stream: false,
      }),
      signal: AbortSignal.timeout(120000),
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

    await prisma.aIAnalysis.create({
      data: {
        type: 'code',
        target: filePath,
        targetType: 'file',
        status: 'completed',
        findings: result as any,
        model: AI_MODEL,
        userId,
        completedAt: new Date(),
      },
    });

    return result;
  } catch (error: any) {
    logger.error('AI kód review hiba', error, { filePath });
    throw error;
  }
}

