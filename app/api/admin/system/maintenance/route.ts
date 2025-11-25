import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { createAuditLog, AuditAction } from '@/lib/audit-log';

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
    const { enabled } = body;

    await prisma.setting.upsert({
      where: { key: 'maintenance_mode' },
      update: { value: enabled ? 'true' : 'false' },
      create: {
        key: 'maintenance_mode',
        value: enabled ? 'true' : 'false',
      },
    });

    // Audit log
    await createAuditLog({
      userId: (session.user as any).id,
      action: AuditAction.MAINTENANCE_MODE,
      resourceType: 'System',
      details: {
        enabled,
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      maintenanceMode: enabled,
    });
  } catch (error) {
    console.error('Maintenance mode error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a karbantartási mód beállítása során' },
      { status: 500 }
    );
  }
}

