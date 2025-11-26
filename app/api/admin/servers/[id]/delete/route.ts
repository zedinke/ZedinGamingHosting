import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { createNotification, sendNotification } from '@/lib/notifications';
import { sendEmail } from '@/lib/email';
import { executeSSHCommand } from '@/lib/ssh-client';
import { logger } from '@/lib/logger';
import { createAuditLog, AuditAction } from '@/lib/audit-log';

// DELETE - Szerver törlése indoklással
export async function DELETE(
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
    const body = await request.json();
    const { reason } = body;

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { error: 'Indoklás kötelező a szerver törléséhez' },
        { status: 400 }
      );
    }

    // Szerver keresése
    const server = await prisma.server.findUnique({
      where: { id },
      include: {
        user: true,
        machine: true,
        agent: true,
        subscription: true,
      },
    });

    if (!server) {
      return NextResponse.json(
        { error: 'Szerver nem található' },
        { status: 404 }
      );
    }

    logger.info('Deleting server', {
      serverId: id,
      serverName: server.name,
      userId: server.userId,
      adminId: (session.user as any).id,
      reason: reason.substring(0, 100), // Log csak első 100 karakter
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

    // Szerver fájlok törlése a gépen
    if (server.machine && server.agent) {
      try {
        const isARK = server.gameType === 'ARK_EVOLVED' || server.gameType === 'ARK_ASCENDED';
        let serverPath: string;

        if (isARK) {
          const { getARKSharedPath } = await import('@/lib/ark-cluster');
          const sharedPath = getARKSharedPath(server.userId, server.machineId!);
          serverPath = `${sharedPath}/instances/${server.id}`;
        } else {
          serverPath = `/opt/servers/${server.id}`;
        }

        const sshConfig = {
          host: server.machine.ipAddress,
          port: server.machine.sshPort,
          user: server.machine.sshUser,
          keyPath: server.machine.sshKeyPath || undefined,
        };

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
      } catch (error) {
        logger.warn('Failed to delete server files', { error });
        // Folytatjuk a törlést még akkor is, ha a fájlok törlése sikertelen volt
      }
    }

    // Admin-ok és manager-ek lekérdezése (értesítéshez)
    const adminsAndManagers = await prisma.user.findMany({
      where: {
        role: {
          in: [UserRole.ADMIN, UserRole.MODERATOR], // MODERATOR = manager
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    // Értesítés küldése a felhasználónak
    await sendNotification(server.userId, {
      type: 'SERVER_DELETED',
      title: 'Szerver törölve',
      message: `A(z) "${server.name}" szervered törölve lett. Indoklás: ${reason}`,
      priority: 'high',
      data: {
        serverId: server.id,
        serverName: server.name,
        reason,
        deletedBy: (session.user as any).id,
        deletedAt: new Date().toISOString(),
      },
    }).catch(console.error);

    // Email küldése a felhasználónak
    if (server.user.email) {
      await sendEmail({
        to: server.user.email,
        subject: `Szerver törölve - ${server.name}`,
        html: `
          <h2>Szerver törölve</h2>
          <p>Kedves ${server.user.name || 'Felhasználó'}!</p>
          <p>A(z) <strong>"${server.name}"</strong> szervered törölve lett.</p>
          <p><strong>Indoklás:</strong> ${reason}</p>
          <p>Ha kérdésed van, kérjük, lépj kapcsolatba az ügyfélszolgálattal.</p>
          <p>Üdvözlettel,<br>ZedinGamingHosting Csapat</p>
        `,
      }).catch(console.error);
    }

    // Értesítés küldése minden admin-nak és manager-nek
    for (const admin of adminsAndManagers) {
      if (admin.id !== (session.user as any).id) {
        // Ne küldjünk értesítést annak, aki törölte
        await sendNotification(admin.id, {
          type: 'SERVER_DELETED',
          title: 'Szerver törölve',
          message: `A(z) "${server.name}" szerver törölve lett ${server.user.name || server.user.email} felhasználótól. Indoklás: ${reason}`,
          priority: 'medium',
          data: {
            serverId: server.id,
            serverName: server.name,
            userId: server.userId,
            userName: server.user.name || server.user.email,
            reason,
            deletedBy: (session.user as any).id,
            deletedAt: new Date().toISOString(),
          },
        }).catch(console.error);

        // Email küldése admin-oknak/manager-eknek
        if (admin.email) {
          await sendEmail({
            to: admin.email,
            subject: `Szerver törölve - ${server.name}`,
            html: `
              <h2>Szerver törölve</h2>
              <p>Kedves ${admin.name || 'Admin'}!</p>
              <p>A(z) <strong>"${server.name}"</strong> szerver törölve lett.</p>
              <p><strong>Felhasználó:</strong> ${server.user.name || server.user.email}</p>
              <p><strong>Indoklás:</strong> ${reason}</p>
              <p><strong>Törölte:</strong> ${(session.user as any).name || (session.user as any).email}</p>
              <p>Üdvözlettel,<br>ZedinGamingHosting Rendszer</p>
            `,
          }).catch(console.error);
        }
      }
    }

    // Audit log
    await createAuditLog({
      userId: (session.user as any).id,
      action: AuditAction.DELETE,
      resourceType: 'Server',
      resourceId: server.id,
      details: {
        serverName: server.name,
        userId: server.userId,
        reason,
      },
    }).catch(console.error);

    // Előfizetés törlése (ha van)
    if (server.subscription) {
      await prisma.subscription.delete({
        where: { id: server.subscription.id },
      }).catch(console.error);
    }

    // Szerver törlése az adatbázisból
    await prisma.server.delete({
      where: { id },
    });

    logger.info('Server deleted successfully', {
      serverId: id,
      serverName: server.name,
    });

    return NextResponse.json({
      success: true,
      message: 'Szerver sikeresen törölve',
    });
  } catch (error: any) {
    logger.error('Server deletion error', error as Error, {
      serverId: params.id,
    });

    return NextResponse.json(
      { error: error.message || 'Hiba történt a szerver törlése során' },
      { status: 500 }
    );
  }
}

