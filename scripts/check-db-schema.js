#!/usr/bin/env node

const mysql = require('mysql2/promise');

const dbConfig = {
  host: '116.203.226.140',
  user: 'ZedGamingHosting_Zedin',
  password: 'Gele007ta...',
  database: 'ZedGamingHosting_gamingportal',
};

async function main() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('✓ Connected to database\n');

    const [rows] = await connection.execute('DESC game_packages');
    
    console.log('game_packages estructura:');
    console.log('─'.repeat(100));
    rows.forEach((row, i) => {
      console.log(`${i + 1}. ${row.Field.padEnd(20)} ${row.Type.padEnd(25)} ${row.Key ? '[ ' + row.Key + ' ]' : ''} ${row.Extra || ''}`);
    });
    
    console.log('\n─'.repeat(100));
    
    const [count] = await connection.execute('SELECT COUNT(*) as cnt FROM game_packages');
    console.log(`\nCurrent records: ${count[0].cnt}`);
    
    await connection.end();
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

main();
