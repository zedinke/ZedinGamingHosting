import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { TicketDetail } from '@/components/admin/TicketDetail';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export default async function AdminTicketDetailPage({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  await requireAdmin(locale);
  const session = await getServerSession(authOptions);
  const t = getTranslations(locale, 'common');

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      messages: {
        orderBy: { createdAt: 'asc' },
        include: {
          ticket: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  });

  if (!ticket) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6">
        <a
          href={`/${locale}/admin/tickets`}
          className="text-primary-600 hover:underline mb-4 inline-block"
        >
          ← Vissza a ticketekhez
        </a>
        <h1 className="text-3xl font-bold mb-2">{ticket.subject}</h1>
        <p className="text-gray-600">Ticket részletek és válaszadás</p>
      </div>

      <TicketDetail
        ticket={ticket}
        locale={locale}
        adminId={(session?.user as any)?.id}
      />
    </div>
  );
}

