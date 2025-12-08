/**
 * 7 Days to Die Konfiguráció Generátor Teszt
 * Konfigurációs fájlok generálásának tesztelése
 */

// .env fájl betöltése
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env') });

import { SevenDaysToDieConfigGenerator } from '@/lib/game-templates/configs/7days2die-config';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

async function test7DaysConfig() {
  console.log('=== 7 Days to Die Konfiguráció Generátor Teszt ===\n');

  try {
    // Teszt könyvtár létrehozása
    const testDir = '/tmp/test-7dtd-config';
    const serverConfigDir = join(testDir, 'server');

    console.log('📌 1. Teszt könyvtár létrehozása...');
    await mkdir(serverConfigDir, { recursive: true });
    console.log(`✅ Teszt könyvtár: ${testDir}\n`);

    // 2. ServerConfig generálás
    console.log('📌 2. serverconfig.xml generálás...');
    const serverConfig = SevenDaysToDieConfigGenerator.generateServerConfig(
      {
        serverName: 'Test 7DTD Server',
        maxPlayers: 8,
        port: 26900,
        telnetPort: 26901,
        webMapPort: 26902,
        worldGeneration: 'RandomGen',
        difficulty: 'Normal',
        gameMode: 'Survival',
        eacEnabled: true,
        adminUsers: ['76561198000000000'], // Teszt Steam ID
        serverPassword: 'testpass123',
      },
      {
        port: 26900,
        telnetPort: 26901,
        webMapPort: 26902,
      }
    );

    const serverConfigPath = join(serverConfigDir, 'serverconfig.xml');
    await writeFile(serverConfigPath, serverConfig, 'utf-8');
    console.log(`✅ serverconfig.xml generálva: ${serverConfigPath}`);
    console.log(`   Méret: ${(await import('fs')).promises.stat(serverConfigPath).then(s => s.size)} bytes\n`);

    // 3. Admin config generálás
    console.log('📌 3. admin.xml generálás...');
    const adminConfig = SevenDaysToDieConfigGenerator.generateAdminConfig([
      '76561198000000000',
      '76561198000000001',
    ]);

    const adminConfigPath = join(serverConfigDir, 'admin.xml');
    await writeFile(adminConfigPath, adminConfig, 'utf-8');
    const adminConfigStats = await (await import('fs')).promises.stat(adminConfigPath);
    console.log(`✅ admin.xml generálva: ${adminConfigPath}`);
    console.log(`   Méret: ${adminConfigStats.size} bytes\n`);

    // 4. Konfiguráció validáció (XML formátum ellenőrzés)
    console.log('📌 4. Konfiguráció validáció...');
    
    // XML formátum ellenőrzés (alapvető)
    const fs = await import('fs');
    const serverConfigContent = await fs.promises.readFile(serverConfigPath, 'utf-8');
    if (serverConfigContent.includes('<?xml') && serverConfigContent.includes('<serverconfig>')) {
      console.log('✅ serverconfig.xml XML formátum helyes\n');
    } else {
      throw new Error('serverconfig.xml XML formátum hibás');
    }

    const adminConfigContent = await fs.promises.readFile(adminConfigPath, 'utf-8');
    if (adminConfigContent.includes('<?xml') && adminConfigContent.includes('<admins>')) {
      console.log('✅ admin.xml XML formátum helyes\n');
    } else {
      throw new Error('admin.xml XML formátum hibás');
    }

    // 5. Konfiguráció tartalom ellenőrzés
    console.log('📌 5. Konfiguráció tartalom ellenőrzés...');
    
    // Server name ellenőrzés
    if (serverConfigContent.includes('Test 7DTD Server')) {
      console.log('✅ Server name helyesen beállítva');
    } else {
      throw new Error('Server name nem található a konfigurációban');
    }

    // Port ellenőrzés
    if (serverConfigContent.includes('26900') && serverConfigContent.includes('26901') && serverConfigContent.includes('26902')) {
      console.log('✅ Portok helyesen beállítva');
    } else {
      throw new Error('Portok nem találhatók a konfigurációban');
    }

    // Max players ellenőrzés
    if (serverConfigContent.includes('ServerMaxPlayerCount') && serverConfigContent.includes('8')) {
      console.log('✅ Max players helyesen beállítva\n');
    } else {
      throw new Error('Max players nem található a konfigurációban');
    }

    // Admin users ellenőrzés
    if (adminConfigContent.includes('76561198000000000') && adminConfigContent.includes('76561198000000001')) {
      console.log('✅ Admin users helyesen beállítva\n');
    } else {
      throw new Error('Admin users nem találhatók a konfigurációban');
    }

    console.log('=== 7 Days to Die Konfiguráció Generátor Teszt Sikeres ===');
    console.log(`\n📁 Konfigurációs fájlok: ${testDir}`);
    console.log('   - serverconfig.xml');
    console.log('   - admin.xml\n');
  } catch (error: any) {
    console.error('❌ 7 Days to Die konfiguráció generátor teszt hiba:', error);
    process.exit(1);
  }
}

// Script futtatása
test7DaysConfig().catch(console.error);

