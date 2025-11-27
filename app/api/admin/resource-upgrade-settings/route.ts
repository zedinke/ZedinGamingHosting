import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { createAuditLog, AuditAction } from '@/lib/audit-log';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Olvasás minden bejelentkezett felhasználó számára elérhető
    if (!session) {
      return NextResponse.json(
        { error: 'Bejelentkezés szükséges' },
        { status: 401 }
      );
    }

    // Bővítési árak lekérése
    const [pricePerVCpuSetting, pricePerRamGBSetting, currencySetting] = await Promise.all([
      prisma.setting.findUnique({ where: { key: 'resource_upgrade_price_per_vcpu' } }),
      prisma.setting.findUnique({ where: { key: 'resource_upgrade_price_per_ram_gb' } }),
      prisma.setting.findUnique({ where: { key: 'resource_upgrade_currency' } }),
    ]);

    const settings = {
      pricePerVCpu: pricePerVCpuSetting ? parseFloat(pricePerVCpuSetting.value) : 0,
      pricePerRamGB: pricePerRamGBSetting ? parseFloat(pricePerRamGBSetting.value) : 0,
      currency: currencySetting?.value || 'HUF',
    };

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Resource upgrade settings fetch error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a beállítások lekérése során' },
      { status: 500 }
    );
  }
}

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
    const { pricePerVCpu, pricePerRamGB, currency } = body;

    // Validáció
    if (typeof pricePerVCpu !== 'number' || pricePerVCpu < 0) {
      return NextResponse.json(
        { error: 'Érvénytelen vCPU ár' },
        { status: 400 }
      );
    }

    if (typeof pricePerRamGB !== 'number' || pricePerRamGB < 0) {
      return NextResponse.json(
        { error: 'Érvénytelen RAM ár' },
        { status: 400 }
      );
    }

    if (!currency || !['HUF', 'EUR', 'USD'].includes(currency)) {
      return NextResponse.json(
        { error: 'Érvénytelen pénznem' },
        { status: 400 }
      );
    }

    // Beállítások mentése
    await Promise.all([
      prisma.setting.upsert({
        where: { key: 'resource_upgrade_price_per_vcpu' },
        update: { value: pricePerVCpu.toString() },
        create: {
          key: 'resource_upgrade_price_per_vcpu',
          value: pricePerVCpu.toString(),
          category: 'pricing',
        },
      }),
      prisma.setting.upsert({
        where: { key: 'resource_upgrade_price_per_ram_gb' },
        update: { value: pricePerRamGB.toString() },
        create: {
          key: 'resource_upgrade_price_per_ram_gb',
          value: pricePerRamGB.toString(),
          category: 'pricing',
        },
      }),
      prisma.setting.upsert({
        where: { key: 'resource_upgrade_currency' },
        update: { value: currency },
        create: {
          key: 'resource_upgrade_currency',
          value: currency,
          category: 'pricing',
        },
      }),
    ]);

    // Audit log
    await createAuditLog({
      userId: (session.user as any).id,
      action: AuditAction.UPDATE,
      resourceType: 'Setting',
      resourceId: 'resource_upgrade_settings',
      details: {
        pricePerVCpu,
        pricePerRamGB,
        currency,
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Bővítési árak sikeresen mentve',
    });
  } catch (error) {
    console.error('Resource upgrade settings save error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a beállítások mentése során' },
      { status: 500 }
    );
  }
}

