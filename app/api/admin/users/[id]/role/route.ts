import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { createAuditLog, AuditAction } from '@/lib/audit-log';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const { id } = resolvedParams;
    const body = await request.json();
    const { role } = body;

    // Validate role
    if (!Object.values(UserRole).includes(role)) {
      return NextResponse.json(
        { error: 'Érvénytelen szerepkör' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Felhasználó nem található' },
        { status: 404 }
      );
    }

    // Prevent changing own role
    if (user.id === (session.user as any).id) {
      return NextResponse.json(
        { error: 'Nem változtathatod meg a saját szerepkörödet' },
        { status: 400 }
      );
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    // Create audit log
    await createAuditLog({
      userId: (session.user as any).id,
      action: AuditAction.UPDATE,
      resourceType: 'User',
      resourceId: id,
      details: {
        field: 'role',
        oldValue: user.role,
        newValue: role,
        targetUser: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update user role error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a szerepkör frissítése során' },
      { status: 500 }
    );
  }
}

