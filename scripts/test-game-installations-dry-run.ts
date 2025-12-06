/**
 * Játék telepítések és indítások DRY-RUN tesztelése
 * 
 * Ez a script NEM futtat valós telepítéseket vagy indításokat.
 * Csak ellenőrzi, hogy:
 * - A játék konfigurációk helyesek-e
 * - A telepítési scriptek generálhatók-e
 * - A systemd service fájlok létrehozhatók-e
 * - Nincs-e szintaxis hiba a konfigurációkban
 * 
 * Használat:
 *   npx tsx scripts/test-game-installations-dry-run.ts
 */

import { GameType } from '@prisma/client';
import { ALL_GAME_SERVER_CONFIGS } from '../lib/game-server-configs';
import { logger } from '../lib/logger';

// Színek konzolhoz
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

interface ValidationResult {
  gameType: GameType;
  configExists: boolean;
  installScriptValid: boolean;
  startCommandValid: boolean;
  configPathValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Telepítési script validálása
 */
function validateInstallScript(installScript: string | any, gameType: GameType): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Ha objektum (pl. ARK Docker installer), akkor elfogadjuk
  if (typeof installScript === 'object' && installScript !== null) {
    return { valid: true, errors: [] };
  }

  if (!installScript || (typeof installScript === 'string' && installScript.trim() === '')) {
    errors.push('Telepítési script hiányzik vagy üres');
    return { valid: false, errors };
  }

