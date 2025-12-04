/**
 * ============================================================================
 * GAME SERVER DEFINITIONS - Call of Duty, Counter-Strike, Top 30 Steam Games
 * ============================================================================
 * 
 * Ez a fájl tartalmazza az összes szerver definícióját, képeket, trailereket
 * és adatbázis bejegyzéseket a játékokhoz.
 */

// ============================================================================
// CALL OF DUTY SERIES - Szerver definiciók
// ============================================================================

export const callOfDutyServers = {
  // Modern Warfare 2024
  modernWarfare2024: {
    gameType: 'COD_MODERN_WARFARE_2024',
    name: 'Call of Duty: Modern Warfare 2024',
    shortName: 'MW2024',
    description: 'A legújabb Call of Duty: Modern Warfare szerver - 2024-es kiadás. Intenzív multiplayer gameplay, Warzone támogatás.',
    maxPlayers: 32,
    basePrice: 9.99,
    slots: [10, 20, 32],
    resources: {
      recommended: { ram: 6144, vCPU: 4 },
      premium: { ram: 8192, vCPU: 6 }
    },
    startCommand: 'wine ./cod_server.exe +map mp_terminal +maxplayers 32 +exec server.cfg',
    stopCommand: 'stop',
    installScript: `
#!/bin/bash
# Modern Warfare 2024 server installer
mkdir -p /opt/servers/{serverId}
cd /opt/servers/{serverId}
# Steam AppID: 2149880
/usr/games/steamcmd +login anonymous +app_update 2149880 validate +quit
# Szerver konfigurálása
cat > server.cfg << 'EOFCFG'
sv_pure 1
sv_cheats 0
sv_allowdownload 1
sv_alltalk 0
EOFCFG
    `,
    youtubeTrailerId: 'trailer_mw_2024',
    imageUrl: 'https://images.unsplash.com/photo-1552820728-8ac54c3a90f7?w=500&h=300',
  },

  // Warzone 2.0
  warzone2: {
    gameType: 'COD_WARZONE_2',
    name: 'Call of Duty: Warzone 2.0',
    shortName: 'Warzone 2',
    description: 'Az ingyenes battle royale mód a Modern Warfare II-ből. Akár 150 játékos egy térképen. Nagyobb szerver igények.',
    maxPlayers: 150,
    basePrice: 0,
    slots: [50, 100, 150],
    resources: {
      recommended: { ram: 8192, vCPU: 6 },
      premium: { ram: 12288, vCPU: 8 }
    },
    startCommand: 'wine ./warzone_server.exe +maxplayers 150 +exec warzone.cfg',
    stopCommand: 'stop',
    installScript: `
#!/bin/bash
mkdir -p /opt/servers/{serverId}
cd /opt/servers/{serverId}
# Warzone 2.0 - AppID: 1958861
/usr/games/steamcmd +login anonymous +app_update 1958861 validate +quit
    `,
    youtubeTrailerId: 'trailer_warzone_2',
    imageUrl: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
  },

  // Black Ops 6
  blackOps6: {
    gameType: 'COD_BLACK_OPS_6',
    name: 'Call of Duty: Black Ops 6',
    shortName: 'BO6',
    description: 'Black Ops 6 szerver - Intenzív akció, zombik mód, multiplayer. Klasszikus CoD élmény.',
    maxPlayers: 32,
    basePrice: 8.99,
    slots: [16, 24, 32],
    resources: {
      recommended: { ram: 5120, vCPU: 4 },
      premium: { ram: 6144, vCPU: 6 }
    },
    youtubeTrailerId: 'trailer_bo6',
    imageUrl: 'https://images.unsplash.com/photo-1535307671172-3ce80c79c1f7?w=500&h=300',
  },

  // Cold War
  coldWar: {
    gameType: 'COD_COLD_WAR',
    name: 'Call of Duty: Black Ops Cold War',
    shortName: 'ColdWar',
    description: '80-as évek hangulatú multiplayer, zombik módban kooperatív gameplay.',
    maxPlayers: 32,
    basePrice: 7.99,
    slots: [12, 20, 32],
    resources: {
      recommended: { ram: 4096, vCPU: 4 },
      premium: { ram: 5120, vCPU: 6 }
    },
    youtubeTrailerId: 'trailer_coldwar',
    imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&h=300',
  },

  // Vanguard
  vanguard: {
    gameType: 'COD_VANGUARD',
    name: 'Call of Duty: Vanguard',
    shortName: 'Vanguard',
    description: 'II. világháborús Call of Duty szerver. Történelmi tematika, gyors paced multiplayer.',
    maxPlayers: 32,
    basePrice: 6.99,
    slots: [16, 24, 32],
    resources: {
      recommended: { ram: 4096, vCPU: 4 },
      premium: { ram: 5120, vCPU: 6 }
    },
    youtubeTrailerId: 'trailer_vanguard',
    imageUrl: 'https://images.unsplash.com/photo-1542751110-c2d5e1c41f15?w=500&h=300',
  },

  // Infinite Warfare
  infiniteWarfare: {
    gameType: 'COD_INFINITE_WARFARE',
    name: 'Call of Duty: Infinite Warfare',
    shortName: 'IW',
    description: 'Futurisztikus Call of Duty - űr akció, lézerfegyverek, sci-fi ambiente.',
    maxPlayers: 32,
    basePrice: 5.99,
    slots: [12, 20, 32],
    resources: {
      recommended: { ram: 4096, vCPU: 4 },
      premium: { ram: 5120, vCPU: 6 }
    },
    youtubeTrailerId: 'trailer_iw',
    imageUrl: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
  },
};

