import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { executeSSHCommand } from '@/lib/ssh-client';
import { ALL_GAME_SERVER_CONFIGS } from '@/lib/game-server-configs';

// POST - Szerver telepítés ellenőrzése
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Nincs jogosultság' },
        { status: 403 }
      );
    }

    const { id } = params;

    const server = await prisma.server.findUnique({
      where: { id },
      include: {
        agent: {
          include: {
            machine: true,
          },
        },
      },
    });

    if (!server) {
      return NextResponse.json(
        { error: 'Szerver nem található' },
        { status: 404 }
      );
    }

    if (!server.agent || !server.agent.machine) {
      return NextResponse.json(
        { error: 'Szerver nincs hozzárendelve egy agent-hez' },
        { status: 400 }
      );
    }

    const machine = server.agent.machine;
    const gameConfig = ALL_GAME_SERVER_CONFIGS[server.gameType];

    if (!gameConfig) {
      return NextResponse.json(
        { error: 'Játék konfiguráció nem található' },
        { status: 400 }
      );
    }

    // Szerver path meghatározása
    const serverPath = (server.configuration as any)?.instancePath || 
                      (server.configuration as any)?.sharedPath || 
                      `/opt/servers/${id}`;

    const results: {
      check: string;
      status: 'ok' | 'error' | 'warning';
      message: string;
    }[] = [];

    // 1. Ellenőrizzük, hogy a szerver könyvtár létezik-e
    try {
      const dirCheck = await executeSSHCommand(
        {
          host: machine.ipAddress,
          port: machine.sshPort,
          user: machine.sshUser,
          keyPath: machine.sshKeyPath || undefined,
        },
        `test -d ${serverPath} && echo "exists" || echo "not_exists"`
      );

      if (dirCheck.stdout?.includes('exists')) {
        results.push({
          check: 'Szerver könyvtár',
          status: 'ok',
          message: `Könyvtár létezik: ${serverPath}`,
        });
      } else {
        results.push({
          check: 'Szerver könyvtár',
          status: 'error',
          message: `Könyvtár nem létezik: ${serverPath}`,
        });
      }
    } catch (error) {
      results.push({
        check: 'Szerver könyvtár',
        status: 'error',
        message: `Hiba az ellenőrzés során: ${error instanceof Error ? error.message : 'Ismeretlen hiba'}`,
      });
    }

    // 2. Ellenőrizzük a start command fájlt
    if (gameConfig.startCommand) {
      // Kinyerjük a fájlnevet a start command-ból
      const startCommand = gameConfig.startCommand;
      // Egyszerű regex a fájlnév kinyeréséhez (pl. ./TheForestDedicatedServer.x86_64)
      const fileMatch = startCommand.match(/\.\/([^\s]+)/);
      
      if (fileMatch) {
        const fileName = fileMatch[1];
        try {
          // Keresünk a fájlra a szerver könyvtárban és alkönyvtáraiban
          const fileCheck = await executeSSHCommand(
            {
              host: machine.ipAddress,
              port: machine.sshPort,
              user: machine.sshUser,
              keyPath: machine.sshKeyPath || undefined,
            },
            `find ${serverPath} -name "${fileName}" -type f 2>/dev/null | head -1 || echo "not_found"`
          );

          if (fileCheck.stdout && !fileCheck.stdout.includes('not_found')) {
            const foundPath = fileCheck.stdout.trim();
            results.push({
              check: 'Szerver bináris fájl',
              status: 'ok',
              message: `Fájl megtalálva: ${foundPath}`,
            });

            // Ellenőrizzük a végrehajtási jogosultságokat
            const permCheck = await executeSSHCommand(
              {
                host: machine.ipAddress,
                port: machine.sshPort,
                user: machine.sshUser,
                keyPath: machine.sshKeyPath || undefined,
              },
              `test -x "${foundPath}" && echo "executable" || echo "not_executable"`
            );

            if (permCheck.stdout?.includes('executable')) {
              results.push({
                check: 'Végrehajtási jogosultságok',
                status: 'ok',
                message: 'Fájl végrehajtható',
              });
            } else {
              results.push({
                check: 'Végrehajtási jogosultságok',
                status: 'warning',
                message: 'Fájl nem végrehajtható - jogosultságok beállítása szükséges',
              });
            }
          } else {
            results.push({
              check: 'Szerver bináris fájl',
              status: 'error',
              message: `Fájl nem található: ${fileName} (keresési útvonal: ${serverPath})`,
            });
          }
        } catch (error) {
          results.push({
            check: 'Szerver bináris fájl',
            status: 'error',
            message: `Hiba az ellenőrzés során: ${error instanceof Error ? error.message : 'Ismeretlen hiba'}`,
          });
        }
      }
    }

    // 3. Ellenőrizzük a globális SteamCMD-t (ha szükséges)
    if (gameConfig.requiresSteamCMD) {
      try {
        const globalSteamCMD = '/opt/steamcmd/steamcmd.sh';
        const steamcmdCheck = await executeSSHCommand(
          {
            host: machine.ipAddress,
            port: machine.sshPort,
            user: machine.sshUser,
            keyPath: machine.sshKeyPath || undefined,
          },
          `test -f ${globalSteamCMD} && echo "exists" || echo "not_exists"`
        );

        if (steamcmdCheck.stdout?.includes('exists')) {
          results.push({
            check: 'Globális SteamCMD',
            status: 'ok',
            message: `SteamCMD telepítve: ${globalSteamCMD}`,
          });
        } else {
          results.push({
            check: 'Globális SteamCMD',
            status: 'error',
            message: `SteamCMD nem található: ${globalSteamCMD} - az agent telepítés során kell telepíteni`,
          });
        }
      } catch (error) {
        results.push({
          check: 'Globális SteamCMD',
          status: 'error',
          message: `Hiba az ellenőrzés során: ${error instanceof Error ? error.message : 'Ismeretlen hiba'}`,
        });
      }
    }

    // 4. Systemd service ellenőrzés
    try {
      const serviceName = `server-${id}`;
      const serviceCheck = await executeSSHCommand(
        {
          host: machine.ipAddress,
          port: machine.sshPort,
          user: machine.sshUser,
          keyPath: machine.sshKeyPath || undefined,
        },
        `systemctl is-enabled ${serviceName} 2>&1 || echo "not_enabled"`
      );

      if (serviceCheck.stdout?.includes('enabled')) {
        results.push({
          check: 'Systemd Service',
          status: 'ok',
          message: 'Service engedélyezve',
        });
      } else {
        results.push({
          check: 'Systemd Service',
          status: 'warning',
          message: 'Service nincs engedélyezve',
        });
      }
    } catch (error) {
      results.push({
        check: 'Systemd Service',
        status: 'error',
        message: `Hiba az ellenőrzés során: ${error instanceof Error ? error.message : 'Ismeretlen hiba'}`,
      });
    }

    const hasErrors = results.some(r => r.status === 'error');
    const hasWarnings = results.some(r => r.status === 'warning');

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: results.length,
        ok: results.filter(r => r.status === 'ok').length,
        warnings: results.filter(r => r.status === 'warning').length,
        errors: results.filter(r => r.status === 'error').length,
      },
      hasErrors,
      hasWarnings,
    });
  } catch (error) {
    console.error('Verify installation error:', error);
    return NextResponse.json(
      { error: 'Hiba történt a telepítés ellenőrzése során' },
      { status: 500 }
    );
  }
}

