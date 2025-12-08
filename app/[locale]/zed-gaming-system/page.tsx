import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/home/Footer';
import { getTranslations } from '@/lib/i18n';
import { prisma } from '@/lib/prisma';
import { SaaSPlansSection } from '@/components/saas/SaaSPlansSection';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { readFileSync } from 'fs';
import { join } from 'path';

export default async function ZedGamingSystemPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = getTranslations(locale, 'common');

  let translations: any = {};
  try {
    const filePath = join(process.cwd(), 'public', 'locales', locale, 'common.json');
    const fileContents = readFileSync(filePath, 'utf8');
    translations = JSON.parse(fileContents);
  } catch (error) {
    console.error('Failed to load translations:', error);
  }

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
                {translations?.pages?.zedSystem?.title || 'Zed Gaming System'}
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-primary-100">
                {translations?.pages?.zedSystem?.subtitle || 'Full-stack gaming server hosting platform SaaS'}
              </p>
              <p className="text-lg text-primary-200 max-w-2xl mx-auto">
                {translations?.pages?.zedSystem?.description || 'Rent the complete platform monthly. All-in-one: server management, payments, CMS, admin panel and more.'}
              </p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
                {translations?.pages?.zedSystem?.featuresTitle || 'Why choose Zed Gaming System?'}
              </h2>
              
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    icon: '🎮',
                    title: translations?.pages?.zedSystem?.features?.games?.title || '60+ Game Support',
                    description: translations?.pages?.zedSystem?.features?.games?.description || 'Automated install and management for 60+ games',
                  },
                  {
                    icon: '💳',
                    title: translations?.pages?.zedSystem?.features?.payments?.title || 'Integrated Payments',
                    description: translations?.pages?.zedSystem?.features?.payments?.description || 'Stripe, PayPal, Revolut built-in',
                  },
                  {
                    icon: '📝',
                    title: translations?.pages?.zedSystem?.features?.cms?.title || 'Full CMS',
                    description: translations?.pages?.zedSystem?.features?.cms?.description || 'Blog, FAQ, page builder, pricing tables and more',
                  },
                  {
                    icon: '🤖',
                    title: translations?.pages?.zedSystem?.features?.ai?.title || 'AI Chat Support',
                    description: translations?.pages?.zedSystem?.features?.ai?.description || 'On-prem AI chat with localized responses',
                  },
                  {
                    icon: '📊',
                    title: translations?.pages?.zedSystem?.features?.monitoring?.title || 'Advanced Monitoring',
                    description: translations?.pages?.zedSystem?.features?.monitoring?.description || 'Real-time monitoring, analytics, performance metrics',
                  },
                  {
                    icon: '🔒',
                    title: translations?.pages?.zedSystem?.features?.security?.title || 'Secure & Scalable',
                    description: translations?.pages?.zedSystem?.features?.security?.description || 'Agent-based architecture, automatic load balancing',
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
                  {translations?.pages?.zedSystem?.pricing?.title || 'Choose a plan'}
                </h2>
                <p className="text-lg text-gray-600">
                  {translations?.pages?.zedSystem?.pricing?.subtitle || 'Every plan includes the full system and updates'}
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
                {translations?.pages?.zedSystem?.cta?.title || 'Ready for your own gaming hosting platform?'}
              </h2>
              <p className="text-xl mb-8 text-primary-100">
                {translations?.pages?.zedSystem?.cta?.subtitle || 'Choose a plan and start today!'}
              </p>
              <Link href={`/${locale}/zed-gaming-system#pricing`}>
                <Button size="lg" className="bg-white text-primary-600 hover:bg-gray-100">
                  {translations?.pages?.zedSystem?.cta?.button || 'View plans'}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer locale={locale} />
    </div>
  );
}

