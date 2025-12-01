import { prisma } from './prisma';
import { validateLicense } from './license-validator';

export interface UpdateInfo {
  available: boolean;
  currentVersion: string;
  latestVersion: string;
  updateChannel: 'stable' | 'beta' | 'alpha';
  changelog?: string;
  downloadUrl?: string;
  releaseDate?: Date;
  requiresLicense: boolean;
  licenseValid: boolean;
}

/**
 * Frissítések ellenőrzése
 */
export async function checkForUpdates(): Promise<UpdateInfo> {
  try {
    // License ellenőrzés
    const licenseCheck = await validateLicense();
    
    if (!licenseCheck.valid) {
      return {
        available: false,
        currentVersion: getCurrentVersion(),
        latestVersion: getCurrentVersion(),
        updateChannel: 'stable',
        requiresLicense: true,
        licenseValid: false,
      };
    }

    // License információ lekérése
    const license = await prisma.systemLicense.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    const updateChannel = (license?.updateChannel || 'stable') as 'stable' | 'beta' | 'alpha';
    const updateServerUrl = process.env.UPDATE_SERVER_URL || 'https://updates.zedingaming.com';

    // Update szerver API hívás
    try {
      const response = await fetch(`${updateServerUrl}/api/updates/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentVersion: getCurrentVersion(),
          updateChannel,
          licenseKey: license?.licenseKey,
          installationId: license?.installationId,
        }),
      });

      if (!response.ok) {
        throw new Error('Update server response error');
      }

      const data = await response.json();

      // Frissítjük az utolsó ellenőrzés dátumát
      if (license) {
        await prisma.systemLicense.update({
          where: { id: license.id },
          data: { lastUpdateCheck: new Date() },
        });
      }

      return {
        available: data.available || false,
        currentVersion: getCurrentVersion(),
        latestVersion: data.latestVersion || getCurrentVersion(),
        updateChannel,
        changelog: data.changelog,
        downloadUrl: data.downloadUrl,
        releaseDate: data.releaseDate ? new Date(data.releaseDate) : undefined,
        requiresLicense: true,
        licenseValid: true,
      };
    } catch (error) {
      console.error('Update server check error:', error);
      // Ha nincs elérhető update szerver, lokális ellenőrzés
      return {
        available: false,
        currentVersion: getCurrentVersion(),
        latestVersion: getCurrentVersion(),
        updateChannel,
        requiresLicense: true,
        licenseValid: true,
      };
    }
  } catch (error) {
    console.error('Update check error:', error);
    return {
      available: false,
      currentVersion: getCurrentVersion(),
      latestVersion: getCurrentVersion(),
      updateChannel: 'stable',
      requiresLicense: true,
      licenseValid: false,
    };
  }
}

/**
 * Jelenlegi verzió lekérése
 */
function getCurrentVersion(): string {
  // package.json-ból vagy környezeti változóból
  return process.env.APP_VERSION || '1.0.0';
}

/**
 * Verzió összehasonlítás
 */
export function compareVersions(version1: string, version2: string): number {
  const v1parts = version1.split('.').map(Number);
  const v2parts = version2.split('.').map(Number);

  for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
    const v1part = v1parts[i] || 0;
    const v2part = v2parts[i] || 0;

    if (v1part < v2part) return -1;
    if (v1part > v2part) return 1;
  }

  return 0;
}

/**
 * Frissítés telepítése
 */
export async function installUpdate(downloadUrl: string): Promise<{ success: boolean; error?: string }> {
  try {
    // License ellenőrzés
    const licenseCheck = await validateLicense();
    
    if (!licenseCheck.valid) {
      return {
        success: false,
        error: 'License érvénytelen vagy lejárt. Frissítés telepítése nem lehetséges.',
      };
    }

    // Itt kellene implementálni a frissítés letöltését és telepítését
    // Jelenleg csak szimuláció
    console.log('Update installation started:', downloadUrl);
    
    // TODO: Implementálni a tényleges frissítés telepítését
    // - Update fájl letöltése
    // - Backup készítése
    // - Fájlok frissítése
    // - Adatbázis migrációk futtatása
    // - Restart

    return {
      success: true,
    };
  } catch (error) {
    console.error('Update installation error:', error);
    return {
      success: false,
      error: 'Frissítés telepítési hiba',
    };
  }
}

/**
 * Automatikus frissítés ellenőrzés (cron job vagy scheduled task)
 */
export async function scheduleUpdateCheck() {
  // Ez egy háttérfolyamat lehet, ami rendszeresen ellenőrzi a frissítéseket
  const updateInfo = await checkForUpdates();
  
  if (updateInfo.available && updateInfo.licenseValid) {
    // Itt lehetne értesítést küldeni vagy automatikus frissítést indítani
    console.log('Update available:', updateInfo.latestVersion);
  }
}

