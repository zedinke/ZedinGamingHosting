import { prisma } from './prisma';

export async function isMaintenanceMode(): Promise<boolean> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'maintenance_mode' },
    });
    return setting?.value === 'true';
  } catch {
    return false;
  }
}

export async function getMaintenanceMessage(): Promise<string | null> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'maintenance_message' },
    });
    return setting?.value || null;
  } catch {
    return null;
  }
}

