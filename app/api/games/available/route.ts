import { NextResponse } from 'next/server';
import { GameType } from '@prisma/client';

// GameType címkék magyar és angol nyelven
const getGameTypeLabels = (): Array<{ value: GameType; label: string }> => {
  const labels: Partial<Record<GameType, string>> = {
    // ARK játékok
    ARK_EVOLVED: 'ARK: Survival Evolved',
    ARK_ASCENDED: 'ARK: Survival Ascended',
    
    // Survival játékok
    MINECRAFT: 'Minecraft',
    RUST: 'Rust',
    VALHEIM: 'Valheim',
    SEVEN_DAYS_TO_DIE: '7 Days to Die',
    CONAN_EXILES: 'Conan Exiles',
    DAYZ: 'DayZ',
    PROJECT_ZOMBOID: 'Project Zomboid',
    PALWORLD: 'Palworld',
    ENSHROUDED: 'Enshrouded',
    SONS_OF_THE_FOREST: "Sons of the Forest",
    THE_FOREST: 'The Forest',
    GROUNDED: 'Grounded',
    V_RISING: 'V Rising',
    DONT_STARVE_TOGETHER: "Don't Starve Together",
    
    // FPS játékok
    CS2: 'Counter-Strike 2',
    CSGO: 'Counter-Strike: Global Offensive',
    LEFT_4_DEAD_2: 'Left 4 Dead 2',
    KILLING_FLOOR_2: 'Killing Floor 2',
    INSURGENCY_SANDSTORM: 'Insurgency: Sandstorm',
    SQUAD: 'Squad',
    HELL_LET_LOOSE: 'Hell Let Loose',
    POST_SCRIPTUM: 'Post Scriptum',
    ARMA_3: 'Arma 3',
    
    // Sandbox játékok
    TERRARIA: 'Terraria',
    STARBOUND: 'Starbound',
    FACTORIO: 'Factorio',
    SATISFACTORY: 'Satisfactory',
    SPACE_ENGINEERS: 'Space Engineers',
    GARRYS_MOD: "Garry's Mod",
    UNTURNED: 'Unturned',
    
    // MOBA
    DOTA_2: 'Dota 2',
    
    // További játékok
    TEAM_FORTRESS_2: 'Team Fortress 2',
    HALF_LIFE_2_DEATHMATCH: 'Half-Life 2: Deathmatch',
    COUNTER_STRIKE_SOURCE: 'Counter-Strike: Source',
    DAY_OF_DEFEAT_SOURCE: 'Day of Defeat: Source',
    PORTAL_2: 'Portal 2',
    LEFT_4_DEAD: 'Left 4 Dead',
    DEAD_BY_DAYLIGHT: 'Dead by Daylight',
    READY_OR_NOT: 'Ready or Not',
    HELLDIVERS_2: 'Helldivers 2',
    WAR_THUNDER: 'War Thunder',
    DESTINY_2: 'Destiny 2',
    STARDEW_VALLEY: 'Stardew Valley',
    FORZA_HORIZON_5: 'Forza Horizon 5',
    BLACK_MYTH_WUKONG: 'Black Myth: Wukong',
    BATTLEFIELD_2042: 'Battlefield 2042',
    CALL_OF_DUTY_WARZONE: 'Call of Duty: Warzone',
    COD_WARZONE_2: 'Call of Duty: Warzone 2',
    COD_MODERN_WARFARE_2024: 'Call of Duty: Modern Warfare 2024',
    COD_BLACK_OPS_6: 'Call of Duty: Black Ops 6',
    COD_COLD_WAR: 'Call of Duty: Cold War',
    COD_VANGUARD: 'Call of Duty: Vanguard',
    COD_INFINITE_WARFARE: 'Call of Duty: Infinite Warfare',
    APEX_LEGENDS: 'Apex Legends',
    PUBG_BATTLEGROUNDS: 'PUBG: Battlegrounds',
    ELDEN_RING: 'Elden Ring',
    RED_DEAD_REDEMPTION_2: 'Red Dead Redemption 2',
    BALDURS_GATE_3: "Baldur's Gate 3",
    CYBERPUNK_2077: 'Cyberpunk 2077',
    DEAD_ISLAND_2: 'Dead Island 2',
    DYING_LIGHT_2: 'Dying Light 2',
    THE_LAST_OF_US: 'The Last of Us',
    HORIZON_ZERO_DAWN: 'Horizon Zero Dawn',
    GOD_OF_WAR: 'God of War',
    SPIDER_MAN: 'Spider-Man',
    GHOST_OF_TSUSHIMA: 'Ghost of Tsushima',
    DEATH_STRANDING: 'Death Stranding',
    
    // Egyéb
    OTHER: 'Egyéb',
  };

  // Visszaadjuk az összes GameType-ot címkékkel, rendezve címke szerint
  // Csak azokat adjuk vissza, amelyeknek van label-je
  return Object.entries(labels)
    .filter(([_, label]) => label !== undefined)
    .map(([value, label]) => ({
      value: value as GameType,
      label: label!,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
};

export async function GET() {
  try {
    const gameTypes = getGameTypeLabels();
    
    return NextResponse.json({
      success: true,
      gameTypes,
    });
  } catch (error: any) {
    console.error('Get available games error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Hiba az elérhető játékok lekérése során',
        gameTypes: [],
      },
      { status: 500 }
    );
  }
}