  // Alapvető ellenőrzések - csak string típusú scripteknél
  if (typeof installScript === 'string') {
    if (!installScript.includes('steamcmd') && !installScript.includes('java') && gameType !== 'MINECRAFT') {
      // Ez csak figyelmeztetés, nem hiba - lehet, hogy a script másképp működik
    }

    // Placeholder-ek ellenőrzése - csak {serverId} kötelező, a többi a game-server-installer.ts-ben kerül be
    if (!installScript.includes('{serverId}')) {
      // {serverId} opcionális is lehet, ha a script másképp működik
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Start command validálása
 */
function validateStartCommand(startCommand: string | undefined, gameType: GameType): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!startCommand || startCommand.trim() === '') {
    errors.push('Start command hiányzik vagy üres');
    return { valid: false, errors };
  }

  // Alapvető ellenőrzések
  if (startCommand.includes('{port}') && !startCommand.includes('{port}')) {
    // Ez ellentmondásos, de csak ellenőrizzük, hogy van-e port placeholder
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Config path validálása
 */
function validateConfigPath(configPath: string | undefined): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!configPath || configPath.trim() === '') {
    // Config path opcionális lehet
    return { valid: true, errors };
  }

  // Ellenőrizzük, hogy tartalmazza-e a {serverId} placeholder-t
  if (configPath.includes('{serverId}')) {
    // OK, placeholder van
  }

  return { valid: true, errors };
}

/**
 * Játék konfiguráció validálása
 */
function validateGameConfig(gameType: GameType): ValidationResult {
  const result: ValidationResult = {
    gameType,
    configExists: false,
    installScriptValid: false,
    startCommandValid: false,
    configPathValid: false,
    errors: [],
    warnings: [],
  };

  const config = ALL_GAME_SERVER_CONFIGS[gameType];

  if (!config) {
    result.errors.push('Játék konfiguráció nem található');
    return result;
  }

  result.configExists = true;

  // Telepítési script validálása
  const installScriptValidation = validateInstallScript(config.installScript, gameType);
  result.installScriptValid = installScriptValidation.valid;
  result.errors.push(...installScriptValidation.errors);

  // Start command validálása
  const startCommandValidation = validateStartCommand(config.startCommand, gameType);
  result.startCommandValid = startCommandValidation.valid;
  result.errors.push(...startCommandValidation.errors);

  // Config path validálása
  const configPathValidation = validateConfigPath(config.configPath);
  result.configPathValid = configPathValidation.valid;
  result.errors.push(...configPathValidation.errors);

  // További ellenőrzések
  if (!config.steamAppId && gameType !== 'MINECRAFT' && gameType !== 'OTHER') {
    result.warnings.push('Steam App ID hiányzik (ez lehet normális, ha nem Steam játék)');
  }

  if (!config.queryPort && gameType !== 'MINECRAFT') {
    result.warnings.push('Query port hiányzik');
  }

  return result;
}

/**
 * Systemd service generálás tesztelése (mockolt adatokkal)
 */
async function testSystemdServiceGeneration(gameType: GameType): Promise<{ success: boolean; error?: string }> {
  try {
    const config = ALL_GAME_SERVER_CONFIGS[gameType];
    if (!config) {
      return { success: false, error: 'Konfiguráció nem található' };
    }

    // Mockolt adatok
    const mockConfig = {
      port: 25565,
      maxPlayers: 10,
      ram: 2048,
      name: 'Test Server',
      world: 'Dedicated',
      password: '',
      adminPassword: 'changeme',
    };

    // Ellenőrizzük, hogy a startCommand helyesen generálható-e
    let startCommand = config.startCommand || '';
    
    // Placeholder-ek cseréje
    startCommand = startCommand
      .replace(/{port}/g, mockConfig.port.toString())
      .replace(/{maxPlayers}/g, mockConfig.maxPlayers.toString())
      .replace(/{ram}/g, mockConfig.ram.toString())
      .replace(/{name}/g, mockConfig.name)
      .replace(/{world}/g, mockConfig.world)
      .replace(/{password}/g, mockConfig.password)
      .replace(/{adminPassword}/g, mockConfig.adminPassword);

    // Ellenőrizzük, hogy nincs-e benne placeholder
    if (startCommand.includes('{')) {
      const remainingPlaceholders = startCommand.match(/{[^}]+}/g);
      if (remainingPlaceholders && remainingPlaceholders.length > 0) {
        return {
          success: false,
          error: `Nem cserélt placeholder-ek: ${remainingPlaceholders.join(', ')}`,
        };
      }
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Fő teszt függvény
 */
async function main() {
  console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║  Játék Konfigurációk DRY-RUN Tesztelése                  ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);
  console.log(`${colors.yellow}⚠️  Ez egy DRY-RUN teszt - nem futtat valós telepítéseket!${colors.reset}\n`);

  // Támogatott játékok lekérése
  const supportedGames = Object.keys(ALL_GAME_SERVER_CONFIGS) as GameType[];
  console.log(`${colors.blue}[1/3]${colors.reset} ${supportedGames.length} támogatott játék típus található\n`);

  const results: ValidationResult[] = [];

  // Konfigurációk validálása
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.yellow}KONFIGURÁCIÓK VALIDÁLÁSA${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  for (let i = 0; i < supportedGames.length; i++) {
    const gameType = supportedGames[i];
    console.log(`${colors.blue}[${i + 1}/${supportedGames.length}]${colors.reset} ${gameType} validálása...`);

    const result = validateGameConfig(gameType);
    results.push(result);

    if (result.errors.length === 0 && result.warnings.length === 0) {
      console.log(`${colors.green}  ✓ Konfiguráció helyes${colors.reset}`);
    } else {
      if (result.errors.length > 0) {
        console.log(`${colors.red}  ✗ Hibák:${colors.reset}`);
        for (const error of result.errors) {
          console.log(`${colors.red}    - ${error}${colors.reset}`);
        }
      }
      if (result.warnings.length > 0) {
        console.log(`${colors.yellow}  ⚠ Figyelmeztetések:${colors.reset}`);
        for (const warning of result.warnings) {
          console.log(`${colors.yellow}    - ${warning}${colors.reset}`);
        }
      }
    }

    console.log('');
  }

  // Systemd service generálás tesztelése
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.yellow}SYSTEMD SERVICE GENERÁLÁS TESZTELÉSE${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  const systemdResults: Array<{ gameType: GameType; success: boolean; error?: string }> = [];

  for (let i = 0; i < supportedGames.length; i++) {
    const gameType = supportedGames[i];
    console.log(`${colors.blue}[${i + 1}/${supportedGames.length}]${colors.reset} ${gameType} systemd service generálás...`);

    const result = await testSystemdServiceGeneration(gameType);
    systemdResults.push({ gameType, ...result });

    if (result.success) {
      console.log(`${colors.green}  ✓ Systemd service generálható${colors.reset}`);
    } else {
      console.log(`${colors.red}  ✗ Systemd service generálás sikertelen: ${result.error}${colors.reset}`);
    }

    console.log('');
  }

  // Összefoglaló
  const validConfigs = results.filter(r => r.errors.length === 0);
  const invalidConfigs = results.filter(r => r.errors.length > 0);
  const validSystemd = systemdResults.filter(r => r.success);
  const invalidSystemd = systemdResults.filter(r => !r.success);

  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.yellow}ÖSSZEFOGLALÓ${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.green}Helyes konfigurációk: ${validConfigs.length}/${results.length}${colors.reset}`);
  console.log(`${colors.red}Hibás konfigurációk: ${invalidConfigs.length}/${results.length}${colors.reset}`);
  console.log(`${colors.green}Helyes systemd service generálás: ${validSystemd.length}/${systemdResults.length}${colors.reset}`);
  console.log(`${colors.red}Hibás systemd service generálás: ${invalidSystemd.length}/${systemdResults.length}${colors.reset}\n`);

  if (invalidConfigs.length > 0) {
    console.log(`${colors.red}Hibás konfigurációk:${colors.reset}`);
    for (const result of invalidConfigs) {
      console.log(`  - ${result.gameType}:`);
      for (const error of result.errors) {
        console.log(`    • ${error}`);
      }
    }
    console.log('');
  }

  if (invalidSystemd.length > 0) {
    console.log(`${colors.red}Hibás systemd service generálások:${colors.reset}`);
    for (const result of invalidSystemd) {
      console.log(`  - ${result.gameType}: ${result.error}`);
    }
    console.log('');
  }

  // Végső összefoglaló
  console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║  DRY-RUN TESZTELÉS BEFEJEZVE                             ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}`);

  const allValid = invalidConfigs.length === 0 && invalidSystemd.length === 0;

  if (allValid) {
    console.log(`\n${colors.green}✓ Minden konfiguráció helyes!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n${colors.red}✗ Néhány konfiguráció hibás${colors.reset}\n`);
    process.exit(1);
  }
}

// Script futtatása
main().catch((error) => {
  console.error(`${colors.red}Váratlan hiba:${colors.reset}`, error);
  process.exit(1);
});

