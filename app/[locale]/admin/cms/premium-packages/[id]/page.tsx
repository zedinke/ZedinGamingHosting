import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { redirect, notFound } from 'next/navigation';
import { AdminNavigation } from '@/components/admin/AdminNavigation';
import { PremiumPackageForm } from '@/components/admin/cms/PremiumPackageForm';

export default async function EditPremiumPackagePage({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== UserRole.ADMIN) {
    redirect(`/${locale}/admin`);
  }

  const package_ = await prisma.premiumPackage.findUnique({
    where: { id },
    include: {
      games: {
        orderBy: {
          order: 'asc',
        },
      },
    },
  });

  if (!package_) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation locale={locale} />
      <main className="container mx-auto px-4 py-8">
        <PremiumPackageForm locale={locale} package_={package_} />
      </main>
    </div>
  );
}

