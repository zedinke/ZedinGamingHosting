import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { SubscriptionDetail } from '@/components/admin/SubscriptionDetail';
import { notFound } from 'next/navigation';

export default async function AdminSubscriptionDetailPage({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  const subscription = await prisma.subscription.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      server: {
        select: {
          id: true,
          name: true,
          gameType: true,
          status: true,
          port: true,
          ipAddress: true,
        },
      },
      invoices: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          invoiceNumber: true,
          amount: true,
          currency: true,
          status: true,
          dueDate: true,
          paidAt: true,
          createdAt: true,
        },
      },
    },
  });

  if (!subscription) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Előfizetés Részletei</h1>
        <p className="text-gray-600">
          Előfizetés ID: <span className="font-mono text-sm">{subscription.id}</span>
        </p>
      </div>

      <SubscriptionDetail subscription={subscription as any} locale={locale} />
    </div>
  );
}

