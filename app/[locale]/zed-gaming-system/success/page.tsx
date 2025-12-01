import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/home/Footer';
import { getTranslations } from '@/lib/i18n';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { CheckCircle, Key, Mail } from 'lucide-react';

export default async function SAASOrderSuccessPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { order_id?: string; session_id?: string };
}) {
  const t = getTranslations(locale, 'common');

  if (!searchParams.order_id) {
    redirect(`/${locale}/zed-gaming-system`);
  }

  const order = await prisma.saaSOrder.findUnique({
    where: { id: searchParams.order_id },
    include: { plan: true },
  });

  if (!order) {
    redirect(`/${locale}/zed-gaming-system`);
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation locale={locale} />
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <Card padding="lg" className="text-center">
            <div className="mb-6">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h1 className="text-3xl font-bold mb-2 text-gray-900">
                Megrendelés sikeres!
              </h1>
              <p className="text-gray-600">
                Köszönjük a megrendelését!
              </p>
            </div>

            {order.licenseKey ? (
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-center mb-4">
                  <Key className="w-8 h-8 text-green-600 mr-2" />
                  <h2 className="text-xl font-bold text-green-900">License Key</h2>
                </div>
                <code className="block text-2xl font-mono bg-white px-4 py-3 rounded border-2 border-green-300 mb-4">
                  {order.licenseKey}
                </code>
                <p className="text-sm text-green-800 mb-2">
                  ⚠️ Kérjük, mentsd el ezt a kulcsot biztonságos helyen!
                </p>
                <p className="text-xs text-green-700">
                  A license key-t email-ben is elküldtük a következő címre: {order.customerEmail}
                </p>
              </div>
            ) : (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 mb-6">
                <p className="text-yellow-800">
                  A license key generálása folyamatban van. Hamarosan email-ben is megkapod.
                </p>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
              <h3 className="font-bold mb-4 text-gray-900">Megrendelés részletei</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Csomag:</span>
                  <span className="font-semibold">{order.plan.displayName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Összeg:</span>
                  <span className="font-semibold">{formatPrice(order.amount, order.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Időtartam:</span>
                  <span className="font-semibold">
                    {order.plan.interval === 'month' ? '1 hónap' : order.plan.interval === 'year' ? '1 év' : order.plan.interval}
                  </span>
                </div>
                {order.startDate && order.endDate && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Kezdés:</span>
                      <span className="font-semibold">
                        {new Intl.DateTimeFormat('hu-HU').format(new Date(order.startDate))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Lejárat:</span>
                      <span className="font-semibold">
                        {new Intl.DateTimeFormat('hu-HU').format(new Date(order.endDate))}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-semibold">{order.customerEmail}</span>
                </div>
              </div>
            </div>

            {order.invoiceSent && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-600 mr-2" />
                <p className="text-blue-800 text-sm">
                  A számlát email-ben elküldtük a következő címre: {order.customerEmail}
                </p>
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <Link href={`/${locale}/dashboard`}>
                <Button variant="outline">
                  Vissza a Dashboard-ra
                </Button>
              </Link>
              <Link href={`/${locale}/zed-gaming-system`}>
                <Button>
                  További információ
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}

