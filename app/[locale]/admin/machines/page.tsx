import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { MachineManagement } from '@/components/admin/MachineManagement';

export default async function AdminMachinesPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { page?: string; status?: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== UserRole.ADMIN) {
    redirect(`/${locale}/login`);
  }

  const page = parseInt(searchParams.page || '1');
  const limit = 20;
  const status = searchParams.status;

  const where: any = {};
  if (status) {
    where.status = status;
  }

  const [machines, total] = await Promise.all([
    prisma.serverMachine.findMany({
      where,
      include: {
        agents: {
          select: {
            id: true,
            agentId: true,
            status: true,
            lastHeartbeat: true,
          },
        },
        _count: {
          select: {
            agents: true,
            servers: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.serverMachine.count({ where }),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Szerver Gépek Kezelése</h1>
        <p className="text-gray-700">
          Összes szerver gép: <span className="font-semibold text-gray-900">{total}</span>
        </p>
      </div>

      <MachineManagement
        machines={machines as any}
        currentPage={page}
        totalPages={Math.ceil(total / limit)}
        locale={locale}
        statusFilter={status}
      />
    </div>
  );
}

