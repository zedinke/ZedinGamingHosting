/**
 * Automatikus kód írás és javítás
 * 
 * Biztonságos kód módosítás backup-pal és validációval
 */

import { readFile, writeFile, copyFile, mkdir } from 'fs/promises';
import { join, dirname, basename, extname, resolve, sep, relative } from 'path';
import { existsSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { ensureOllamaReady } from '@/lib/ollama-setup';
import { searchAndFormatContext } from './web-search';

const execAsync = promisify(exec);
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const AI_MODEL = process.env.AI_DEV_MODEL || process.env.OLLAMA_MODEL || 'phi3:mini';

// Biztonságos könyvtárak (csak ezekben lehet módosítani)
const ALLOWED_DIRECTORIES = [
  'lib',
  'app',
  'components',
  'scripts',
  'prisma',
];

// Tiltott fájlok (ezeket nem módosíthatjuk)
const FORBIDDEN_FILES = [
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'next.config.js',
  'prisma/schema.prisma', // Csak migrációval
];

/**
 * Projekt root könyvtár meghatározása
 */
function getProjectRoot(): string {
  let currentDir = process.cwd();
  
  // Ha .next/standalone-ban vagyunk, menjünk fel
  if (currentDir.includes('.next/standalone')) {
    const searchDir = resolve(currentDir, '..', '..');
    if (existsSync(join(searchDir, '.git')) && existsSync(join(searchDir, 'package.json'))) {
      return searchDir;
    }
  }
  
  // Ellenőrizzük, hogy van-e .git és package.json
  if (existsSync(join(currentDir, '.git')) && existsSync(join(currentDir, 'package.json'))) {
    return currentDir;
  }
  
  // Próbáljuk a szülő könyvtárat
  const parentDir = resolve(currentDir, '..');
  if (existsSync(join(parentDir, '.git')) && existsSync(join(parentDir, 'package.json'))) {
    return parentDir;
  }
  
  return currentDir;
}

/**
 * Biztonsági ellenőrzés - lehet-e módosítani a fájlt
 */
function isFileAllowed(filePath: string): { allowed: boolean; reason?: string } {
  const projectRoot = getProjectRoot();
  const fullPath = resolve(projectRoot, filePath);
  const relativePath = relative(projectRoot, fullPath);
  
  // Ellenőrizzük, hogy a projekt root-on belül van-e
  if (relativePath.startsWith('..')) {
    return { allowed: false, reason: 'Fájl a projekt root-on kívül van' };
  }
  
  // Ellenőrizzük a tiltott fájlokat
  const fileName = basename(relativePath);
  if (FORBIDDEN_FILES.includes(fileName) || FORBIDDEN_FILES.includes(relativePath)) {
    return { allowed: false, reason: 'Fájl a tiltott listán van' };
  }
  
  // Ellenőrizzük, hogy engedélyezett könyvtárban van-e
  const firstDir = relativePath.split(sep)[0];
  if (!ALLOWED_DIRECTORIES.includes(firstDir) && !relativePath.startsWith('.')) {
    return { allowed: false, reason: 'Könyvtár nincs az engedélyezett listán' };
  }
  
  return { allowed: true };
}

/**
 * Backup készítése fájl módosítás előtt
 */
async function createBackup(filePath: string): Promise<string> {
  const projectRoot = getProjectRoot();
  const fullPath = resolve(projectRoot, filePath);
  
  if (!existsSync(fullPath)) {
    return ''; // Nincs mit backup-olni
  }
  
  const backupDir = join(projectRoot, '.ai-backups');
  await mkdir(backupDir, { recursive: true });
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `${basename(filePath)}.${timestamp}.backup`;
  const backupPath = join(backupDir, backupFileName);
  
  await copyFile(fullPath, backupPath);
  logger.info('Backup készítve', { filePath, backupPath });
  
  return backupPath;
}

/**
 * AI-val kód generálása/javítása
 */
export async function generateCode(
  prompt: string,
  filePath?: string,
  context?: string,
  useWebSearch: boolean = false,
  userId?: string
): Promise<{ code: string; explanation: string; filePath?: string }> {
  try {
    logger.info('AI kód generálás indítása', { prompt, filePath });

    const ollamaReady = await ensureOllamaReady();
    if (!ollamaReady) {
      throw new Error('Ollama nem elérhető');
    }

    // Web keresés, ha kell
    let webContext = '';
    if (useWebSearch) {
      try {
        webContext = await searchAndFormatContext(prompt, 3);
      } catch (error) {
        logger.warn('Web keresés hiba, folytatás nélküle', error);
      }
    }

    const systemPrompt = `Te egy tapasztalt szoftverfejlesztő vagy. Generálj TypeScript/JavaScript kódot.

SZABÁLYOK:
- Használj modern TypeScript/JavaScript szintaxist
- Kövesd a best practice-eket
- Add meg a kódot tiszta, jól dokumentált formában
- Ha fájl elérési út van megadva, figyelembe veszed a meglévő kód struktúráját

Válaszolj JSON formátumban:
{
  "code": "generált kód",
  "explanation": "mit csinál a kód és miért",
  "filePath": "ajánlott fájl elérési út (ha nincs megadva)"
}`;

    const userPrompt = `${prompt}

${context ? `\nKontextus:\n${context}` : ''}
${webContext ? `\n\n${webContext}` : ''}
${filePath ? `\nFájl elérési út: ${filePath}` : ''}`;

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        stream: false,
      }),
      signal: AbortSignal.timeout(180000), // 3 perc timeout
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

    // Task mentése
    await prisma.aITask.create({
      data: {
        type: 'generate',
        target: filePath || 'new',
        targetType: 'code',
        status: 'completed',
        result: result,
        userId,
        completedAt: new Date(),
      },
    });

    logger.info('AI kód generálás befejezve', { filePath: result.filePath });
    return result;
  } catch (error: any) {
    logger.error('AI kód generálás hiba', error, { prompt, filePath });
    throw error;
  }
}

