import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { analyzeCode, generateTests, findBugsFromLogs, suggestFixes, reviewCode } from '@/lib/ai/development-assistant';

/**
 * AI Kód elemzés
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
    const { type, filePath, logContent, context, issues } = body;
    const userId = (session.user as any).id;

    if (!type) {
      return NextResponse.json(
        { error: 'Típus megadása kötelező' },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case 'analyze':
        if (!filePath) {
          return NextResponse.json(
            { error: 'Fájl elérési út megadása kötelező' },
            { status: 400 }
          );
        }
        result = await analyzeCode(filePath, userId);
        break;

      case 'test':
        if (!filePath) {
          return NextResponse.json(
            { error: 'Fájl elérési út megadása kötelező' },
            { status: 400 }
          );
        }
        result = await generateTests(filePath, userId);
        break;

      case 'bugs':
        if (!logContent) {
          return NextResponse.json(
            { error: 'Log tartalom megadása kötelező' },
            { status: 400 }
          );
        }
        result = await findBugsFromLogs(logContent, context, userId);
        break;

      case 'fixes':
        if (!filePath || !issues) {
          return NextResponse.json(
            { error: 'Fájl elérési út és problémák megadása kötelező' },
            { status: 400 }
          );
        }
        result = await suggestFixes(filePath, issues, userId);
        break;

      case 'review':
        if (!filePath) {
          return NextResponse.json(
            { error: 'Fájl elérési út megadása kötelező' },
            { status: 400 }
          );
        }
        result = await reviewCode(filePath, userId);
        break;

      default:
        return NextResponse.json(
          { error: 'Érvénytelen típus' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('AI analyze error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Hiba történt az elemzés során',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}










