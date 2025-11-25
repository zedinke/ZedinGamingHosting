import { Navigation } from '@/components/Navigation';
import { getTranslations } from '@/lib/i18n';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { SupportTicketList } from '@/components/support/SupportTicketList';

export default async function SupportPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  await requireAuth();
  const session = await getServerSession(authOptions);
  const t = getTranslations(locale, 'common');

  const tickets = await prisma.supportTicket.findMany({
    where: { userId: (session?.user as any)?.id },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          messages: true,
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation locale={locale} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Támogatás</h1>
            <p className="text-gray-600">Ticketek kezelése</p>
          </div>
          <a
            href={`/${locale}/dashboard/support/new`}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
          >
            Új ticket
          </a>
        </div>

        <SupportTicketList tickets={tickets} locale={locale} />
      </main>
    </div>
  );
}