// ============================================================================
// COUNTER-STRIKE SERIES - Szerver definiciók
// ============================================================================

export const counterStrikeServers = {
  // Counter-Strike 2
  cs2: {
    gameType: 'CS2',
    name: 'Counter-Strike 2',
    shortName: 'CS2',
    description: 'Az új Counter-Strike 2 szerver - CS:GO utódja. Feltöltött grafikák, új mechaniká, professzionális esports title.',
    maxPlayers: 32,
    basePrice: 4.99,
    slots: [10, 16, 32],
    resources: {
      recommended: { ram: 3072, vCPU: 4 },
      premium: { ram: 4096, vCPU: 6 }
    },
    startCommand: './srcds_run -game csgo -console -usercon +game_type 0 +game_mode 1 +mapgroup mg_active +map de_dust2 +maxplayers 32',
    stopCommand: 'exit',
    installScript: `
#!/bin/bash
mkdir -p /opt/servers/{serverId}
cd /opt/servers/{serverId}
# Counter-Strike 2 - AppID: 730
/usr/games/steamcmd +login anonymous +app_update 730 validate +quit
    `,
    youtubeTrailerId: 'trailer_cs2',
    imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&h=300',
  },

  // CS:GO (Legacy)
  csgo: {
    gameType: 'CSGO',
    name: 'Counter-Strike: Global Offensive (Legacy)',
    shortName: 'CS:GO',
    description: 'Counter-Strike: Global Offensive - A klasszikus esports szerver. Még aktív közösség.',
    maxPlayers: 32,
    basePrice: 3.99,
    slots: [10, 16, 32],
    resources: {
      recommended: { ram: 2048, vCPU: 2 },
      premium: { ram: 3072, vCPU: 4 }
    },
    youtubeTrailerId: 'trailer_csgo',
    imageUrl: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
  },

  // Counter-Strike: Source
  csSource: {
    gameType: 'CS_SOURCE',
    name: 'Counter-Strike: Source',
    shortName: 'CS:S',
    description: 'Counter-Strike: Source szerver - Klasszikus szórakoztató mód. Kis erőforrás igény, barát közösség.',
    maxPlayers: 32,
    basePrice: 2.99,
    slots: [16, 24, 32],
    resources: {
      recommended: { ram: 1536, vCPU: 2 },
      premium: { ram: 2048, vCPU: 4 }
    },
    youtubeTrailerId: 'trailer_cs_source',
    imageUrl: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
  },

  // Counter-Strike 1.6
  cs16: {
    gameType: 'CS_1_6',
    name: 'Counter-Strike 1.6',
    shortName: 'CS 1.6',
    description: 'Counter-Strike 1.6 szerver - Az eredeti Counter-Strike! Nosztalgikus gaming, aktív modding közösség.',
    maxPlayers: 32,
    basePrice: 1.99,
    slots: [16, 24, 32],
    resources: {
      recommended: { ram: 512, vCPU: 1 },
      premium: { ram: 1024, vCPU: 2 }
    },
    youtubeTrailerId: 'trailer_cs16',
    imageUrl: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
  },
};

// ============================================================================
// TOP 30 STEAM GAMES - Szerver definiciók
// ============================================================================

