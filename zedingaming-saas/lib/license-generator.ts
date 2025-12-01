import crypto from 'crypto';

/**
 * License Key generáló rendszer
 * Formátum: ZED-XXXX-XXXX-XXXX-XXXX (20 karakter + kötőjelek)
 */
export function generateLicenseKey(): string {
  // 16 random hex karakter (8 byte)
  const randomBytes = crypto.randomBytes(8);
  const hexString = randomBytes.toString('hex').toUpperCase();
  
  // Formátum: ZED-XXXX-XXXX-XXXX-XXXX
  const formatted = `ZED-${hexString.slice(0, 4)}-${hexString.slice(4, 8)}-${hexString.slice(8, 12)}-${hexString.slice(12, 16)}`;
  
  return formatted;
}

/**
 * License Key validálás
 */
export function validateLicenseKey(licenseKey: string): boolean {
  // Formátum ellenőrzés: ZED-XXXX-XXXX-XXXX-XXXX
  const pattern = /^ZED-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/;
  return pattern.test(licenseKey);
}

/**
 * License Key hash generálás (SHA256)
 * Használható validációhoz vagy titkosításhoz
 */
export function hashLicenseKey(licenseKey: string): string {
  return crypto.createHash('sha256').update(licenseKey).digest('hex');
}

/**
 * License Key formátum ellenőrzés és normalizálás
 */
export function normalizeLicenseKey(licenseKey: string): string | null {
  // Eltávolítjuk a szóközöket és nagybetűssé alakítjuk
  const normalized = licenseKey.replace(/\s+/g, '').toUpperCase();
  
  if (validateLicenseKey(normalized)) {
    return normalized;
  }
  
  return null;
}

