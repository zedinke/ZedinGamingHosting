import { prisma } from '@/lib/prisma';
import { executeSSHCommand } from '@/lib/ssh-client';
import { deleteSFTPUser } from './sftp-user-manager';
import { logger } from './logger';

interface DeleteServerOptions {
  serverId: string;
  reason?: string;
  deletedBy?: string;
  skipNotification?: boolean;
}

/**
 * Központi szerver törlési funkció
 * Ezt használhatjuk admin törléshez és automatikus cleanup-hoz is
 */
export async function deleteServer(options: DeleteServerOptions): Promise<{
  success: boolean;
  error?: string;
}> {
  const { serverId, reason, deletedBy, skipNotification = false } = options;

  try {
    // Szerver lekérdezése
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      include: {
        user: true,
        machine: true,
        agent: true,
        subscription: true,
      },
    });

    if (!server) {
      return {
        success: false,
        error: 'Szerver nem található',
      };
    }

    logger.info('Deleting server', {
      serverId,
      serverName: server.name,
      userId: server.userId,
      deletedBy,
      reason: reason?.substring(0, 100),
    });

    // Szerver leállítása (ha fut)
    if (server.status === 'ONLINE' || server.status === 'STARTING') {
      if (server.agent && server.machine) {
        try {
          await prisma.task.create({
            data: {
              agentId: server.agentId!,
              serverId: server.id,
              type: 'STOP',
              status: 'PENDING',
              command: {
                action: 'stop',
                serverId: server.id,
              },
            },
          });

          // Várunk, hogy a szerver leálljon
          await new Promise(resolve => setTimeout(resolve, 5000));
        } catch (error) {
          logger.warn('Failed to stop server before deletion', { error });
        }
      }
    }

    // Szerver fájlok és SFTP felhasználó törlése a gépen
    if (server.machine) {
      try {
        const sshConfig = {
          host: server.machine.ipAddress,
          port: server.machine.sshPort,
          user: server.machine.sshUser,
          keyPath: server.machine.sshKeyPath || undefined,
        };

        // Szerver könyvtár törlése
        const isARK = server.gameType === 'ARK_EVOLVED' || server.gameType === 'ARK_ASCENDED';
        let serverPath: string;

        if (isARK) {
          const { getARKSharedPath } = await import('./ark-cluster');
          const sharedPath = getARKSharedPath(server.userId, server.machineId!);
          serverPath = `${sharedPath}/instances/${server.id}`;
        } else {
          serverPath = `/opt/servers/${server.id}`;
        }

        // Szerver könyvtár törlése
        await executeSSHCommand(
          sshConfig,
          `rm -rf "${serverPath}" 2>&1 || echo "Directory deletion failed"`
        );

        // Backup könyvtár törlése
        const backupPath = `/opt/backups/${server.id}`;
        await executeSSHCommand(
          sshConfig,
          `rm -rf "${backupPath}" 2>&1 || echo "Backup deletion failed"`
        );

        // SFTP felhasználó törlése, ha létezik
        if (server.sftpUsername) {
          try {
            const deleteResult = await deleteSFTPUser(server.sftpUsername, sshConfig);

            if (deleteResult.success) {
              logger.info('SFTP user deleted successfully during server deletion', {
                serverId: server.id,
                sftpUsername: server.sftpUsername,
              });
            } else {
              logger.warn('Failed to delete SFTP user during server deletion', {
                serverId: server.id,
                sftpUsername: server.sftpUsername,
                error: deleteResult.error,
              });
              // Folytatjuk a törlést még akkor is, ha az SFTP felhasználó törlése sikertelen volt
            }
          } catch (sftpError) {
            logger.warn('Error deleting SFTP user during server deletion', {
              serverId: server.id,
              sftpUsername: server.sftpUsername,
              error: sftpError,
            });
            // Folytatjuk a törlést még akkor is, ha az SFTP felhasználó törlése sikertelen volt
          }
        }
      } catch (error) {
        logger.warn('Failed to delete server files and SFTP user', { error });
        // Folytatjuk a törlést még akkor is, ha a fájlok törlése sikertelen volt
      }
    }

    // Értesítések küldése (ha nem skipeljük)
    if (!skipNotification) {
      try {
        const { sendNotification } = await import('./notifications');
        const { sendEmail } = await import('./email');
        const { getServerDeletedUserEmailTemplate, getServerDeletedAdminEmailTemplate } = await import('./email-templates');
        const { UserRole } = await import('@prisma/client');

        // Értesítés küldése a felhasználónak
        await sendNotification(server.userId, {
          type: 'SERVER_DELETED',
          title: 'Szerver törölve',
          message: `A(z) "${server.name}" szervered törölve lett.${reason ? ` Indoklás: ${reason}` : ''}`,
          priority: 'high',
          data: {
            serverId: server.id,
            serverName: server.name,
            reason: reason || 'Automatikus törlés',
            deletedBy,
            deletedAt: new Date().toISOString(),
          },
        }).catch(console.error);

        // Email küldése a felhasználónak
        if (server.user.email) {
          const html = getServerDeletedUserEmailTemplate(
            server.name,
            server.user.name || 'Felhasználó',
            reason || 'Automatikus törlés',
            'hu'
          );

          await sendEmail({
            to: server.user.email,
            subject: `Szerver törölve - ${server.name}`,
            html,
          }).catch(console.error);
        }

        // Admin-ok és manager-ek értesítése (ha van deletedBy, és az nem admin)
        if (deletedBy) {
          const adminsAndManagers = await prisma.user.findMany({
            where: {
              role: {
                in: [UserRole.ADMIN, UserRole.MODERATOR],
              },
              id: { not: deletedBy },
            },
            select: {
              id: true,
              email: true,
              name: true,
            },
          });

          for (const admin of adminsAndManagers) {
            await sendNotification(admin.id, {
              type: 'SERVER_DELETED',
              title: 'Szerver törölve',
              message: `A(z) "${server.name}" szerver törölve lett ${server.user.name || server.user.email} felhasználótól.${reason ? ` Indoklás: ${reason}` : ''}`,
              priority: 'medium',
              data: {
                serverId: server.id,
                serverName: server.name,
                userId: server.userId,
                userName: server.user.name || server.user.email,
                reason: reason || 'Automatikus törlés',
                deletedBy,
                deletedAt: new Date().toISOString(),
              },
            }).catch(console.error);

            if (admin.email) {
              const deletedByUser = await prisma.user.findUnique({
                where: { id: deletedBy },
                select: { name: true, email: true },
              });

              const html = getServerDeletedAdminEmailTemplate(
                server.name,
                server.user.name || server.user.email,
                server.user.email,
                reason || 'Automatikus törlés',
                deletedByUser?.name || deletedByUser?.email || 'Rendszer',
                'hu'
              );

              await sendEmail({
                to: admin.email,
                subject: `Szerver törölve - ${server.name}`,
                html,
              }).catch(console.error);
            }
          }
        }
      } catch (notificationError) {
        logger.warn('Failed to send notifications during server deletion', {
          serverId,
          error: notificationError,
        });
        // Folytatjuk a törlést még akkor is, ha az értesítések küldése sikertelen volt
      }
    }

    // Audit log (ha van deletedBy)
    if (deletedBy) {
      try {
        const { createAuditLog, AuditAction } = await import('./audit-log');
        await createAuditLog({
          userId: deletedBy,
          action: AuditAction.DELETE,
          resourceType: 'Server',
          resourceId: server.id,
          details: {
            serverName: server.name,
            userId: server.userId,
            reason: reason || 'Automatikus törlés',
          },
        }).catch(console.error);
      } catch (auditError) {
        logger.warn('Failed to create audit log during server deletion', {
          serverId,
          error: auditError,
        });
      }
    }

    // Előfizetés törlése (ha van)
    if (server.subscription) {
      await prisma.subscription.delete({
        where: { id: server.subscription.id },
      }).catch(console.error);
    }

    // Szerver törlése az adatbázisból
    await prisma.server.delete({
      where: { id: serverId },
    });

    logger.info('Server deleted successfully', {
      serverId,
      serverName: server.name,
    });

    return { success: true };
  } catch (error: any) {
    logger.error('Server deletion error', error as Error, {
      serverId,
    });

    return {
      success: false,
      error: error.message || 'Ismeretlen hiba',
    };
  }
}

