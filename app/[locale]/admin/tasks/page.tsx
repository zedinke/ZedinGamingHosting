import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { TaskManagement } from '@/components/admin/TaskManagement';

export default async function AdminTasksPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { page?: string; status?: string; type?: string; agentId?: string; serverId?: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== UserRole.ADMIN) {
    redirect(`/${locale}/login`);
  }

  const page = parseInt(searchParams.page || '1');
  const limit = 20;
  const status = searchParams.status;
  const type = searchParams.type;
  const agentId = searchParams.agentId;
  const serverId = searchParams.serverId;

  const where: any = {};
  if (status) {
    where.status = status;
  }
  if (type) {
    where.type = type;
  }
  if (agentId) {
    where.agentId = agentId;
  }
  if (serverId) {
    where.serverId = serverId;
  }

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        agent: {
          include: {
            machine: {
              select: {
                id: true,
                name: true,
                ipAddress: true,
              },
            },
          },
        },
        server: {
          select: {
            id: true,
            name: true,
            gameType: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.task.count({ where }),
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Feladatok Kezelése</h1>
        <p className="text-gray-600 mt-2">
          Kezeld a szerver műveletek feladatütemezését
        </p>
      </div>

      <TaskManagement
        tasks={tasks as any}
        currentPage={page}
        totalPages={Math.ceil(total / limit)}
        locale={locale}
        statusFilter={status}
        typeFilter={type}
      />
    </div>
  );
}