/**
 * Automatikus kód javítás
 */
export async function autoFixCode(
  filePath: string,
  issues: Array<{ message: string; location?: string }>,
  useWebSearch: boolean = false,
  userId?: string
): Promise<{ success: boolean; modified: boolean; backupPath?: string; changes: string[] }> {
  try {
    logger.info('Automatikus kód javítás indítása', { filePath });

    // Biztonsági ellenőrzés
    const securityCheck = isFileAllowed(filePath);
    if (!securityCheck.allowed) {
      throw new Error(`Fájl módosítás nem engedélyezett: ${securityCheck.reason}`);
    }

    const projectRoot = getProjectRoot();
    const fullPath = require('path').resolve(projectRoot, filePath);

    // Fájl olvasása
    let originalContent = '';
    if (existsSync(fullPath)) {
      originalContent = await readFile(fullPath, 'utf-8');
    }

    // Backup készítése
    const backupPath = await createBackup(filePath);

    // Web keresés, ha kell
    let webContext = '';
    if (useWebSearch) {
      try {
        const searchQuery = issues.map(i => i.message).join(' ');
        webContext = await searchAndFormatContext(searchQuery, 2);
      } catch (error) {
        logger.warn('Web keresés hiba, folytatás nélküle', error);
      }
    }

    // AI javítás generálása
    const ollamaReady = await ensureOllamaReady();
    if (!ollamaReady) {
      throw new Error('Ollama nem elérhető');
    }

    const extension = extname(filePath).slice(1);
    const issuesText = issues.map((i, idx) => 
      `${idx + 1}. ${i.message}${i.location ? ` (${i.location})` : ''}`
    ).join('\n');

    const systemPrompt = `Te egy tapasztalt fejlesztő vagy. Javítsd a következő problémákat a kódban.

SZABÁLYOK:
- Csak a szükséges változtatásokat végezd
- Tartsd meg a kód stílusát
- Ne változtass olyan részeken, amik nem kapcsolódnak a problémákhoz
- Használj modern TypeScript/JavaScript szintaxist

Válaszolj JSON formátumban:
{
  "fixedCode": "javított kód teljes tartalma",
  "changes": ["változás1", "változás2"],
  "explanation": "mit változtattál és miért"
}`;

    const userPrompt = `Fájl: ${filePath}

Eredeti kód:
\`\`\`${extension}
${originalContent}
\`\`\`

Problémák:
${issuesText}
${webContext ? `\n\n${webContext}` : ''}

Javítsd a problémákat, de tartsd meg a kód többi részét változatlanul.`;

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        stream: false,
      }),
      signal: AbortSignal.timeout(180000),
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

    // Könyvtár létrehozása, ha kell
    const dir = dirname(fullPath);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    // Fájl írása
    await writeFile(fullPath, result.fixedCode, 'utf-8');

    // Task mentése
    await prisma.aITask.create({
      data: {
        type: 'fix',
        target: filePath,
        targetType: 'code',
        status: 'completed',
        result: {
          changes: result.changes,
          explanation: result.explanation,
          backupPath,
        },
        userId,
        completedAt: new Date(),
      },
    });

    logger.info('Automatikus kód javítás befejezve', { filePath, changes: result.changes.length });

    return {
      success: true,
      modified: true,
      backupPath,
      changes: result.changes || [],
    };
  } catch (error: any) {
    logger.error('Automatikus kód javítás hiba', error, { filePath });
    
    // Task mentése hibával
    await prisma.aITask.create({
      data: {
        type: 'fix',
        target: filePath,
        targetType: 'code',
        status: 'failed',
        error: error.message,
        userId,
      },
    });

    throw error;
  }
}

/**
 * Fájl írása generált kóddal
 */
export async function writeCodeFile(
  filePath: string,
  code: string,
  userId?: string
): Promise<{ success: boolean; backupPath?: string }> {
  try {
    logger.info('Kód fájl írása', { filePath });

    // Biztonsági ellenőrzés
    const securityCheck = isFileAllowed(filePath);
    if (!securityCheck.allowed) {
      throw new Error(`Fájl írás nem engedélyezett: ${securityCheck.reason}`);
    }

    const projectRoot = getProjectRoot();
    const fullPath = require('path').resolve(projectRoot, filePath);

    // Backup, ha létezik
    const backupPath = existsSync(fullPath) ? await createBackup(filePath) : '';

    // Könyvtár létrehozása
    const dir = dirname(fullPath);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    // Fájl írása
    await writeFile(fullPath, code, 'utf-8');

    // Task mentése
    await prisma.aITask.create({
      data: {
        type: 'generate',
        target: filePath,
        targetType: 'code',
        status: 'completed',
        result: { written: true },
        userId,
        completedAt: new Date(),
      },
    });

    logger.info('Kód fájl írása befejezve', { filePath });
    return { success: true, backupPath };
  } catch (error: any) {
    logger.error('Kód fájl írása hiba', error, { filePath });
    throw error;
  }
}

/**
 * Backup visszaállítása
 */
export async function restoreBackup(backupPath: string, originalPath: string): Promise<void> {
  try {
    if (!existsSync(backupPath)) {
      throw new Error('Backup fájl nem található');
    }

    await copyFile(backupPath, originalPath);
    logger.info('Backup visszaállítva', { backupPath, originalPath });
  } catch (error: any) {
    logger.error('Backup visszaállítás hiba', error, { backupPath, originalPath });
    throw error;
  }
}

