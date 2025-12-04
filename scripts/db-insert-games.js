#!/usr/bin/env node

/**
 * ============================================================================
 * Database Population Script - Insert all game packages
 * ============================================================================
 */

const { v4: uuidv4 } = require('uuid');
const mysql = require('mysql2/promise');

// Database credentials
const dbConfig = {
  host: '116.203.226.140',
  user: 'ZedGamingHosting_Zedin',
  password: 'Gele007ta...',
  database: 'ZedGamingHosting_gamingportal',
};

// Game data - csak az enum-ban meglévő game type-ok
const games = [
  // ========== CALL OF DUTY - csak a WARZONE van az enum-ban ==========
  {
    gameType: 'CALL_OF_DUTY_WARZONE',
    name: 'Call of Duty: Warzone 2.0',
    nameHu: 'Call of Duty: Warzone 2.0',
    nameEn: 'Call of Duty: Warzone 2.0',
    description: 'Az ingyenes battle royale mód. Akár 150 játékos egy térképen.',
    descriptionEn: 'Free battle royale mode. Up to 150 players on one map.',
    price: 0,
    currency: 'USD',
    interval: 'month',
    image: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
    slot: 150,
    cpuCores: 6,
    ram: 8192,
    videoUrl: 'https://www.youtube.com/embed/trailer_warzone_2',
    unlimitedRam: 0,
  },

  // ========== COUNTER-STRIKE ==========
  {
    gameType: 'CS2',
    name: 'Counter-Strike 2',
    nameHu: 'Counter-Strike 2',
    nameEn: 'Counter-Strike 2',
    description: 'Az új Counter-Strike 2 szerver - CS:GO utódja. Feltöltött grafikák, új mechaniká, professzionális esports title.',
    descriptionEn: 'New Counter-Strike 2 server - CS:GO successor with enhanced graphics and new mechanics.',
    price: 4.99,
    currency: 'USD',
    interval: 'month',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&h=300',
    slot: 32,
    cpuCores: 4,
    ram: 3072,
    videoUrl: 'https://www.youtube.com/embed/trailer_cs2',
    unlimitedRam: 0,
  },
  {
    gameType: 'CSGO',
    name: 'Counter-Strike: Global Offensive',
    nameHu: 'Counter-Strike: Global Offensive',
    nameEn: 'Counter-Strike: Global Offensive',
    description: 'Counter-Strike: Global Offensive - A klasszikus esports szerver. Még aktív közösség.',
    descriptionEn: 'Counter-Strike: Global Offensive - Classic esports server with active community.',
    price: 3.99,
    currency: 'USD',
    interval: 'month',
    image: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
    slot: 32,
    cpuCores: 2,
    ram: 2048,
    videoUrl: 'https://www.youtube.com/embed/trailer_csgo',
    unlimitedRam: 0,
  },
  {
    gameType: 'COUNTER_STRIKE_SOURCE',
    name: 'Counter-Strike: Source',
    nameHu: 'Counter-Strike: Source',
    nameEn: 'Counter-Strike: Source',
    description: 'Counter-Strike: Source szerver - Klasszikus szórakoztató mód. Kis erőforrás igény.',
    descriptionEn: 'Counter-Strike: Source - Classic fun mode with low resource requirements.',
    price: 2.99,
    currency: 'USD',
    interval: 'month',
    image: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
    slot: 32,
    cpuCores: 2,
    ram: 1536,
    videoUrl: 'https://www.youtube.com/embed/trailer_cs_source',
    unlimitedRam: 0,
  },

  // ========== TOP STEAM GAMES - enum-ban meglévő ==========
  {
    gameType: 'DOTA_2',
    name: 'Dota 2',
    nameHu: 'Dota 2',
    nameEn: 'Dota 2',
    description: 'Ingyenes MOBA csodaország. 5v5 intenzív csapatok, 100+ hős, végtelenül tanulható. Esports profi szint.',
    descriptionEn: 'Free MOBA wonderland. 5v5 intense teams, 100+ heroes, infinitely learnable. Pro esports level.',
    price: 0,
    currency: 'USD',
    interval: 'month',
    image: 'https://images.unsplash.com/photo-1579356330388-a51bb0b78f6c?w=500&h=300',
    slot: 10,
    cpuCores: 2,
    ram: 2048,
    videoUrl: 'https://www.youtube.com/embed/trailer_dota2',
    unlimitedRam: 0,
  },
  {
    gameType: 'PUBG_BATTLEGROUNDS',
    name: 'PUBG: Battlegrounds',
    nameHu: 'PUBG: Battlegrounds',
    nameEn: 'PUBG: Battlegrounds',
    description: 'Battle royale klasszikus! 100 játékos egy szörnyet térképen. Loot, build, survive, win!',
    descriptionEn: 'Battle royale classic! 100 players on one huge map. Loot, build, survive, win!',
    price: 0,
    currency: 'USD',
    interval: 'month',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&h=300',
    slot: 100,
    cpuCores: 6,
    ram: 6144,
    videoUrl: 'https://www.youtube.com/embed/trailer_pubg',
    unlimitedRam: 0,
  },
  {
    gameType: 'RUST',
    name: 'Rust',
    nameHu: 'Rust',
    nameEn: 'Rust',
    description: 'Survival sandbox MMO. Túléléstől a base-buildingig. PvP, raiding, erőforrás menedzsment.',
    descriptionEn: 'Survival sandbox MMO. From survival to base-building. PvP, raiding, resource management.',
    price: 19.99,
    currency: 'USD',
    interval: 'month',
    image: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
    slot: 300,
    cpuCores: 8,
    ram: 8192,
    videoUrl: 'https://www.youtube.com/embed/trailer_rust',
    unlimitedRam: 0,
  },
  {
    gameType: 'TEAM_FORTRESS_2',
    name: 'Team Fortress 2',
    nameHu: 'Team Fortress 2',
    nameEn: 'Team Fortress 2',
    description: 'Ingyenes klasszikus FPS! 9 klasa, sokat módosított szerver. Retro gaming.',
    descriptionEn: 'Free classic FPS! 9 classes, heavily modded servers. Retro gaming.',
    price: 0,
    currency: 'USD',
    interval: 'month',
    image: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
    slot: 32,
    cpuCores: 2,
    ram: 2048,
    videoUrl: 'https://www.youtube.com/embed/trailer_tf2',
    unlimitedRam: 0,
  },
  {
    gameType: 'LEFT_4_DEAD_2',
    name: 'Left 4 Dead 2',
    nameHu: 'Left 4 Dead 2',
    nameEn: 'Left 4 Dead 2',
    description: 'Kooperatív zombie szurvaival! 4 játékos a hordák ellen. Klasszikus coop horror FPS.',
    descriptionEn: 'Cooperative zombie survival! 4 players against hordes. Classic coop horror FPS.',
    price: 9.99,
    currency: 'USD',
    interval: 'month',
    image: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
    slot: 8,
    cpuCores: 2,
    ram: 2048,
    videoUrl: 'https://www.youtube.com/embed/trailer_l4d2',
    unlimitedRam: 0,
  },
  {
    gameType: 'GARRYS_MOD',
    name: "Garry's Mod",
    nameHu: "Garry's Mod",
    nameEn: "Garry's Mod",
    description: 'Sandbox szerver - Szerverek, tűzpálya, machinima. Végtelenül módosítható.',
    descriptionEn: 'Sandbox server - Servers, firing range, machinima. Infinitely modifiable.',
    price: 9.99,
    currency: 'USD',
    interval: 'month',
    image: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
    slot: 64,
    cpuCores: 2,
    ram: 2048,
    videoUrl: 'https://www.youtube.com/embed/trailer_gmod',
    unlimitedRam: 0,
  },
  {
    gameType: 'VALHEIM',
    name: 'Valheim',
    nameHu: 'Valheim',
    nameEn: 'Valheim',
    description: 'Kooperatív Viking szurvival! Építs, harcolj, fedezz fel. Vikings a szükségletből.',
    descriptionEn: 'Cooperative Viking survival! Build, fight, explore. Vikings out of necessity.',
    price: 19.99,
    currency: 'USD',
    interval: 'month',
    image: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
    slot: 10,
    cpuCores: 2,
    ram: 2048,
    videoUrl: 'https://www.youtube.com/embed/trailer_valheim',
    unlimitedRam: 0,
  },
  {
    gameType: 'MINECRAFT',
    name: 'Minecraft Java Edition',
    nameHu: 'Minecraft Java Edition',
    nameEn: 'Minecraft Java Edition',
    description: 'Az eredeti Minecraft szerver. Survival, Creative, Adventure módok. Végtelenül módosítható.',
    descriptionEn: 'The original Minecraft server. Survival, Creative, Adventure modes. Infinitely modifiable.',
    price: 2.99,
    currency: 'USD',
    interval: 'month',
    image: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
    slot: 128,
    cpuCores: 1,
    ram: 1024,
    videoUrl: 'https://www.youtube.com/embed/trailer_minecraft',
    unlimitedRam: 0,
  },
  {
    gameType: 'FACTORIO',
    name: 'Factorio',
    nameHu: 'Factorio',
    nameEn: 'Factorio',
    description: 'Kooperatív factory szerver! Építs, optimalizálj, automat. Ipari evolúció.',
    descriptionEn: 'Cooperative factory server! Build, optimize, automate. Industrial evolution.',
    price: 24.99,
    currency: 'USD',
    interval: 'month',
    image: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
    slot: 255,
    cpuCores: 2,
    ram: 2048,
    videoUrl: 'https://www.youtube.com/embed/trailer_factorio',
    unlimitedRam: 0,
  },
  {
    gameType: 'THE_FOREST',
    name: 'The Forest',
    nameHu: 'The Forest',
    nameEn: 'The Forest',
    description: 'Kooperatív szurvival horror! Erdőben, fenyegetésekkel. Rejtélyes és félelmetes.',
    descriptionEn: 'Cooperative survival horror! In the forest with threats. Mysterious and scary.',
    price: 19.99,
    currency: 'USD',
    interval: 'month',
    image: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
    slot: 4,
    cpuCores: 4,
    ram: 4096,
    videoUrl: 'https://www.youtube.com/embed/trailer_theforest',
    unlimitedRam: 0,
  },
  {
    gameType: 'TERRARIA',
    name: 'Terraria',
    nameHu: 'Terraria',
    nameEn: 'Terraria',
    description: '2D pixel action-adventure szerver! Bányászat, craftálás, minibossok, bosses.',
    descriptionEn: '2D pixel action-adventure server! Mining, crafting, minibosses, bosses.',
    price: 14.99,
    currency: 'USD',
    interval: 'month',
    image: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
    slot: 255,
    cpuCores: 1,
    ram: 512,
    videoUrl: 'https://www.youtube.com/embed/trailer_terraria',
    unlimitedRam: 0,
  },
  {
    gameType: 'STARDEW_VALLEY',
    name: 'Stardew Valley',
    nameHu: 'Stardew Valley',
    nameEn: 'Stardew Valley',
    description: 'Kooperatív farm-sim szerver! Farmaold, halászz, bányászz, közösséggel lépj kapcsolatba.',
    descriptionEn: 'Cooperative farm-sim server! Farm, fish, mine, connect with community.',
    price: 14.99,
    currency: 'USD',
    interval: 'month',
    image: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
    slot: 4,
    cpuCores: 1,
    ram: 512,
    videoUrl: 'https://www.youtube.com/embed/trailer_stardewvalley',
    unlimitedRam: 0,
  },
  {
    gameType: 'PORTAL_2',
    name: 'Portal 2',
    nameHu: 'Portal 2',
    nameEn: 'Portal 2',
    description: 'Kooperatív puzzle-platformer! 2 robot az AI által ellenséges intézményben.',
    descriptionEn: 'Cooperative puzzle-platformer! 2 robots in AI-hostile facility.',
    price: 19.99,
    currency: 'USD',
    interval: 'month',
    image: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
    slot: 2,
    cpuCores: 2,
    ram: 2048,
    videoUrl: 'https://www.youtube.com/embed/trailer_portal2',
    unlimitedRam: 0,
  },
  {
    gameType: 'DONT_STARVE_TOGETHER',
    name: "Don't Starve Together",
    nameHu: "Don't Starve Together",
    nameEn: "Don't Starve Together",
    description: 'Kooperatív szurvival roguelike! Ismeretlen világban, sötétség és éhezés elleni harcok.',
    descriptionEn: 'Cooperative survival roguelike! Fighting darkness and hunger in unknown world.',
    price: 14.99,
    currency: 'USD',
    interval: 'month',
    image: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
    slot: 6,
    cpuCores: 2,
    ram: 1024,
    videoUrl: 'https://www.youtube.com/embed/trailer_dstaytogether',
    unlimitedRam: 0,
  },
  {
    gameType: 'SATISFACTORY',
    name: 'Satisfactory',
    nameHu: 'Satisfactory',
    nameEn: 'Satisfactory',
    description: 'Kooperatív szervezési szkalavív! Idegenbolyó, erőforrások, gyárak, automatizálás.',
    descriptionEn: 'Cooperative organisational scalaviv! Alien planet, resources, factories, automation.',
    price: 29.99,
    currency: 'USD',
    interval: 'month',
    image: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
    slot: 4,
    cpuCores: 4,
    ram: 4096,
    videoUrl: 'https://www.youtube.com/embed/trailer_satisfactory',
    unlimitedRam: 0,
  },
  {
    gameType: 'GROUNDED',
    name: 'Grounded',
    nameHu: 'Grounded',
    nameEn: 'Grounded',
    description: 'Kooperatív szurvival kaland! Szúnyog nagyságúak egy árok világában. Rejtélyes és kalandusos.',
    descriptionEn: 'Cooperative survival adventure! Tiny in a backyard world. Mysterious and adventurous.',
    price: 19.99,
    currency: 'USD',
    interval: 'month',
    image: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
    slot: 4,
    cpuCores: 4,
    ram: 4096,
    videoUrl: 'https://www.youtube.com/embed/trailer_grounded',
    unlimitedRam: 0,
  },
  {
    gameType: 'PROJECT_ZOMBOID',
    name: 'Project Zomboid',
    nameHu: 'Project Zomboid',
    nameEn: 'Project Zomboid',
    description: 'Kooperatív zombie szurvival szimulációs! Realisztikus, isometrikus, nehéz.',
    descriptionEn: 'Cooperative zombie survival simulator! Realistic, isometric, challenging.',
    price: 14.99,
    currency: 'USD',
    interval: 'month',
    image: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
    slot: 4,
    cpuCores: 2,
    ram: 2048,
    videoUrl: 'https://www.youtube.com/embed/trailer_projectzomboid',
    unlimitedRam: 0,
  },
  {
    gameType: 'READY_OR_NOT',
    name: 'Ready or Not',
    nameHu: 'Ready or Not',
    nameEn: 'Ready or Not',
    description: 'Kooperatív taktikai SWAT szimulációs! Rendőrséggel, felderítéssel, megvetéssel.',
    descriptionEn: 'Cooperative tactical SWAT simulator! Police operations, planning, breach.',
    price: 29.99,
    currency: 'USD',
    interval: 'month',
    image: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
    slot: 8,
    cpuCores: 6,
    ram: 6144,
    videoUrl: 'https://www.youtube.com/embed/trailer_readyornot',
    unlimitedRam: 0,
  },
  {
    gameType: 'KILLING_FLOOR_2',
    name: 'Killing Floor 2',
    nameHu: 'Killing Floor 2',
    nameEn: 'Killing Floor 2',
    description: 'Kooperatív zombie-apoka FPS! Wave-based, zárványok, brutális akció.',
    descriptionEn: 'Cooperative zombie-apocalypse FPS! Wave-based, Zeds, brutal action.',
    price: 14.99,
    currency: 'USD',
    interval: 'month',
    image: 'https://images.unsplash.com/photo-1538481143235-5d8e32260b2d?w=500&h=300',
    slot: 6,
    cpuCores: 4,
    ram: 4096,
    videoUrl: 'https://www.youtube.com/embed/trailer_kf2',
    unlimitedRam: 0,
  },
];

