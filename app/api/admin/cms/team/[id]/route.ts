import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const teamMemberSchema = z.object({
  name: z.string().min(1, 'Név megadása kötelező'),
  role: z.string().min(1, 'Pozíció megadása kötelező'),
  bio: z.string().optional(),
  avatar: z.string().url().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  socialLinks: z.record(z.string()).optional(),
  isActive: z.boolean(),
  order: z.number().int().min(0),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 });
    }

    const { id } = await params;
    const teamMember = await prisma.teamMember.findUnique({
      where: { id },
    });

    if (!teamMember) {
      return NextResponse.json({ error: 'Csapat tag nem található' }, { status: 404 });
    }

    return NextResponse.json(teamMember);
  } catch (error) {
    console.error('Team member fetch error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a csapat tag lekérése során' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = teamMemberSchema.parse(body);

    const teamMember = await prisma.teamMember.update({
      where: { id },
      data: {
        name: data.name,
        role: data.role,
        bio: data.bio || null,
        avatar: data.avatar || null,
        email: data.email || null,
        socialLinks: data.socialLinks ? (data.socialLinks as any) : null,
        isActive: data.isActive,
        order: data.order,
      },
    });

    return NextResponse.json(teamMember);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Érvénytelen adatok', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Team member update error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a csapat tag frissítése során' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 });
    }

    const { id } = await params;
    await prisma.teamMember.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Team member delete error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a csapat tag törlése során' },
      { status: 500 }
    );
  }
}

