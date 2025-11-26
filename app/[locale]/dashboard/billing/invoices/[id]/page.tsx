import { Navigation } from '@/components/Navigation';
import { requireAuth } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { InvoiceDetail } from '@/components/billing/InvoiceDetail';

export default async function InvoiceDetailPage({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  await requireAuth();
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      subscription: {
        include: {
          server: {
            select: {
              id: true,
              name: true,
              gameType: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!invoice || invoice.userId !== userId) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation locale={locale} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <a
            href={`/${locale}/dashboard/billing`}
            className="text-primary-600 hover:text-primary-700 mb-4 inline-block font-medium"
          >
            ← Vissza a számlázáshoz
          </a>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Számla Részletek</h1>
          <p className="text-gray-700">Számlaszám: {invoice.invoiceNumber}</p>
        </div>

        <InvoiceDetail invoice={invoice} locale={locale} />
      </main>
    </div>
  );
}

