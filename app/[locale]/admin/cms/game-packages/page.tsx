import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { redirect } from 'next/navigation';
import { AdminNavigation } from '@/components/admin/AdminNavigation';
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

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation locale={locale} />
      <main className="container mx-auto px-4 py-8">
        <GamePackageManagement packages={packages} locale={locale} />
      </main>
    </div>
  );
}

