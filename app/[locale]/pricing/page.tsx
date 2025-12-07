import { Navigation } from '@/components/Navigation';
import { getTranslations } from '@/lib/i18n';
import { prisma } from '@/lib/prisma';
import { PricingSection } from '@/components/PricingSection';
import { readFileSync } from 'fs';
import { join } from 'path';

export default async function PricingPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = getTranslations(locale, 'common');

  // Load translations server-side
  let translations: any = {};
  try {
    const filePath = join(process.cwd(), 'public', 'locales', locale, 'common.json');
    const fileContents = readFileSync(filePath, 'utf8');
    translations = JSON.parse(fileContents);
  } catch (error) {
    console.error('Failed to load translations:', error);
  }

  const plans = await prisma.pricingPlan.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation locale={locale} />
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
            {translations?.pages?.pricing?.title || 'Pricing'}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {translations?.pages?.pricing?.subtitle || 'Choose a plan that fits your needs'}
          </p>
        </div>

        <PricingSection plans={plans} locale={locale} />
      </main>
    </div>
  );
}

