import { Navigation } from '@/components/Navigation';
import { getTranslations } from '@/lib/i18n';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { UserServerDetail } from '@/components/servers/UserServerDetail';

export default async function ServerDetailPage({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  await requireAuth();
  const session = await getServerSession(authOptions);

  const server = await prisma.server.findUnique({
    where: { id },
    include: {
      subscription: {
        include: {
          invoices: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
  });

  if (!server || server.userId !== (session?.user as any)?.id) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation locale={locale} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <a
            href={`/${locale}/dashboard`}
            className="text-primary-600 hover:text-primary-700 mb-4 inline-block font-medium"
          >
            ← Vissza a dashboard-hoz
          </a>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{server.name}</h1>
          <p className="text-gray-700">Szerver kezelése és monitorozása</p>
        </div>

        <UserServerDetail server={server} locale={locale} />
      </main>
    </div>
  );
}

