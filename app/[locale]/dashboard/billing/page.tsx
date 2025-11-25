import { Navigation } from '@/components/Navigation';
import { getTranslations } from '@/lib/i18n';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { BillingOverview } from '@/components/billing/BillingOverview';

export default async function BillingPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  await requireAuth();
  const session = await getServerSession(authOptions);

  const [invoices, subscriptions] = await Promise.all([
    prisma.invoice.findMany({
      where: { userId: (session?.user as any)?.id },
      orderBy: { createdAt: 'desc' },
      include: {
        subscription: {
          include: {
            server: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.subscription.findMany({
      where: { userId: (session?.user as any)?.id },
      include: {
        server: {
          select: {
            name: true,
            gameType: true,
          },
        },
      },
    }),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation locale={locale} />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Számlázás</h1>
        <BillingOverview
          invoices={invoices}
          subscriptions={subscriptions}
          locale={locale}
        />
      </main>
    </div>
  );
}

