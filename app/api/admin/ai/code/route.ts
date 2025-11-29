import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { generateCode, autoFixCode, writeCodeFile, restoreBackup } from '@/lib/ai/code-writer';

/**
 * AI Kód írás/javítás
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, filePath, prompt, code, issues, context, useWebSearch } = body;
    const userId = (session.user as any).id;

    if (!action) {
      return NextResponse.json(
        { error: 'Művelet megadása kötelező' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'generate':
        if (!prompt) {
          return NextResponse.json(
            { error: 'Prompt megadása kötelező' },
            { status: 400 }
          );
        }
        result = await generateCode(prompt, filePath, context, useWebSearch || false, userId);
        break;

      case 'fix':
        if (!filePath || !issues) {
          return NextResponse.json(
            { error: 'Fájl elérési út és problémák megadása kötelező' },
            { status: 400 }
          );
        }
        result = await autoFixCode(filePath, issues, useWebSearch || false, userId);
        break;

      case 'write':
        if (!filePath || !code) {
          return NextResponse.json(
            { error: 'Fájl elérési út és kód megadása kötelező' },
            { status: 400 }
          );
        }
        result = await writeCodeFile(filePath, code, userId);
        break;

      case 'restore':
        if (!body.backupPath || !filePath) {
          return NextResponse.json(
            { error: 'Backup elérési út és fájl elérési út megadása kötelező' },
            { status: 400 }
          );
        }
        await restoreBackup(body.backupPath, filePath);
        result = { success: true, message: 'Backup visszaállítva' };
        break;

      default:
        return NextResponse.json(
          { error: 'Érvénytelen művelet' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('AI code action error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Hiba történt a művelet során',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}


