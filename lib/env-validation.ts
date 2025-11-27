/**
 * Környezeti változók validálása az alkalmazás indításakor
 * Ez biztosítja, hogy a kritikus beállítások megvannak
 */

interface EnvValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validálja a kötelező környezeti változókat
 */
export function validateEnvironment(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Kötelező változók
  const required = {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  };

  // Kötelező változók ellenőrzése
  for (const [key, value] of Object.entries(required)) {
    if (!value || value.trim() === '') {
      errors.push(`${key} nincs beállítva vagy üres`);
    }
  }

  // NEXTAUTH_SECRET erősség ellenőrzése
  if (process.env.NEXTAUTH_SECRET) {
    if (process.env.NEXTAUTH_SECRET.length < 32) {
      warnings.push('NEXTAUTH_SECRET túl rövid (legalább 32 karakter ajánlott)');
    }
  }

  // OAuth provider-ek ellenőrzése (ha be vannak állítva, akkor mindkettő kell)
  const hasGoogleClientId = !!process.env.GOOGLE_CLIENT_ID;
  const hasGoogleSecret = !!process.env.GOOGLE_CLIENT_SECRET;
  if (hasGoogleClientId !== hasGoogleSecret) {
    warnings.push('Google OAuth részben beállítva - vagy mindkettő, vagy egyik sem');
  }

  const hasDiscordClientId = !!process.env.DISCORD_CLIENT_ID;
  const hasDiscordSecret = !!process.env.DISCORD_CLIENT_SECRET;
  if (hasDiscordClientId !== hasDiscordSecret) {
    warnings.push('Discord OAuth részben beállítva - vagy mindkettő, vagy egyik sem');
  }

  // Webhook secret ellenőrzése (ajánlott, de nem kötelező)
  // Megjegyzés: A webhook endpointokban van ellenőrzés, ha nincs WEBHOOK_SECRET, akkor hibát dobnak
  // Ezért itt csak warning, nem error
  if (!process.env.WEBHOOK_SECRET) {
    warnings.push('WEBHOOK_SECRET nincs beállítva - webhookok nem lesznek teljesen biztonságosak (ha használod a webhook funkciót, állítsd be)');
  }

  // Production környezet ellenőrzése
  if (process.env.NODE_ENV === 'production') {
    if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.startsWith('https://')) {
      warnings.push('Production környezetben a NEXTAUTH_URL-nek HTTPS-t kell használnia');
    }

    // WEBHOOK_SECRET csak warning, nem error, mert opcionális funkció
    if (!process.env.WEBHOOK_SECRET) {
      warnings.push('Production környezetben ajánlott a WEBHOOK_SECRET beállítása webhook biztonsághoz');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validálja a környezeti változókat és logolja az eredményt
 * Build időben nem dob hibát, csak runtime-ban
 */
export function validateAndLogEnvironment(): void {
  // Build időben ne futtassuk a validációt (Next.js build process)
  const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                       process.env.NEXT_PHASE === 'phase-development-build';
  
  if (isBuildTime) {
    // Build időben csak alapvető ellenőrzés, nem dobunk hibát
    return;
  }

  const result = validateEnvironment();

  if (result.errors.length > 0) {
    console.error('❌ Környezeti változók validálási hibák:');
    result.errors.forEach((error) => {
      console.error(`   - ${error}`);
    });

    // Csak runtime-ban, production-ben dobunk hibát
    // Build időben ne, mert akkor még nincs minden környezeti változó beállítva
    if (process.env.NODE_ENV === 'production' && !isBuildTime) {
      // Csak akkor dobunk hibát, ha ténylegesen fut az alkalmazás
      // Ne build időben
      throw new Error('Kritikus környezeti változók hiányoznak. Az alkalmazás nem indítható.');
    }
  }

  if (result.warnings.length > 0) {
    console.warn('⚠️  Környezeti változók figyelmeztetések:');
    result.warnings.forEach((warning) => {
      console.warn(`   - ${warning}`);
    });
  }

  if (result.valid && result.warnings.length === 0) {
    console.log('✅ Környezeti változók validálva');
  }
}

