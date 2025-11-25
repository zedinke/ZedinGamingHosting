import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// GET - Backup storage beállítások
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    const storageType = await prisma.setting.findUnique({
      where: { key: 'backup_storage_type' },
    });

    return NextResponse.json({
      success: true,
      storageType: storageType?.value || 'local',
      config: {
        s3: {
          bucket: process.env.AWS_S3_BUCKET || '',
          region: process.env.AWS_REGION || '',
        },
        ftp: {
          host: process.env.FTP_HOST || '',
          port: process.env.FTP_PORT || '21',
          secure: process.env.FTP_SECURE === 'true',
        },
      },
    });
  } catch (error) {
    console.error('Get backup storage config error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a beállítások lekérdezése során' },
      { status: 500 }
    );
  }
}

// POST - Backup storage beállítások frissítése
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
    const { storageType } = body;

    if (!['local', 's3', 'ftp'].includes(storageType)) {
      return NextResponse.json(
        { error: 'Érvénytelen storage típus' },
        { status: 400 }
      );
    }

    await prisma.setting.upsert({
      where: { key: 'backup_storage_type' },
      create: {
        key: 'backup_storage_type',
        value: storageType,
        category: 'backup',
      },
      update: {
        value: storageType,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Backup storage beállítások frissítve',
    });
  } catch (error) {
    console.error('Update backup storage config error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a beállítások frissítése során' },
      { status: 500 }
    );
  }
}

