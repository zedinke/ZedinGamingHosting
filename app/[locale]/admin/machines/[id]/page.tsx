import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href={`/${locale}/admin/machines`}
          className="text-primary-600 hover:underline mb-2 inline-block"
        >
          ← Vissza a gépek listájához
        </Link>
        <h1 className="text-3xl font-bold">Szerver Gép Részletei</h1>
      </div>

      <div className="p-6 bg-white rounded-lg shadow">
        <p className="text-gray-600">Machine Detail - Coming soon</p>
        <pre className="mt-4 text-xs bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(machine, null, 2)}
        </pre>
      </div>
    </div>
  );
}

