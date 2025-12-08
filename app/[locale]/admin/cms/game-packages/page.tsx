import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { redirect } from 'next/navigation';
import { GamePackageManagement } from '@/components/admin/cms/GamePackageManagement';

export default async function GamePackagesPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== UserRole.ADMIN) {
    redirect(`/${locale}/admin`);
  }

  const packages = await prisma.gamePackage.findMany({
    orderBy: [
      { gameType: 'asc' },
      { order: 'asc' },
      { createdAt: 'desc' },
    ],
  });

  return <GamePackageManagement packages={packages} locale={locale} />;
}