export const top30SteamGames = {
  // 1. Dota 2
  dota2: {
    gameType: 'DOTA_2',
    name: 'Dota 2',
    shortName: 'Dota 2',
    description: 'Ingyenes MOBA csodaország. 5v5 intenzív csapatok, 100+ hős, végtelenül tanulható. Esports profi szint.',
    maxPlayers: 10,
    basePrice: 0,
    slots: [5, 10],
    resources: {
      recommended: { ram: 2048, vCPU: 2 },
      premium: { ram: 3072, vCPU: 4 }
    },
    youtubeTrailerId: 'trailer_dota2',
    imageUrl: 'https://images.unsplash.com/photo-1579356330388-a51bb0b78f6c?w=500&h=300',
  },

  // 2. PUBG: Battlegrounds
  pubg: {
    gameType: 'PUBG',
    name: 'PUBG: Battlegrounds',
    shortName: 'PUBG',
    description: 'Battle royale klasszikus! 100 játékos egy szörnyet térképen. Loot, build, survive, win!',
    maxPlayers: 100,
    basePrice: 0,
    slots: [50, 100],
    resources: {
      recommended: { ram: 6144, vCPU: 6 },
      premium: { ram: 8192, vCPU: 8 }
    },
    youtubeTrailerId: 'trailer_pubg',
    imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&h=300',
  },

  // 3. Rust
  rust: {
    gameType: 'RUST',
    name: 'Rust',
    shortName: 'Rust',
    description: 'Survival sandbox MMO. Túléléstől a base-buildingig. PvP, raiding, erőforrás menedzsment. Intenzív gameplay.',
    maxPlayers: 300,
    basePrice: 19.99,
    slots: [50, 100, 200, 300],
    resources: {
      recommended: { ram: 8192, vCPU: 8 },
      premium: { ram: 16384, vCPU: 16 }
    },
    youtubeTrailerId: 'trailer_rust',
    imageUrl: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
  },

  // 4. Team Fortress 2
  tf2: {
    gameType: 'TF2',
    name: 'Team Fortress 2',
    shortName: 'TF2',
    description: 'Ingyenes klasszikus FPS! 9 klasa, sokat módosított szerver. Retro gaming, közösség-vezérelt.',
    maxPlayers: 32,
    basePrice: 0,
    slots: [12, 20, 32],
    resources: {
      recommended: { ram: 2048, vCPU: 2 },
      premium: { ram: 3072, vCPU: 4 }
    },
    youtubeTrailerId: 'trailer_tf2',
    imageUrl: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
  },

  // 5. Left 4 Dead 2
  left4Dead2: {
    gameType: 'L4D2',
    name: 'Left 4 Dead 2',
    shortName: 'L4D2',
    description: 'Kooperatív zombie szurvaival! 4 játékos a hordák ellen. Klasszikus coop horror FPS.',
    maxPlayers: 8,
    basePrice: 9.99,
    slots: [4, 8],
    resources: {
      recommended: { ram: 2048, vCPU: 2 },
      premium: { ram: 3072, vCPU: 4 }
    },
    youtubeTrailerId: 'trailer_l4d2',
    imageUrl: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
  },

  // 6. Garry's Mod
  garrysmod: {
    gameType: 'GARRYSMOD',
    name: "Garry's Mod",
    shortName: 'Gmod',
    description: 'Sandbox szerver - Szerverek, tűzpálya, machinima. Végtelenül módosítható, kreatív közösség.',
    maxPlayers: 64,
    basePrice: 9.99,
    slots: [16, 32, 64],
    resources: {
      recommended: { ram: 2048, vCPU: 2 },
      premium: { ram: 4096, vCPU: 4 }
    },
    youtubeTrailerId: 'trailer_gmod',
    imageUrl: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
  },

  // 7. Valheim
  valheim: {
    gameType: 'VALHEIM',
    name: 'Valheim',
    shortName: 'Valheim',
    description: 'Kooperatív Viking szurvial! Építs, harcolj, fedezz fel. Vikings a szükségletből.',
    maxPlayers: 10,
    basePrice: 19.99,
    slots: [4, 6, 10],
    resources: {
      recommended: { ram: 2048, vCPU: 2 },
      premium: { ram: 3072, vCPU: 4 }
    },
    youtubeTrailerId: 'trailer_valheim',
    imageUrl: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
  },

  // 8. Minecraft Java Edition
  minecraftJava: {
    gameType: 'MINECRAFT_JAVA',
    name: 'Minecraft Java Edition',
    shortName: 'Minecraft Java',
    description: 'Az eredeti Minecraft szerver. Survival, Creative, Adventure módok. Végtelenül módosítható.',
    maxPlayers: 128,
    basePrice: 2.99,
    slots: [10, 32, 64, 128],
    resources: {
      recommended: { ram: 1024, vCPU: 1 },
      premium: { ram: 2048, vCPU: 2 }
    },
    youtubeTrailerId: 'trailer_minecraft',
    imageUrl: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
  },

  // 9. ARK: Survival Evolved (már létezik - skippe)
  // 10. Factorio
  factorio: {
    gameType: 'FACTORIO',
    name: 'Factorio',
    shortName: 'Factorio',
    description: 'Kooperatív factory szerver! Építs, optimalizálj, automat. Ipari evolúció.',
    maxPlayers: 255,
    basePrice: 24.99,
    slots: [4, 8, 16, 32],
    resources: {
      recommended: { ram: 2048, vCPU: 2 },
      premium: { ram: 4096, vCPU: 4 }
    },
    youtubeTrailerId: 'trailer_factorio',
    imageUrl: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
  },

  // 11. The Forest
  theForest: {
    gameType: 'THE_FOREST',
    name: 'The Forest',
    shortName: 'The Forest',
    description: 'Kooperatív szurvival horror! Erdőben, fenyegetésekkel. Rejtélyes és félelmetes.',
    maxPlayers: 4,
    basePrice: 19.99,
    slots: [2, 4],
    resources: {
      recommended: { ram: 4096, vCPU: 4 },
      premium: { ram: 6144, vCPU: 6 }
    },
    youtubeTrailerId: 'trailer_theforest',
    imageUrl: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
  },

  // 12. Terraria
  terraria: {
    gameType: 'TERRARIA',
    name: 'Terraria',
    shortName: 'Terraria',
    description: '2D pixel action-adventure szerver! Bányászat, craftálás, minibossok, bosses.',
    maxPlayers: 255,
    basePrice: 14.99,
    slots: [4, 8, 16, 32],
    resources: {
      recommended: { ram: 512, vCPU: 1 },
      premium: { ram: 1024, vCPU: 2 }
    },
    youtubeTrailerId: 'trailer_terraria',
    imageUrl: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
  },

  // 13. Stardew Valley
  stardewValley: {
    gameType: 'STARDEW_VALLEY',
    name: 'Stardew Valley',
    shortName: 'Stardew Valley',
    description: 'Kooperatív farm-sim szerver! Farmaold, halászz, bányászz, közösséggel lépj kapcsolatba.',
    maxPlayers: 4,
    basePrice: 14.99,
    slots: [2, 4],
    resources: {
      recommended: { ram: 512, vCPU: 1 },
      premium: { ram: 1024, vCPU: 2 }
    },
    youtubeTrailerId: 'trailer_stardewvalley',
    imageUrl: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
  },

  // 14. Portal 2
  portal2: {
    gameType: 'PORTAL_2',
    name: 'Portal 2',
    shortName: 'Portal 2',
    description: 'Kooperatív puzzle-platformer! 2 robot az AI által ellenséges intézményben.',
    maxPlayers: 2,
    basePrice: 19.99,
    slots: [2],
    resources: {
      recommended: { ram: 2048, vCPU: 2 },
      premium: { ram: 3072, vCPU: 4 }
    },
    youtubeTrailerId: 'trailer_portal2',
    imageUrl: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
  },

  // 15. Don't Starve Together
  dontStarveTogether: {
    gameType: 'DONT_STARVE_TOGETHER',
    name: "Don't Starve Together",
    shortName: 'DST',
    description: 'Kooperatív szurvival roguelike! Ismeretlen világban, sötétség és éhezés elleni harcok.',
    maxPlayers: 6,
    basePrice: 14.99,
    slots: [2, 4, 6],
    resources: {
      recommended: { ram: 1024, vCPU: 2 },
      premium: { ram: 2048, vCPU: 4 }
    },
    youtubeTrailerId: 'trailer_dstaytogether',
    imageUrl: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
  },

  // 16. Satisfactory
  satisfactory: {
    gameType: 'SATISFACTORY',
    name: 'Satisfactory',
    shortName: 'Satisfactory',
    description: 'Kooperatív szervezési szkalavív! Idegenbolyó, erőforrások, gyárak, automatizálás.',
    maxPlayers: 4,
    basePrice: 29.99,
    slots: [2, 4],
    resources: {
      recommended: { ram: 4096, vCPU: 4 },
      premium: { ram: 8192, vCPU: 8 }
    },
    youtubeTrailerId: 'trailer_satisfactory',
    imageUrl: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
  },

  // 17. Grounded
  grounded: {
    gameType: 'GROUNDED',
    name: 'Grounded',
    shortName: 'Grounded',
    description: 'Kooperatív szurvival kaland! Szúnyog nagyságúak egy árok világában. Rejtélyes és kalandusos.',
    maxPlayers: 4,
    basePrice: 19.99,
    slots: [2, 4],
    resources: {
      recommended: { ram: 4096, vCPU: 4 },
      premium: { ram: 8192, vCPU: 8 }
    },
    youtubeTrailerId: 'trailer_grounded',
    imageUrl: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
  },

  // 18. Subnautica
  subnautica: {
    gameType: 'SUBNAUTICA',
    name: 'Subnautica',
    shortName: 'Subnautica',
    description: 'Tengeri szurvival abentúra! Víz alatti bolygó felfedezése, alapépítés, rejtélyesen.',
    maxPlayers: 1,
    basePrice: 24.99,
    slots: [1],
    resources: {
      recommended: { ram: 4096, vCPU: 4 },
      premium: { ram: 8192, vCPU: 8 }
    },
    youtubeTrailerId: 'trailer_subnautica',
    imageUrl: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
  },

  // 19. Deep Rock Galactic
  deepRockGalactic: {
    gameType: 'DEEP_ROCK_GALACTIC',
    name: 'Deep Rock Galactic',
    shortName: 'DRG',
    description: 'Kooperatív kőzet-bányászat akció! Dwarf kőzethöz, robotokhoz, felderítéshez.',
    maxPlayers: 4,
    basePrice: 29.99,
    slots: [2, 3, 4],
    resources: {
      recommended: { ram: 2048, vCPU: 4 },
      premium: { ram: 4096, vCPU: 6 }
    },
    youtubeTrailerId: 'trailer_drg',
    imageUrl: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
  },

  // 20. Project Zomboid
  projectZomboid: {
    gameType: 'PROJECT_ZOMBOID',
    name: 'Project Zomboid',
    shortName: 'PZ',
    description: 'Kooperatív zombie szurvival szimulációs! Realisztikus, isometrikus, nehéz.',
    maxPlayers: 4,
    basePrice: 14.99,
    slots: [2, 3, 4],
    resources: {
      recommended: { ram: 2048, vCPU: 2 },
      premium: { ram: 4096, vCPU: 4 }
    },
    youtubeTrailerId: 'trailer_projectzomboid',
    imageUrl: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
  },

  // 21. Lethal Company
  lethalCompany: {
    gameType: 'LETHAL_COMPANY',
    name: 'Lethal Company',
    shortName: 'Lethal Co.',
    description: 'Kooperatív sci-fi horror! Cég megbízásaiból dolgozz, de vigyázz az összeomlás-okra.',
    maxPlayers: 4,
    basePrice: 7.99,
    slots: [2, 3, 4],
    resources: {
      recommended: { ram: 2048, vCPU: 2 },
      premium: { ram: 3072, vCPU: 4 }
    },
    youtubeTrailerId: 'trailer_lethalcompany',
    imageUrl: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
  },

  // 22. Phasmophobia
  phasmophobia: {
    gameType: 'PHASMOPHOBIA',
    name: 'Phasmophobia',
    shortName: 'Phasmo',
    description: 'Kooperatív szellem-hunting horror! Szellemi nyomozók legyek, bizonyítékot gyűjtsd.',
    maxPlayers: 4,
    basePrice: 13.99,
    slots: [2, 3, 4],
    resources: {
      recommended: { ram: 4096, vCPU: 4 },
      premium: { ram: 8192, vCPU: 8 }
    },
    youtubeTrailerId: 'trailer_phasmophobia',
    imageUrl: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
  },

  // 23. It Takes Two
  itTakesTwo: {
    gameType: 'IT_TAKES_TWO',
    name: 'It Takes Two',
    shortName: 'It Takes Two',
    description: 'Kooperatív splitscreen kaland! Párok játékának szövegében, szereteted visszaállítani.',
    maxPlayers: 2,
    basePrice: 29.99,
    slots: [2],
    resources: {
      recommended: { ram: 4096, vCPU: 4 },
      premium: { ram: 8192, vCPU: 8 }
    },
    youtubeTrailerId: 'trailer_ittakestwo',
    imageUrl: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
  },

  // 24. A Way Out
  aWayOut: {
    gameType: 'A_WAY_OUT',
    name: 'A Way Out',
    shortName: 'A Way Out',
    description: 'Kooperatív börtön-szökési thriller! Két rab szabadulási kaland.',
    maxPlayers: 2,
    basePrice: 19.99,
    slots: [2],
    resources: {
      recommended: { ram: 4096, vCPU: 4 },
      premium: { ram: 8192, vCPU: 8 }
    },
    youtubeTrailerId: 'trailer_awayout',
    imageUrl: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
  },

  // 25. Raft
  raft: {
    gameType: 'RAFT',
    name: 'Raft',
    shortName: 'Raft',
    description: 'Kooperatív tengeri szurvival! Óceán közepén, összeomló világban, zátonyon laktak.',
    maxPlayers: 4,
    basePrice: 19.99,
    slots: [2, 3, 4],
    resources: {
      recommended: { ram: 2048, vCPU: 2 },
      premium: { ram: 4096, vCPU: 4 }
    },
    youtubeTrailerId: 'trailer_raft',
    imageUrl: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
  },

  // 26. Core Keeper
  coreKeeper: {
    gameType: 'CORE_KEEPER',
    name: 'Core Keeper',
    shortName: 'Core Keeper',
    description: 'Kooperatív 2D bányászás-abentúra! Apró személyeknél, föld alatt, szörnyekhez, kincshez.',
    maxPlayers: 8,
    basePrice: 9.99,
    slots: [2, 4, 8],
    resources: {
      recommended: { ram: 1024, vCPU: 2 },
      premium: { ram: 2048, vCPU: 4 }
    },
    youtubeTrailerId: 'trailer_corekeeper',
    imageUrl: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
  },

  // 27. Paleo Pines
  paleoPines: {
    gameType: 'PALEO_PINES',
    name: 'Paleo Pines',
    shortName: 'Paleo Pines',
    description: 'Kooperatív farm-sim dinoszauruszokkal! Dinók gondozása, farmaság, közösség.',
    maxPlayers: 4,
    basePrice: 19.99,
    slots: [2, 3, 4],
    resources: {
      recommended: { ram: 2048, vCPU: 2 },
      premium: { ram: 3072, vCPU: 4 }
    },
    youtubeTrailerId: 'trailer_paleopines',
    imageUrl: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
  },

  // 28. Spiritfarer
  spiritfarer: {
    gameType: 'SPIRITFARER',
    name: 'Spiritfarer',
    shortName: 'Spiritfarer',
    description: 'Kooperatív hand-drawn kaland! Hajóvezetőjként, lelkek szállítása a halál után.',
    maxPlayers: 2,
    basePrice: 19.99,
    slots: [2],
    resources: {
      recommended: { ram: 2048, vCPU: 2 },
      premium: { ram: 3072, vCPU: 4 }
    },
    youtubeTrailerId: 'trailer_spiritfarer',
    imageUrl: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
  },

  // 29. Grounded (já volt - skippe)
  // 30. Ready or Not
  readyOrNot: {
    gameType: 'READY_OR_NOT',
    name: 'Ready or Not',
    shortName: 'Ready or Not',
    description: 'Kooperatív taktikai SWAT szimulációs! Rendőrséggel, felderítéssel, megvetéssel.',
    maxPlayers: 8,
    basePrice: 29.99,
    slots: [4, 6, 8],
    resources: {
      recommended: { ram: 6144, vCPU: 6 },
      premium: { ram: 8192, vCPU: 8 }
    },
    youtubeTrailerId: 'trailer_readyornot',
    imageUrl: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
  },

  // 30. Grounded (alternative) - Killing Floor 2
  killingFloor2: {
    gameType: 'KILLING_FLOOR_2',
    name: 'Killing Floor 2',
    shortName: 'KF2',
    description: 'Kooperatív zombie-apoka FPS! Wave-based, zárványok, brutális akció.',
    maxPlayers: 6,
    basePrice: 14.99,
    slots: [3, 4, 6],
    resources: {
      recommended: { ram: 4096, vCPU: 4 },
      premium: { ram: 6144, vCPU: 6 }
    },
    youtubeTrailerId: 'trailer_kf2',
    imageUrl: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
  },
};

// ============================================================================
// EXPORT
// ============================================================================

export const allGameServers = {
  ...callOfDutyServers,
  ...counterStrikeServers,
  ...top30SteamGames,
};

export default allGameServers;
