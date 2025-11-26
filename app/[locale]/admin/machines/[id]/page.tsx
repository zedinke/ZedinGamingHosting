import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { MachineDetail } from '@/components/admin/MachineDetail';

export default async function AdminMachineDetailPage({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== UserRole.ADMIN) {
    redirect(`/${locale}/login`);
  }

  const machine = await prisma.serverMachine.findUnique({
    where: { id },
    include: {
      agents: {
        include: {
          _count: {
            select: {
              servers: true,
              tasks: true,
            },
          },
        },
      },
      servers: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!machine) {
    redirect(`/${locale}/admin/machines`);
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/${locale}/admin/machines`}
          className="text-primary-600 hover:text-primary-700 hover:underline mb-2 inline-block font-medium"
        >
          ← Vissza a gépek listájához
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Szerver Gép Részletei</h1>
        <p className="text-gray-700">
          {machine.name} • {machine.ipAddress}
        </p>
      </div>

      <MachineDetail machine={machine as any} locale={locale} />
    </div>
  );
}

