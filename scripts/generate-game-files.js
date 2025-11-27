/**
 * Script a játék konfigurációk és telepítők szétválasztásához
 * Használat: node scripts/generate-game-files.js
 */

const fs = require('fs');
const path = require('path');

// Játék típusok neveinek konverziója fájlnévhez
function gameTypeToFileName(gameType) {
  return gameType.toLowerCase().replace(/_/g, '-');
}

// Telepítő script generálása
function generateInstallerFile(gameType, installScript) {
  const fileName = gameTypeToFileName(gameType);
  const filePath = path.join(__dirname, '..', 'lib', 'games', 'installers', `${fileName}.ts`);
  
  const content = `/**
 * ${gameType.replace(/_/g, ' ')} telepítő script
 */

export const installScript = \`${installScript.trim()}\`;
`;

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`✓ Telepítő létrehozva: ${filePath}`);
}

// Konfiguráció fájl generálása
function generateConfigFile(gameType, config) {
  const fileName = gameTypeToFileName(gameType);
  const filePath = path.join(__dirname, '..', 'lib', 'games', 'configs', `${fileName}.ts`);
  
  const configObj = {
    ...config,
    installScript: '', // Telepítő script külön fájlban
  };
  
  // Objektum stringgé konvertálása
  const configString = JSON.stringify(configObj, null, 2)
    .replace(/"installScript": ""/g, 'installScript: \'\', // Telepítő script külön fájlban')
    .replace(/"steamAppId": (\d+)/g, 'steamAppId: $1')
    .replace(/"requiresSteamCMD": (true|false)/g, 'requiresSteamCMD: $1')
    .replace(/"requiresJava": (true|false)/g, 'requiresJava: $1')
    .replace(/"requiresWine": (true|false)/g, 'requiresWine: $1')
    .replace(/"port": (\d+)/g, 'port: $1')
    .replace(/"queryPort": (\d+)/g, 'queryPort: $1')
    .replace(/"configPath": "([^"]+)"/g, 'configPath: \'$1\'')
    .replace(/"startCommand": "([^"]+)"/g, 'startCommand: \'$1\'')
    .replace(/"startCommandWindows": "([^"]+)"/g, 'startCommandWindows: \'$1\'')
    .replace(/"stopCommand": "([^"]+)"/g, 'stopCommand: \'$1\'');
  
  const content = `/**
 * ${gameType.replace(/_/g, ' ')} konfiguráció
 */

import { GameServerConfig } from '../types';

export const config: GameServerConfig = ${configString};
`;

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`✓ Konfiguráció létrehozva: ${filePath}`);
}

console.log('⚠️  Ez a script még nincs teljesen implementálva.');
console.log('Kérjük, manuálisan hozd létre a fájlokat a game-server-configs.ts alapján.');
console.log('Vagy fejleszd tovább ezt a scriptet, hogy automatikusan parse-olja a TypeScript fájlt.');

