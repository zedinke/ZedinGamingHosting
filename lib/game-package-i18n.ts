// Helper functions for localized game package data

export function getLocalizedGamePackageName(
  packageData: {
    name?: string | null;
    nameHu?: string | null;
    nameEn?: string | null;
  },
  locale: string
): string {
  if (locale === 'hu') {
    return packageData.nameHu || packageData.name || '';
  }
  return packageData.nameEn || packageData.name || '';
}

export function getLocalizedGamePackageDescription(
  packageData: {
    description?: string | null;
    descriptionHu?: string | null;
    descriptionEn?: string | null;
  },
  locale: string
): string | null {
  if (locale === 'hu') {
    return packageData.descriptionHu || packageData.description || null;
  }
  return packageData.descriptionEn || packageData.description || null;
}

