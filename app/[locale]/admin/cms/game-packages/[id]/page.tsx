import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { redirect, notFound } from 'next/navigation';
import { AdminNavigation } from '@/components/admin/AdminNavigation';
import { GamePackageForm } from '@/components/admin/cms/GamePackageForm';

export default async function EditGamePackagePage({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== UserRole.ADMIN) {
    redirect(`/${locale}/admin`);
  }

  const packageData = await prisma.gamePackage.findUnique({
    where: { id },
  });

  if (!packageData) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation locale={locale} />
      <main className="container mx-auto px-4 py-8">
        <GamePackageForm locale={locale} package={packageData} />
      </main>
    </div>
  );
}

