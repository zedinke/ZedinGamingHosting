// Client-side translations loader
export async function loadTranslations(locale: string, namespace: string = 'common') {
  try {
    const response = await fetch(`/locales/${locale}/${namespace}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load translations: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to load translations for ${locale}/${namespace}:`, error);
    return {};
  }
}

export function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((current, key) => current?.[key], obj) || path;
}

