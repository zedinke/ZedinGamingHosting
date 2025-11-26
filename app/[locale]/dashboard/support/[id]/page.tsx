import { Navigation } from '@/components/Navigation';
import { getTranslations } from '@/lib/i18n';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { TicketView } from '@/components/support/TicketView';

export default async function TicketDetailPage({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  await requireAuth();
  const session = await getServerSession(authOptions);

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!ticket || ticket.userId !== (session?.user as any)?.id) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation locale={locale} />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <a
            href={`/${locale}/dashboard/support`}
            className="text-primary-600 hover:text-primary-700 mb-4 inline-block font-medium"
          >
            ← Vissza a ticketekhez
          </a>
          <TicketView ticket={ticket} locale={locale} />
        </div>
      </main>
    </div>
  );
}

