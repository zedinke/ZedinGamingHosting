/**
 * Seed script: Rust Mod Marketplace
 * Minta modul adatok betöltése az adatbázisba
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SEED_MODS = [
  {
    name: 'admin_radar',
    displayName: 'Admin Radar',
    description: 'Valósidejű játékos elhelyezkedés radar az adminisztrátorok számára',
    author: 'RustPlugins',
    version: '1.2.3',
    category: 'Admin',
    price: 4.99,
    downloadUrl: 'https://example.com/mods/admin_radar.zip',
    imageUrl: 'https://via.placeholder.com/300x200?text=Admin+Radar',
    isActive: true,
    isFeatured: true,
  },
  {
    name: 'furnace_splitter',
    displayName: 'Furnace Splitter',
    description: 'Külön olvasztókemencék az olvasztóprocesszhez',
    author: 'OxidePlugins',
    version: '1.0.0',
    category: 'Utility',
    price: 0,
    downloadUrl: 'https://example.com/mods/furnace_splitter.zip',
    imageUrl: 'https://via.placeholder.com/300x200?text=Furnace+Splitter',
    isActive: true,
    isFeatured: false,
  },
  {
    name: 'no_decay',
    displayName: 'No Decay',
    description: 'Kikapcsolja az épületek leromlását',
    author: 'RustCommunity',
    version: '2.1.0',
    category: 'Building',
    price: 2.99,
    downloadUrl: 'https://example.com/mods/no_decay.zip',
    imageUrl: 'https://via.placeholder.com/300x200?text=No+Decay',
    isActive: true,
    isFeatured: true,
  },
  {
    name: 'death_notes',
    displayName: 'Death Notes',
    description: 'Bejelentkezések az играч halálának történetét az chatben',
    author: 'PluginDev',
    version: '1.5.2',
    category: 'Quality of Life',
    price: 1.99,
    downloadUrl: 'https://example.com/mods/death_notes.zip',
    imageUrl: 'https://via.placeholder.com/300x200?text=Death+Notes',
    isActive: true,
    isFeatured: false,
  },
  {
    name: 'pvp_protect',
    displayName: 'PVP Protect',
    description: 'Új játékosok időleges PVP védelemre jogosultak',
    author: 'CommunityDev',
    version: '1.8.1',
    category: 'Combat',
    price: 3.99,
    downloadUrl: 'https://example.com/mods/pvp_protect.zip',
    imageUrl: 'https://via.placeholder.com/300x200?text=PVP+Protect',
    isActive: true,
    isFeatured: true,
  },
  {
    name: 'bank_system',
    displayName: 'Bank System',
    description: 'Bankrendszer az erőforrások tárolásához és visszavonásához',
    author: 'EconomyPlugins',
    version: '2.0.0',
    category: 'Utility',
    price: 5.99,
    downloadUrl: 'https://example.com/mods/bank_system.zip',
    imageUrl: 'https://via.placeholder.com/300x200?text=Bank+System',
    isActive: true,
    isFeatured: false,
  },
  {
    name: 'teleport_system',
    displayName: 'Teleport System',
    description: 'Teleportációs rendszer a játékosok közötti utazáshoz',
    author: 'TravelPlugins',
    version: '1.3.0',
    category: 'Quality of Life',
    price: 2.49,
    downloadUrl: 'https://example.com/mods/teleport_system.zip',
    imageUrl: 'https://via.placeholder.com/300x200?text=Teleport+System',
    isActive: true,
    isFeatured: false,
  },
  {
    name: 'vote_rewards',
    displayName: 'Vote Rewards',
    description: 'Szavazási jutalmat rendszer a játékosok ösztönzésére',
    author: 'RewardSystem',
    version: '1.1.5',
    category: 'Utility',
    price: 0,
    downloadUrl: 'https://example.com/mods/vote_rewards.zip',
    imageUrl: 'https://via.placeholder.com/300x200?text=Vote+Rewards',
    isActive: true,
    isFeatured: false,
  },
  {
    name: 'skill_trees',
    displayName: 'Skill Trees',
    description: 'RPG-szerű készkészségfa rendszer a játékosok fejlesztésére',
    author: 'RPGFramework',
    version: '1.9.0',
    category: 'Quality of Life',
    price: 6.99,
    downloadUrl: 'https://example.com/mods/skill_trees.zip',
    imageUrl: 'https://via.placeholder.com/300x200?text=Skill+Trees',
    isActive: true,
    isFeatured: true,
  },
  {
    name: 'pvp_arena',
    displayName: 'PVP Arena',
    description: 'Dedikált PVP aréna a csatákhoz és versenyekhez',
    author: 'ArenaPlugins',
    version: '1.6.2',
    category: 'Combat',
    price: 4.49,
    downloadUrl: 'https://example.com/mods/pvp_arena.zip',
    imageUrl: 'https://via.placeholder.com/300x200?text=PVP+Arena',
    isActive: true,
    isFeatured: false,
  },
  {
    name: 'custom_map',
    displayName: 'Custom Map Loader',
    description: 'Egyéni térkép betöltési rendszer a szintatlan szervereknél',
    author: 'MapDesigners',
    version: '2.2.0',
    category: 'Building',
    price: 7.99,
    downloadUrl: 'https://example.com/mods/custom_map.zip',
    imageUrl: 'https://via.placeholder.com/300x200?text=Custom+Map',
    isActive: true,
    isFeatured: false,
  },
  {
    name: 'anti_cheat_pro',
    displayName: 'Anti-Cheat Pro',
    description: 'Professzionális anti-csaly rendszer a szerverhez',
    author: 'SecureGames',
    version: '3.0.1',
    category: 'Admin',
    price: 8.99,
    downloadUrl: 'https://example.com/mods/anti_cheat_pro.zip',
    imageUrl: 'https://via.placeholder.com/300x200?text=Anti-Cheat+Pro',
    isActive: true,
    isFeatured: true,
  },
];

async function seedRustMods() {
  console.log('🌱 Rust mod seed indítása...');

  try {
    // Ellenőrizze, hogy már vannak-e modulok
    const existingMods = await prisma.rustMod.count();
    
    if (existingMods > 0) {
      console.log(`✅ Már ${existingMods} mod van az adatbázisban. Kihagyás.`);
      return;
    }

    // Modul létrehozása
    const createdMods = await Promise.all(
      SEED_MODS.map((mod) =>
        prisma.rustMod.create({
          data: {
            ...mod,
            currency: 'USD',
            popularity: Math.floor(Math.random() * 1000),
            rating: parseFloat((Math.random() * 5).toFixed(1)),
          },
        })
      )
    );

    console.log(`✅ ${createdMods.length} Rust mod sikeresen feltöltve!`);
    console.log('📋 Feltöltött modulok:');
    createdMods.forEach((mod: any) => {
      console.log(`   - ${mod.displayName} (${mod.category})`);
    });
  } catch (error) {
    console.error('❌ Hiba a seed során:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedRustMods();
