import { NextResponse } from 'next/server';
import { isMaintenanceMode } from '@/lib/maintenance';

export async function GET() {
  try {
    const maintenance = await isMaintenanceMode();
    return NextResponse.json({
      maintenanceMode: maintenance,
    });
  } catch {
    return NextResponse.json({
      maintenanceMode: false,
    });
  }
}

