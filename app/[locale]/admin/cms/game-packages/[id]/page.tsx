import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { redirect, notFound } from 'next/navigation';
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

  return <GamePackageForm locale={locale} package={packageData} />;
}

