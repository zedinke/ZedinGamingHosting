import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { isMaintenanceMode } from '@/lib/maintenance';
import { UserRole } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const maintenance = await isMaintenanceMode();
    
    if (!maintenance) {
      return NextResponse.json({ allowed: true });
    }

    // Ha karbantartás van, ellenőrizzük, hogy admin-e
    const session = await getServerSession(authOptions);
    const isAdmin = session && (session.user as any)?.role === UserRole.ADMIN;

    return NextResponse.json({
      allowed: isAdmin,
      maintenanceMode: true,
    });
  } catch (error) {
    console.error('Maintenance session check error:', error);
    return NextResponse.json({ allowed: false, maintenanceMode: true });
  }
}

