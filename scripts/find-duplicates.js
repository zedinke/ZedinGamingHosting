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
  
  const [rows] = await conn.execute(`
    SELECT gameType, COUNT(*) as cnt, GROUP_CONCAT(id SEPARATOR ', ') as ids
    FROM game_packages
    GROUP BY gameType
    HAVING cnt > 1
    ORDER BY cnt DESC
  `);
  
  console.log('Duplikált játékok:');
  console.log('═'.repeat(80));
  rows.forEach(r => {
    console.log(`${r.gameType}: ${r.cnt}x`);
    console.log(`  IDs: ${r.ids}`);
  });
  
  console.log('\n' + '═'.repeat(80));
  console.log(`Összesen duplikált rekordok: ${rows.reduce((a,b) => a + (b.cnt-1), 0)}`);
  
  const [total] = await conn.execute('SELECT COUNT(*) as cnt FROM game_packages');
  console.log(`Összes rekord: ${total[0].cnt}`);
  
  await conn.end();
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
