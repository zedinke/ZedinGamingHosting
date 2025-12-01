import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getInstalledModules, getAvailableModules, installModule, uninstallModule } from '@/lib/module-manager';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Nincs bejelentkezve' }, { status: 401 });
    }

    const installed = await getInstalledModules();
    const available = getAvailableModules();

    return NextResponse.json({
      installed,
      available,
    });
  } catch (error) {
    console.error('Modules API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Nincs bejelentkezve' }, { status: 401 });
    }

    const body = await request.json();
    const { moduleName, config } = body;

    if (!moduleName || !config) {
      return NextResponse.json({ error: 'Hiányzó adatok' }, { status: 400 });
    }

    const result = await installModule(moduleName, config);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Modul sikeresen telepítve',
    });
  } catch (error) {
    console.error('Module installation API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Nincs bejelentkezve' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const moduleName = searchParams.get('moduleName');

    if (!moduleName) {
      return NextResponse.json({ error: 'Modul név megadása kötelező' }, { status: 400 });
    }

    const result = await uninstallModule(moduleName);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Modul sikeresen eltávolítva',
    });
  } catch (error) {
    console.error('Module uninstallation API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

