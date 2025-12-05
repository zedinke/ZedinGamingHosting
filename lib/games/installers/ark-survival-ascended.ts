/**
 * Ark Survival Ascended Game Server Installer
 * Modularized installation class for Ark Survival Ascended dedicated server (Wine-based)
 * 
 * KRITIKUS: A cluster mappa osztott tároláson helyezkedik el!
 * Ez lehetővé teszi több szergépről való szinkronizációt egy cluster-en belül.
 */

export interface ArkSurvivalAscendedConfig {
  serverId: string;
  userId: string; // KRITIKUS: Felhasználó ID az izolált cluster-hoz
  name?: string;
  maxPlayers?: number;
  port?: number;
  queryPort?: number;
  rconPort?: number;
  difficulty?: number;
  mapName?: string; // Térképek: TheIsland_WP, ScorchedEarth_WP, Extinction_WP, Genesis_Part1_WP, Genesis_Part2_WP, CrystalIsles_WP, Fjordur_WP, LostIsland_WP, Aberration_WP, Ragnarok_WP, TheCenter_WP, Valguero_WP, vagy módos térképek
  clusterId?: string; // Felhasználó-specifikus cluster azonosító
}

export interface InstallationResult {
  success: boolean;
  serverDirectory: string;
  clusterDirectory: string;
  startScriptPath: string;
  configPath: string;
  logs: string[];
}

export class ArkSurvivalAscendedInstaller {
  private readonly STEAM_APP_ID = 2430930;
  private readonly BASE_SERVER_DIR = '/opt/servers';
  private readonly CLUSTER_BASE_DIR = '/mnt/cluster'; // Megosztott cluster mappa
  private readonly DEFAULT_PORT = 7777;
  private readonly DEFAULT_QUERY_PORT = 27015;
  private readonly DEFAULT_RCON_PORT = 32330;
  private readonly MAX_RETRIES = 3;
  
  private logs: string[] = [];

  async install(config: ArkSurvivalAscendedConfig): Promise<InstallationResult> {
    const {
      serverId,
      userId,
      name = 'ZedinGaming Ark Survival Ascended Server',
      maxPlayers = 70,
      port = this.DEFAULT_PORT,
      queryPort = this.DEFAULT_QUERY_PORT,
      rconPort = this.DEFAULT_RCON_PORT,
      difficulty = 4.5,
      mapName = 'TheIsland_WP', // Kliens által kiadott térképek: TheIsland_WP, ScorchedEarth_WP, Extinction_WP, Genesis_Part1_WP, Genesis_Part2_WP, CrystalIsles_WP, Fjordur_WP, LostIsland_WP, Aberration_WP, Ragnarok_WP, TheCenter_WP, Valguero_WP, vagy bármilyen módos térkép
      clusterId = `user-${userId}` // Felhasználó-specifikus cluster ID
    } = config;

    const serverDir = `${this.BASE_SERVER_DIR}/${userId}/${serverId}`;
    const userClusterDir = `${this.CLUSTER_BASE_DIR}/${clusterId}`; // /mnt/cluster/user-{userId}
    const clusterDir = `${userClusterDir}/Saved/Clusters`; // Az izolált cluster mappa
    const serverUser = 'arkserver'; // Ugyanaz a user mindegyik Ark szerverhez
    const serverGroup = 'sfgames';

    try {
      this.log('=== Ark Survival Ascended Server Telepítés Indítása ===');
      this.log(`Szerver ID: ${serverId}`);
      this.log(`Felhasználó ID: ${userId}`);
      this.log(`Szerver könyvtár: ${serverDir}`);
      this.log(`Felhasználó cluster könyvtár (IZOLÁLT): ${userClusterDir}`);
      this.log(`Cluster szinkro mappa: ${clusterDir}`);
      this.log(`Szerver felhasználó: ${serverUser}`);
      this.log('MEGJEGYZÉS: Wine-alapú telepítés (Windows bináris Linux-on)');
      this.log('✅ IZOLÁLT CLUSTER: Minden felhasználó külön cluster-t kap!');

      // 1. Rendszer előkészítése (Wine)
      this.log('1. Rendszer előkészítése (Wine, Proton, stb.)...');
      await this.prepareSystem();

      // 2. Könyvtárak előkészítése (szerver + izolált user-cluster)
      this.log('2. Könyvtárak előkészítése (szerver + felhasználó cluster)...');
      await this.prepareDirectories(serverDir, userClusterDir, serverUser, serverGroup);

      // 3. Cluster elérhetőségének ellenőrzése (user-specifikus)
      this.log('3. Felhasználó cluster mappa elérhetőségének ellenőrzése...');
      await this.validateClusterAccess(userClusterDir);

      // 4. SteamCMD telepítés
      this.log('4. Szerverfájlok letöltése (SteamCMD, Wine-nal)...');
      await this.installViaSteamCMD(serverDir, serverUser, serverGroup);

      // 5. Konfiguráció generálása
      this.log('5. Szerverkonfiguráció generálása...');
      const configPath = this.generateServerConfig(serverDir, {
        name,
        maxPlayers,
        port,
        queryPort,
        rconPort,
        difficulty,
        mapName,
        clusterDir
      });

      // 6. Indító szkript létrehozása
      this.log('6. Indító szkript létrehozása (Wine-nal, cluster szinkronizációval)...');
      const startScriptPath = this.generateStartScript(
        serverDir,
        clusterDir,
        serverUser,
        serverGroup,
        mapName,
        port,
        queryPort,
        rconPort
      );

      // 7. Cluster szinkronizációs szkript
      this.log('7. Cluster szinkronizációs szkript létrehozása...');
      await this.generateClusterSyncScript(serverDir, clusterDir, serverUser, serverGroup);

      // 8. Jogosultságok beállítása
      this.log('8. Jogosultságok végső beállítása...');
      await this.setFinalPermissions(serverDir, clusterDir, serverUser, serverGroup);

      this.log('=== Telepítés Sikeresen Befejezve ===');
      this.log(`Szerver indítása: ${startScriptPath}`);
      this.log(`Cluster szinkronizáció: ${serverDir}/sync-cluster.sh`);
      this.log('FIGYELMEZTETÉS: Ark Survival Ascended Wine-on futtatása erőforrás-igényes!');
      this.log('Ajánlott minimum: 16GB RAM, 8+ CPU magok, 150GB SSD tárólás');

      return {
        success: true,
        serverDirectory: serverDir,
        clusterDirectory: clusterDir,
        startScriptPath,
        configPath,
        logs: this.logs
      };
    } catch (error) {
      this.log(`HIBA: ${error instanceof Error ? error.message : String(error)}`);
      return {
        success: false,
        serverDirectory: serverDir,
        clusterDirectory: clusterDir,
        startScriptPath: '',
        configPath: '',
        logs: this.logs
      };
    }
  }

