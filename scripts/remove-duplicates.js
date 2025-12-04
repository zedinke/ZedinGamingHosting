#!/usr/bin/env node

const mysql = require('mysql2/promise');

const dbConfig = {
  host: '116.203.226.140',
  user: 'ZedGamingHosting_Zedin',
  password: 'Gele007ta...',
  database: 'ZedGamingHosting_gamingportal',
};

async function main() {
  const conn = await mysql.createConnection(dbConfig);
  
  console.log('Duplikátumok tisztítása...\n');
  
  // Duplikált gameType-ok listája
  const duplicates = [
    'VALHEIM', 'RUST', 'THE_FOREST', 'SATISFACTORY', 'PROJECT_ZOMBOID', 
    'GROUNDED', 'DONT_STARVE_TOGETHER', 'CS2', 'CSGO', 'KILLING_FLOOR_2',
    'TERRARIA', 'FACTORIO', 'DOTA_2', 'PORTAL_2', 'READY_OR_NOT', 'STARDEW_VALLEY'
  ];
  
  let totalDeleted = 0;
  
  for (const gameType of duplicates) {
    // Lekérdezem az összes ID-t, ORDER BY createdAt
    const [rows] = await conn.execute(`
      SELECT id FROM game_packages 
      WHERE gameType = ? 
      ORDER BY createdAt ASC
    `, [gameType]);
    
    if (rows.length > 1) {
      // Az első (legrégebbi) kivételével minden törlödik
      const toDelete = rows.slice(0, rows.length - 1);
      
      for (const row of toDelete) {
        await conn.execute('DELETE FROM game_packages WHERE id = ?', [row.id]);
        totalDeleted++;
        console.log(`  ✗ Deleted: ${gameType} (${row.id})`);
      }
    }
  }
  
  console.log(`\n════════════════════════════════════════════`);
  console.log(`✓ Deleted: ${totalDeleted} duplicate records`);
  
  const [result] = await conn.execute('SELECT COUNT(*) as cnt FROM game_packages');
  console.log(`✓ Remaining: ${result[0].cnt} game packages`);
  console.log(`════════════════════════════════════════════`);
  
  await conn.end();
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
