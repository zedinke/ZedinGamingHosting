import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { redirect } from 'next/navigation';
import { PremiumPackageManagement } from '@/components/admin/cms/PremiumPackageManagement';

export default async function PremiumPackagesPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== UserRole.ADMIN) {
    redirect(`/${locale}/admin`);
  }

  const packages = await prisma.premiumPackage.findMany({
    include: {
      games: {
        orderBy: {
          order: 'asc',
        },
      },
      _count: {
        select: {
          servers: true,
        },
      },
    },
    orderBy: {
      order: 'asc',
    },
  });

  return <PremiumPackageManagement packages={packages} locale={locale} />;
}

