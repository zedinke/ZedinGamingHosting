import { PrismaClient } from '@prisma/client';
import { differenceInDays } from 'date-fns';

const prisma = new PrismaClient();

export interface LicenseValidationResult {
  valid: boolean;
  expired: boolean;
  expiringSoon: boolean;
  remainingDays: number;
  license?: {
    id: string;
    licenseKey: string;
    licenseType: string;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    maxUsers: number | null;
    maxServers: number | null;
  };
  error?: string;
}

/**
 * License validálása
 */
export async function validateLicense(): Promise<LicenseValidationResult> {
  try {
    const license = await prisma.systemLicense.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!license) {
      return {
        valid: false,
        expired: true,
        expiringSoon: false,
        remainingDays: 0,
        error: 'Nincs aktív license',
      };
    }

    const now = new Date();
    const endDate = new Date(license.endDate);
    const remainingDays = differenceInDays(endDate, now);
    const expired = now > endDate;
    const expiringSoon = remainingDays <= 7 && remainingDays > 0;

    return {
      valid: !expired && license.isActive,
      expired,
      expiringSoon,
      remainingDays: Math.max(0, remainingDays),
      license: {
        id: license.id,
        licenseKey: license.licenseKey,
        licenseType: license.licenseType,
        startDate: license.startDate,
        endDate: license.endDate,
        isActive: license.isActive,
        maxUsers: license.maxUsers,
        maxServers: license.maxServers,
      },
    };
  } catch (error) {
    console.error('License validation error:', error);
    return {
      valid: false,
      expired: true,
      expiringSoon: false,
      remainingDays: 0,
      error: 'License ellenőrzési hiba',
    };
  }
}

/**
 * License aktiválása license key alapján
 */
export async function activateLicense(
  licenseKey: string,
  installationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Itt kellene egy API hívás a license szerverhez
    // Jelenleg csak lokális validációt csinálunk
    
    // Alapvető formátum ellenőrzés
    const licenseKeyRegex = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    if (!licenseKeyRegex.test(licenseKey)) {
      return {
        success: false,
        error: 'Érvénytelen license key formátum',
      };
    }

    // Ellenőrizzük, hogy már létezik-e ez a license
    const existingLicense = await prisma.systemLicense.findUnique({
      where: { licenseKey },
    });

    if (existingLicense) {
      // Frissítjük az installation ID-t
      await prisma.systemLicense.update({
        where: { licenseKey },
        data: {
          installationId,
          isActive: true,
        },
      });
      return { success: true };
    }

    // Új license létrehozása (jelenleg csak lokális, később API-ból kellene)
    // Ideiglenesen egy próba license-t hozunk létre
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // 30 nap próba

    await prisma.systemLicense.create({
      data: {
        licenseKey,
        installationId,
        startDate,
        endDate,
        isActive: true,
        isTrial: true,
        licenseType: 'TRIAL',
        maxUsers: null, // Korlátlan
        maxServers: null, // Korlátlan
      },
    });

    return { success: true };
  } catch (error) {
    console.error('License activation error:', error);
    return {
      success: false,
      error: 'License aktiválási hiba',
    };
  }
}

/**
 * License ellenőrzése API hívással (ha van license szerver)
 */
async function validateLicenseWithServer(licenseKey: string): Promise<boolean> {
  const licenseServerUrl = process.env.LICENSE_SERVER_URL;
  const licenseApiKey = process.env.LICENSE_API_KEY;

  if (!licenseServerUrl || !licenseApiKey) {
    // Nincs license szerver, lokális validáció
    return true;
  }

  try {
    const response = await fetch(`${licenseServerUrl}/api/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${licenseApiKey}`,
      },
      body: JSON.stringify({ licenseKey }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.valid === true;
  } catch (error) {
    console.error('License server validation error:', error);
    return false;
  }
}

