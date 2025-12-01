import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { activateLicense } from '@/lib/license-validator';
import { normalizeLicenseKey } from '@/lib/license-generator';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Nincs bejelentkezve' }, { status: 401 });
    }

    const body = await request.json();
    const { licenseKey } = body;

    if (!licenseKey) {
      return NextResponse.json({ error: 'License key megadása kötelező' }, { status: 400 });
    }

    // License key normalizálása
    const normalizedKey = normalizeLicenseKey(licenseKey);
    if (!normalizedKey) {
      return NextResponse.json({ error: 'Érvénytelen license key formátum' }, { status: 400 });
    }

    // Installation ID generálása (egyszeri, egyedi)
    const installationId = crypto.randomBytes(16).toString('hex');

    // License aktiválása
    const result = await activateLicense(normalizedKey, installationId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'License sikeresen aktiválva',
    });
  } catch (error) {
    console.error('License activation API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