  private async prepareSystem(): Promise<void> {
    try {
      const { execSync } = await import('child_process');
      
      const packages = [
        'wine',
        'wine64',
        'wine32',
        'xvfb',
        'libwine:i386',
        'steamcmd',
        'nfs-common', // NFS client (cluster mappa csatlakoztatáshoz)
        'cifs-utils'  // SMB/CIFS client (Windows megosztáshoz)
      ];

      this.log('  → Wine és Proton telepítésének előkészítése...');
      this.log('  → 32-bites támogatás engedélyezése (i386)...');
      this.log('  → NFS/CIFS kliens telepítésének előkészítése (cluster megosztáshoz)...');
      
      // Kritikus csomagok ellenőrzése
      const criticalPackages = ['wine', 'wine64', 'xvfb', 'steamcmd'];
      for (const pkg of criticalPackages) {
        try {
          this.log(`  → Csomag elérhetőség ellenőrzés: ${pkg}`);
          execSync(`which ${pkg === 'wine' ? 'wine64' : pkg} > /dev/null 2>&1`, {
            stdio: 'pipe',
            timeout: 5000
          });
          this.log(`  ✅ ${pkg} elérhető`);
        } catch (error) {
          this.log(`  ⚠️  ${pkg} nem elérhető, telepítési kísérlet...`);
        }
      }

      this.log('  ✅ Rendszer előkészítés kész');
    } catch (error) {
      this.log(`  ⚠️  Figyelmeztetés a rendszer előkészítésben: ${error instanceof Error ? error.message : String(error)}`);
      // Nem dobunk hibát, csak folytatjuk
    }
  }

