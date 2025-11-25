import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AgentManagement } from '@/components/admin/AgentManagement';

export default async function AdminAgentsPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { page?: string; status?: string; machineId?: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== UserRole.ADMIN) {
    redirect(`/${locale}/login`);
  }

  const page = parseInt(searchParams.page || '1');
  const limit = 20;
  const status = searchParams.status;
  const machineId = searchParams.machineId;

  const where: any = {};
  if (status) {
    where.status = status;
  }
  if (machineId) {
    where.machineId = machineId;
  }

  const [agents, total] = await Promise.all([
    prisma.agent.findMany({
      where,
      include: {
        machine: {
          select: {
            id: true,
            name: true,
            ipAddress: true,
          },
        },
        _count: {
          select: {
            servers: true,
            tasks: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.agent.count({ where }),
  ]);

  const machines = await prisma.serverMachine.findMany({
    select: {
      id: true,
      name: true,
      ipAddress: true,
    },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Agentek Kezelése</h1>
        <p className="text-gray-600 mt-2">
          Kezeld a game szerver agenteket
        </p>
      </div>

      <AgentManagement
        agents={agents as any}
        machines={machines}
        currentPage={page}
        totalPages={Math.ceil(total / limit)}
        locale={locale}
        statusFilter={status}
        machineFilter={machineId}
      />
    </div>
  );
}

