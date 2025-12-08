import { prisma } from '@/lib/prisma';

/**
 * Szerver provisioning triggerelése fizetés után
 * Támogatott: Rust, majd később más játékok
 */
export async function triggerServerProvisioning(serverId: string) {
  try {
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      include: { user: true },
    });

    if (!server) {
      console.error(`[Provisioning] Server not found: ${serverId}`);
      return;
    }

    // Rust szerver provisioning
    if (server.gameType === 'RUST') {
      const { provisionRustServer } = await import('@/lib/provisioning/rust-provisioner');

      const portBase = 28015; // Rust default GamePort
      
      const result = await provisionRustServer({
        serverId: server.id,
        serverName: server.name,
        maxPlayers: server.maxPlayers || 50,
        ports: {
          game: portBase,
          query: portBase + 1,
          rcon: portBase + 2,
        },
      });

      // Szerver adatainak frissítése
      await prisma.server.update({
        where: { id: server.id },
        data: {
          ipAddress: 'localhost', // Docker host
          port: result.gamePort,
          queryPort: result.queryPort,
          rustPlusPort: result.rconPort,
          status: 'STARTING',
          configuration: {
            ...(server.configuration as any),
            docker: {
              containerId: result.containerId,
              containerName: result.containerName,
              image: result.image,
              dataPath: result.dataPath,
              configPath: result.configPath,
            },
          },
        },
      });

      console.log(`[Provisioning] Rust server started: ${server.name} (${server.id})`);
      return { success: true, game: 'RUST' };
    }

    // Más játékok - TODO
    console.log(`[Provisioning] Game type not yet supported for auto-provisioning: ${server.gameType}`);
    return { success: false, reason: 'Game type not supported' };
  } catch (error) {
    console.error(`[Provisioning] Error triggering provisioning for ${serverId}:`, error);
    throw error;
  }
}
