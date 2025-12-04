/**
 * CurseForge API Integration for Ark Mods
 */

interface ArkMod {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  downloadUrl: string;
  fileDate: string;
  category?: string;
}

const CURSEFORGE_API_URL = 'https://api.curseforge.com/v1';

// Cache a modokat 24 órára
let modCache: { mods: ArkMod[]; timestamp: number } | null = null;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 óra

/**
 * Ark modok lekérése a CurseForge-ból
 */
export async function getArkMods(forceRefresh = false): Promise<ArkMod[]> {
  // Cache ellenőrzés
  if (modCache && !forceRefresh && Date.now() - modCache.timestamp < CACHE_TTL) {
    return modCache.mods;
  }

  try {
    // CurseForge API call - Ark Survival Evolved modok
    const response = await fetch(
      `${CURSEFORGE_API_URL}/mods/search?gameId=432&classId=6&sortBy=3`,
      {
        headers: {
          'x-api-key': process.env.CURSEFORGE_API_KEY || '',
        },
      }
    );

    if (!response.ok) {
      console.error('CurseForge API error:', response.status);
      // Return empty array, nem crashelunk
      return [];
    }

    const data = await response.json();
    
    const mods: ArkMod[] = (data.data || []).map((mod: any) => ({
      id: mod.id.toString(),
      name: mod.name,
      description: mod.summary || '',
      version: mod.latestFiles?.[0]?.displayName || mod.latestFilesIndexes?.[0]?.filename || 'Unknown',
      author: mod.authors?.[0]?.name || 'Unknown',
      downloadUrl: mod.links?.websiteUrl || '',
      fileDate: mod.latestFiles?.[0]?.fileDate || new Date().toISOString(),
      category: getCategoryName(mod.categories?.[0]?.id),
    }));

    // Cache mentése
    modCache = {
      mods,
      timestamp: Date.now(),
    };

    return mods;
  } catch (error) {
    console.error('Error fetching Ark mods from CurseForge:', error);
    return [];
  }
}

/**
 * Mod keresése ID alapján
 */
export async function getArkModById(modId: string): Promise<ArkMod | null> {
  const mods = await getArkMods();
  return mods.find((mod) => mod.id === modId) || null;
}

/**
 * Modok keresése név alapján
 */
export async function searchArkMods(query: string): Promise<ArkMod[]> {
  const mods = await getArkMods();
  const q = query.toLowerCase();
  return mods.filter(
    (mod) =>
      mod.name.toLowerCase().includes(q) ||
      mod.description.toLowerCase().includes(q) ||
      mod.author.toLowerCase().includes(q)
  );
}

/**
 * Modok kategorizálása
 */
export async function getCategorizedArkMods(): Promise<Record<string, ArkMod[]>> {
  const mods = await getArkMods();
  const categorized: Record<string, ArkMod[]> = {};

  mods.forEach((mod) => {
    const category = mod.category || 'Egyéb';
    if (!categorized[category]) {
      categorized[category] = [];
    }
    categorized[category].push(mod);
  });

  return categorized;
}

/**
 * Cache törlése
 */
export function clearModCache(): void {
  modCache = null;
}

/**
 * Kategória név lekérése
 */
function getCategoryName(categoryId?: number): string {
  const categories: Record<number, string> = {
    1: '🎮 Gameplay',
    2: '🎨 Textures',
    3: '🛠️ Tools',
    4: '✨ Cosmetics',
    5: '🔧 Mechanics',
    6: '🎯 Quality of Life',
    7: '📦 Content',
    8: '⚔️ PvP',
    9: '🏘️ Buildings',
  };

  return categories[categoryId || 0] || 'Egyéb';
}
