import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/home/Footer';
import { getTranslations } from '@/lib/i18n';
import { prisma } from '@/lib/prisma';
import { SaaSPlansSection } from '@/components/saas/SaaSPlansSection';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default async function ZedGamingSystemPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = getTranslations(locale, 'common');

  // SaaS csomagok lekérése
  const plans = await prisma.saaSPlan.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation locale={locale} />
      
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Zed Gaming System
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-primary-100">
                Teljes körű gaming szerver hosting platform SaaS megoldás
              </p>
              <p className="text-lg text-primary-200 max-w-2xl mx-auto">
                Bérelje ki a teljes rendszert havidíjasan. Minden funkció egy helyen: 
                szerver kezelés, fizetési rendszer, CMS, admin vezérlőpult és még sok más.
              </p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
                Miért válassza a Zed Gaming System-et?
              </h2>
              
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    icon: '🎮',
                    title: '60+ Játék Támogatás',
                    description: 'Több mint 60 játék automatikus telepítése és kezelése',
                  },
                  {
                    icon: '💳',
                    title: 'Integrált Fizetési Rendszer',
                    description: 'Stripe, PayPal, Revolut integráció beépítve',
                  },
                  {
                    icon: '📝',
                    title: 'Teljes CMS Rendszer',
                    description: 'Blog, FAQ, oldalépítő, árazási táblázat és még sok más',
                  },
                  {
                    icon: '🤖',
                    title: 'AI Chat Támogatás',
                    description: 'Helyben futó AI chat rendszer magyar nyelvű válaszokkal',
                  },
                  {
                    icon: '📊',
                    title: 'Fejlett Monitoring',
                    description: 'Real-time monitoring, analytics és teljesítmény metrikák',
                  },
                  {
                    icon: '🔒',
                    title: 'Biztonságos és Skálázható',
                    description: 'Agent-based architektúra, automatikus terheléselosztás',
                  },
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="text-4xl mb-4">{feature.icon}</div>
                    <h3 className="text-xl font-bold mb-2 text-gray-900">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4 text-gray-900">
                  Válasszon egy csomagot
                </h2>
                <p className="text-lg text-gray-600">
                  Minden csomag tartalmazza a teljes rendszert és frissítéseket
                </p>
              </div>

              <SaaSPlansSection plans={plans} locale={locale} />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary-600 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">
                Készen áll a saját gaming hosting platformjára?
              </h2>
              <p className="text-xl mb-8 text-primary-100">
                Válasszon egy csomagot és kezdje el még ma!
              </p>
              <Link href={`/${locale}/zed-gaming-system#pricing`}>
                <Button size="lg" className="bg-white text-primary-600 hover:bg-gray-100">
                  Csomagok megtekintése
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

