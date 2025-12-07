import { readFileSync } from 'fs';
import { join } from 'path';

type TranslationKey = string;
type Translations = Record<string, any>;

// Érvényes locale-ok listája
const VALID_LOCALES = ['hu', 'en', 'es'];

// Fordítások betöltése
function loadTranslations(locale: string, namespace: string = 'common'): Translations {
  // Ellenőrizzük, hogy a locale érvényes-e (pl. favicon.ico ne legyen locale)
  if (!VALID_LOCALES.includes(locale)) {
    // Ha nem érvényes locale, próbáljuk meg az angol verziót
    try {
      const fallbackPath = join(process.cwd(), 'public', 'locales', 'en', `${namespace}.json`);
      const fallbackContents = readFileSync(fallbackPath, 'utf-8');
      return JSON.parse(fallbackContents);
    } catch {
      return {};
    }
  }

  try {
    const filePath = join(process.cwd(), 'public', 'locales', locale, `${namespace}.json`);
    
    // Ellenőrizzük, hogy a fájl létezik-e
    try {
      const fileContents = readFileSync(filePath, 'utf-8');
      return JSON.parse(fileContents);
    } catch (fileError: any) {
      // Ha a fájl nem létezik, próbáljuk meg az angol verziót
      if (locale !== 'en') {
        try {
          const fallbackPath = join(process.cwd(), 'public', 'locales', 'en', `${namespace}.json`);
          const fallbackContents = readFileSync(fallbackPath, 'utf-8');
          return JSON.parse(fallbackContents);
        } catch {
          // Ha az angol sem létezik, üres objektum
          return {};
        }
      } else {
        return {};
      }
    }
  } catch (error) {
    // Csak akkor logoljuk, ha valódi hiba van, ne a favicon.ico-t
    if (VALID_LOCALES.includes(locale)) {
      console.error(`Failed to load translations for ${locale}/${namespace}:`, error);
    }
    return {};
  }
}

// Nested key támogatás (pl. "nav.home")
function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((current, key) => current?.[key], obj) || path;
}

// Server-side translation hook
export function getTranslations(locale: string, namespace: string = 'common') {
  try {
    const translations = loadTranslations(locale, namespace);
    
    return function t(key: TranslationKey): string {
      try {
        const value = getNestedValue(translations, key);
        return value || key;
      } catch (error) {
        console.error(`Translation error for key "${key}":`, error);
        return key;
      }
    };
  } catch (error) {
    console.error(`Error in getTranslations for ${locale}/${namespace}:`, error);
    // Fallback function
    return function t(key: TranslationKey): string {
      return key;
    };
  }
}

// Client-side translation hook (csak client komponensekben használd)
export function useClientTranslations(locale: string, namespace: string = 'common') {
  // Ez csak client-side működik, dinamikusan tölti be a fordításokat
  // A client komponensekben használd
  return function t(key: TranslationKey): string {
    // Client-side implementáció később
    return key;
  };
}
