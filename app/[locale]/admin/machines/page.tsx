import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
// import { MachineManagement } from '@/components/admin/MachineManagement';

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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Szerver Gépek Kezelése</h1>
        <p className="text-gray-600 mt-2">
          Kezeld a game szerver gépeket és agenteket
        </p>
      </div>

      <div className="p-6 bg-white rounded-lg shadow">
        <p className="text-gray-600 mb-4">Machine Management - Coming soon</p>
        <p className="text-sm text-gray-500">
          {total} gép található
        </p>
      </div>
    </div>
  );
}

