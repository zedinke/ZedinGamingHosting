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
  if (!process.env.WEBHOOK_SECRET) {
    warnings.push('WEBHOOK_SECRET nincs beállítva - webhookok nem lesznek teljesen biztonságosak');
  }

  // Production környezet ellenőrzése
  if (process.env.NODE_ENV === 'production') {
    if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.startsWith('https://')) {
      warnings.push('Production környezetben a NEXTAUTH_URL-nek HTTPS-t kell használnia');
    }

    if (!process.env.WEBHOOK_SECRET) {
      errors.push('Production környezetben a WEBHOOK_SECRET kötelező');
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
 * Ha production-ben van hiba, dobjon hibát
 */
export function validateAndLogEnvironment(): void {
  const result = validateEnvironment();

  if (result.errors.length > 0) {
    console.error('❌ Környezeti változók validálási hibák:');
    result.errors.forEach((error) => {
      console.error(`   - ${error}`);
    });

    if (process.env.NODE_ENV === 'production') {
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

