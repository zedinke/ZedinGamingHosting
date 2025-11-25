import { readFileSync } from 'fs';
import { join } from 'path';

type TranslationKey = string;
type Translations = Record<string, any>;

// Fordítások betöltése
function loadTranslations(locale: string, namespace: string = 'common'): Translations {
  try {
    const filePath = join(process.cwd(), 'public', 'locales', locale, `${namespace}.json`);
    const fileContents = readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.error(`Failed to load translations for ${locale}/${namespace}:`, error);
    return {};
  }
}

// Nested key támogatás (pl. "nav.home")
function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((current, key) => current?.[key], obj) || path;
}

// Server-side translation hook
export function getTranslations(locale: string, namespace: string = 'common') {
  const translations = loadTranslations(locale, namespace);
  
  return function t(key: TranslationKey): string {
    return getNestedValue(translations, key);
  };
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