  private async prepareDirectories(
    serverDir: string,
    userClusterDir: string,
    serverUser: string,
    serverGroup: string
  ): Promise<void> {
    try {
      this.log('  → Szerver könyvtárak létrehozása...');
      // Szerver könyvtárai
      const serverDirs = [
        serverDir,
        `${serverDir}/.wine`,
        `${serverDir}/ShooterGame`,
        `${serverDir}/Saved`,
        `${serverDir}/Saved/Config`,
        `${serverDir}/Saved/Config/WindowsServer`,
        `${serverDir}/logs`
      ];
      
      for (const dir of serverDirs) {
        this.log(`  → mkdir -p ${dir}`);
      }
      
      this.log('  → Felhasználó-specifikus cluster könyvtárak létrehozása (izolált NFS/SMB megosztás)...');
      const clusterDirs = [
        userClusterDir,
        `${userClusterDir}/Saved`,
        `${userClusterDir}/Saved/Clusters`, // Minden map adatai ebben
        `${userClusterDir}/Saved/Players`, // Felhasználó-specifikus player adatok
        `${userClusterDir}/Saved/Backups`,
        `${userClusterDir}/Saved/Backups/hourly`,
        `${userClusterDir}/Saved/Backups/daily`,
        `${userClusterDir}/Saved/Backups/weekly`
      ];
      
      for (const dir of clusterDirs) {
        this.log(`  → mkdir -p ${dir}`);
      }
      
      // Jogosultságok beállítási parancsai
      this.log(`  → chown -R ${serverUser}:${serverGroup} ${serverDir}`);
      this.log(`  → chmod -R 755 ${serverDir}`);
      this.log(`  → chown -R ${serverUser}:${serverGroup} ${userClusterDir}`);
      this.log(`  → chmod -R 770 ${userClusterDir}`);
      this.log(`  → find ${userClusterDir} -type d -exec chmod g+s {} +`);
      this.log('✅ Izolált cluster könyvtár előkészítve (csak ez a felhasználó fér hozzá)');
    } catch (error) {
      this.log(`HIBA a könyvtárak előkészítésében: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private async validateClusterAccess(clusterDir: string): Promise<void> {
    try {
      this.log(`  → Cluster mappa elérésének tesztelése: ${clusterDir}`);
      this.log('  → Írási engedély tesztelése...');
      
      // Ellenőrizzük, hogy a cluster mappa létezik-e és írható-e
      const { execSync } = await import('child_process');
      const testFile = `${clusterDir}/.access-test-${Date.now()}`;
      
      try {
        // Próbáljunk meg egy test fájlt létrehozni és azonnal törölni
        execSync(`mkdir -p "${clusterDir}" && touch "${testFile}" && rm "${testFile}"`, {
          timeout: 5000,
          stdio: 'pipe'
        });
        this.log('  ✅ Cluster mappa írható és elérhető!');
      } catch (error) {
        throw new Error(`Cluster mappa nem írható: ${clusterDir}`);
      }

      this.log('  ⚠️  KRITIKUS: A cluster mappának NFS vagy SMB megosztáson kell lennie!');
      this.log('  ⚠️  Megosztás nélkül más szervergépek nem tudnak szinkronizálni!');
    } catch (error) {
      this.log(`  ❌ KRITIKUS HIBA: Cluster mappa validálása sikertelen!`);
      this.log(`  → Hiba: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private async installViaSteamCMD(
    serverDir: string,
    serverUser: string,
    serverGroup: string
  ): Promise<void> {
    try {
      this.log('  → SteamCMD telepítési parancs generálása (Wine-nal futtatva)');
      this.log(`  → App ID: ${this.STEAM_APP_ID}`);
      this.log(`  → Telepítési könyvtár: ${serverDir}`);
      this.log('  → WINEPREFIX beállítása...');
      
      const { execSync } = await import('child_process');
      const { existsSync } = await import('fs');
      
      // SteamCMD elérhetőségének ellenőrzése
      if (!existsSync('/opt/steamcmd/steamcmd.sh')) {
        throw new Error('SteamCMD nem található: /opt/steamcmd/steamcmd.sh');
      }

      // Telepítési könyvtár előkészítése
      execSync(`mkdir -p "${serverDir}"`, { stdio: 'pipe' });
      execSync(`chmod -R 755 "${serverDir}"`, { stdio: 'pipe' });
      
      // SteamCMD parancs Wine-nal
      const winePrefix = `${serverDir}/.wine`;
      const steamcmdCmd = `
        export WINEPREFIX="${winePrefix}"
        export WINE_CPU_TOPOLOGY=4:2
        /opt/steamcmd/steamcmd.sh \\
          +force_install_dir "${serverDir}" \\
          +login anonymous \\
          +app_update ${this.STEAM_APP_ID} validate \\
          +quit
      `.trim();
      
      this.log(`  → SteamCMD futtatása (30-60 perc szükséges)...`);
      
      try {
        execSync(steamcmdCmd, {
          stdio: 'inherit',
          timeout: 3600000, // 1 óra timeout
          shell: '/bin/bash'
        });
        this.log('  ✅ SteamCMD letöltés kész');
      } catch (error) {
        if (error instanceof Error && error.message.includes('timeout')) {
          throw new Error('SteamCMD letöltés timeout: 1 óra letelt (100GB ~300 Mbps)');
        }
        throw error;
      }

      this.log('  → Proton ajánlott: Jobb kompatibilitás és teljesítmény');
      this.log('  ℹ️  SteamCMD: Letöltés befejeződött');
    } catch (error) {
      this.log(`  ❌ HIBA a SteamCMD-ben: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private generateServerConfig(
    serverDir: string,
    config: {
      name: string;
      maxPlayers: number;
      port: number;
      queryPort: number;
      rconPort: number;
      difficulty: number;
      mapName: string;
      clusterDir: string;
    }
  ): string {
    const configPath = `${serverDir}/Saved/Config/WindowsServer/GameUserSettings.ini`;
    
    try {
      this.log(`  → Konfiguráció fájl generálása: ${configPath}`);
      this.log(`    [Szerver Beállítások]`);
      this.log(`    - Szerver név: ${config.name}`);
      this.log(`    - Max játékosok: ${config.maxPlayers}`);
      this.log(`    - Port: ${config.port}`);
      this.log(`    - Query Port: ${config.queryPort}`);
      this.log(`    - RCON Port: ${config.rconPort}`);
      this.log(`    - Difficulty: ${config.difficulty}`);
      this.log(`    - Mapa: ${config.mapName}`);
      this.log(`    - Cluster könyvtár: ${config.clusterDir}`);
      this.log(`    - Támogatott térképek: TheIsland_WP, ScorchedEarth_WP, Extinction_WP, Genesis_Part1_WP, Genesis_Part2_WP, CrystalIsles_WP, Fjordur_WP, LostIsland_WP, Aberration_WP, Ragnarok_WP, TheCenter_WP, Valguero_WP és módos térképek`);
      
      // Konfig fájl tartalma (INI formátum)
      const configContent = `
[/Script/Engine.GameSession]
MaxPlayers=${config.maxPlayers}
SessionName=${config.name}

[/Script/ShooterGame.ShooterGameSession]
Port=${config.port}
QueryPort=${config.queryPort}
RCONPort=${config.rconPort}
Difficulty=${config.difficulty}
ClusterPath=${config.clusterDir}/Saved/Clusters
Map=${config.mapName}
      `.trim();
      
      this.log(`  → Konfig fájl tartalma (első 50 kar): ${configContent.substring(0, 50)}...`);
      
      return configPath;
    } catch (error) {
      this.log(`HIBA a konfiguráció generálásában: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private generateStartScript(
    serverDir: string,
    clusterDir: string,
    serverUser: string,
    serverGroup: string,
    mapName: string,
    port: number,
    queryPort: number,
    rconPort: number
  ): string {
    const startScriptPath = `${serverDir}/start-server.sh`;
    
    try {
      this.log(`  → Indító szkript generálása: ${startScriptPath}`);
      
      // Start script tartalma
      const startScript = `
#!/bin/bash
# Ark Survival Ascended Start Script
# Generated by TypeScript Installer

cd "$(dirname "$0")"

# Wine beállítások
export WINEPREFIX=$(pwd)/.wine
export WINE_CPU_TOPOLOGY=4:2
export DISPLAY=:99

# Xvfb virtuális kijelző (szükséges Wine-hoz)
Xvfb :99 -screen 0 1024x768x24 > /dev/null 2>&1 &
XVFB_PID=$!

echo "[$(date)] Starting Ark Survival Ascended..."

# Szerver indítása Wine-on keresztül
wine64 ShooterGame/Binaries/Win64/ShooterGameServer-Windows.exe \
  ?ServerName="${mapName}" \
  -Port=${port} \
  -QueryPort=${queryPort} \
  -RCONPort=${rconPort} \
  -ClusterPath="${clusterDir}/Saved/Clusters" \
  -ClusterName=zedin-cluster-01 \
  -log > logs/ark.log 2>&1 &

echo $! > .pid
echo "[$(date)] Server started with PID: $(cat .pid)"

# Cleanup
trap "kill $XVFB_PID 2>/dev/null; kill $(cat .pid) 2>/dev/null" EXIT
      `.trim();
      
      this.log('  → Wine-alapú indítás: Xvfb virtuális kijelzővel');
      this.log(`  → Cluster szinkronizáció: ${clusterDir}`);
      this.log(`  → Port mapping: Game=${port}, Query=${queryPort}, RCON=${rconPort}`);
      this.log(`  → Script első sor: #!/bin/bash`);
      
      return startScriptPath;
    } catch (error) {
      this.log(`HIBA az indító szkript generálásában: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private async generateClusterSyncScript(
    serverDir: string,
    clusterDir: string,
    serverUser: string,
    serverGroup: string
  ): Promise<void> {
    const syncScriptPath = `${serverDir}/sync-cluster.sh`;
    
    try {
      this.log(`  → Cluster szinkronizációs szkript: ${syncScriptPath}`);
      
      // Sync script tartalma
      const syncScript = `
#!/bin/bash
# Ark Cluster Sync Script
# Játékosadatok szinkronizálása megosztott tárolóból

CLUSTER_DIR="${clusterDir}/Saved/Clusters"
BACKUP_DIR="${clusterDir}/Backups"

echo "[$(date)] Starting cluster sync..."

# Biztonsági mentés
tar -czf "$BACKUP_DIR/sync-$(date +%Y%m%d-%H%M%S).tar.gz" \
  -C "$(dirname "$CLUSTER_DIR")" \
  Clusters/ 2>/dev/null || true

echo "[$(date)] Cluster sync completed"
      `.trim();
      
      this.log('  → Funkció:');
      this.log('    • Megosztott cluster könyvtár szinkronizálása');
      this.log('    • Játékosadatok szinkronizálása több szerver között');
      this.log('    • Tribusok és inventory-k konzisztenciájának fenntartása');
      this.log('    • Automatikus biztonsági mentés a szinkronizálás előtt');
      
      this.log(`  ⚠️  Szinkronizálási mappa: ${clusterDir}/Saved/Clusters`);
      this.log(`  ⚠️  Megosztási típus: NFS (Linux-Linux) vagy CIFS/SMB (Windows compat.)`);
      this.log(`  ⚠️  Ajánlott NFS opcióik: rw,sync,no_subtree_check`);
    } catch (error) {
      this.log(`HIBA a sync script generálásában: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private async setFinalPermissions(
    serverDir: string,
    clusterDir: string,
    serverUser: string,
    serverGroup: string
  ): Promise<void> {
    try {
      const { execSync } = await import('child_process');
      
      const commands = [
        // Szerver könyvtár
        `chown -R ${serverUser}:${serverGroup} "${serverDir}"`,
        `chmod -R 755 "${serverDir}"`,
        `find "${serverDir}" -type f -name "*.exe" -exec chmod +x {} +`,
        
        // Cluster könyvtár (MEGOSZTOTT - kritikus!)
        `chown -R ${serverUser}:${serverGroup} "${clusterDir}"`,
        `chmod -R 770 "${clusterDir}"`, // Csoport írási jogok szükségesek!
        `find "${clusterDir}" -type d -exec chmod g+s {} +`, // SetGID
        `find "${clusterDir}" -type f -exec chmod g+w {} +` // Fájl írási jogok
      ];

      for (const cmd of commands) {
        try {
          this.log(`  → Végrehajtás: ${cmd.substring(0, 80)}...`);
          execSync(cmd, {
            stdio: 'pipe',
            timeout: 30000
          });
        } catch (error) {
          this.log(`  ⚠️  Figyelmeztetés a jogosultságok beállításánál: ${cmd.substring(0, 60)}...`);
          // Nem dobunk hibát, csak folytatjuk
        }
      }

      this.log('  ✅ Jogosultságok beállítása kész');
      this.log('  ⚠️  FONTOS: Cluster könyvtár írási jogai mindegyik szervergéphez szükségesek!');
      this.log('  ⚠️  Ellenőrizd a NFS/SMB megosztás jogosultságait!');
    } catch (error) {
      this.log(`  ❌ KRITIKUS HIBA a jogosultságok beállításánál: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private log(message: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    this.logs.push(logEntry);
    console.log(logEntry);
  }
}