async function main() {
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✓ Database connected\n');

    // Insert games
    let inserted = 0;
    let skipped = 0;

    for (const game of games) {
      try {
        const now = new Date();
        const query = `
          INSERT INTO game_packages 
          (id, gameType, name, nameHu, nameEn, description, descriptionEn, price, currency, 
           \`interval\`, image, slot, cpuCores, ram, videoUrl, unlimitedRam, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
          uuidv4(),
          game.gameType,
          game.name,
          game.nameHu,
          game.nameEn,
          game.description,
          game.descriptionEn || game.description,
          game.price,
          game.currency,
          game.interval,
          game.image,
          game.slot,
          game.cpuCores,
          game.ram,
          game.videoUrl,
          game.unlimitedRam,
          now,
          now,
        ];

        await connection.execute(query, values);
        inserted++;
        console.log(`  ✓ ${game.name}`);
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          skipped++;
          console.log(`  ⊘ ${game.name} (already exists)`);
        } else {
          console.error(`  ✗ ${game.name}:`, err.message);
        }
      }
    }

    console.log(`\n════════════════════════════════════════════`);
    console.log(`✓ Inserted: ${inserted} games`);
    console.log(`⊘ Skipped:  ${skipped} games (duplicates)`);
    console.log(`  Total:    ${games.length} games`);
    console.log(`════════════════════════════════════════════\n`);

    // Verify
    const [result] = await connection.execute('SELECT COUNT(*) as cnt FROM game_packages');
    console.log(`Database now contains: ${result[0].cnt} game packages total`);

    await connection.end();
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

main();
