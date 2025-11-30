import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { redirect } from 'next/navigation';
import { AdminNavigation } from '@/components/admin/AdminNavigation';
import { PremiumPackageForm } from '@/components/admin/cms/PremiumPackageForm';

export default async function NewPremiumPackagePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any).role !== UserRole.ADMIN) {
    redirect(`/${locale}/admin`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation locale={locale} />
      <main className="container mx-auto px-4 py-8">
        <PremiumPackageForm locale={locale} />
      </main>
    </div>
  );
}

