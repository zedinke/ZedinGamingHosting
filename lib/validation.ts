/**
 * Validációs segédfüggvények
 */

import { z } from 'zod';
import { createValidationError } from './error-handler';

/**
 * Email validáció
 */
export const emailSchema = z.string().email('Érvénytelen email cím');

/**
 * Jelszó validáció
 */
export const passwordSchema = z
  .string()
  .min(8, 'A jelszónak legalább 8 karakter hosszúnak kell lennie')
  .regex(/[a-z]/, 'A jelszónak tartalmaznia kell kisbetűt')
  .regex(/[A-Z]/, 'A jelszónak tartalmaznia kell nagybetűt')
  .regex(/[0-9]/, 'A jelszónak tartalmaznia kell számot')
  .regex(/[^a-zA-Z0-9]/, 'A jelszónak tartalmaznia kell speciális karaktert');

/**
 * Server name validáció
 */
export const serverNameSchema = z
  .string()
  .min(3, 'A szerver névnek legalább 3 karakter hosszúnak kell lennie')
  .max(50, 'A szerver név maximum 50 karakter lehet')
  .regex(/^[a-zA-Z0-9_-]+$/, 'A szerver név csak betűket, számokat, kötőjelet és aláhúzást tartalmazhat');

/**
 * Port validáció
 */
export const portSchema = z
  .number()
  .int('A portnak egész számnak kell lennie')
  .min(1024, 'A portnak legalább 1024-nek kell lennie')
  .max(65535, 'A portnak maximum 65535-nek kell lennie');

/**
 * Max players validáció
 */
export const maxPlayersSchema = z
  .number()
  .int('A játékosok számának egész számnak kell lennie')
  .min(1, 'Legalább 1 játékosnak kell lennie')
  .max(1000, 'Maximum 1000 játékos lehet');

/**
 * Validálás és hiba kezelés
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  fieldName: string = 'data'
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw createValidationError(
        fieldName,
        firstError.message || 'Validációs hiba'
      );
    }
    throw error;
  }
}

/**
 * Safe parse (nem dob hibát)
 */
export function safeParse<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const firstError = result.error.errors[0];
  return {
    success: false,
    error: firstError.message || 'Validációs hiba',
  };
}

