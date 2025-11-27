import { Navigation } from '@/components/Navigation';
import { getTranslations } from '@/lib/i18n';
import { requireAuth } from '@/lib/auth-helpers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ServerOrderForm } from '@/components/servers/ServerOrderForm';
import { Footer } from '@/components/home/Footer';

export default async function NewServerPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { plan?: string; game?: string; package?: string; gameType?: string };
}) {
  await requireAuth();
  const t = getTranslations(locale, 'common');

  // Game package ellenőrzése - kötelező
  if (!searchParams.package) {
    redirect(`/${locale}/games`);
  }

  const selectedGamePackage = await prisma.gamePackage.findUnique({
    where: { id: searchParams.package },
  });

  if (!selectedGamePackage || !selectedGamePackage.isActive) {
    redirect(`/${locale}/games`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation locale={locale} />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Új Szerver Rendelése
            </h1>
            <p className="text-xl text-gray-800 font-medium">
              Töltsd ki az alábbi űrlapot és szervered percek alatt készen áll
            </p>
          </div>

          <ServerOrderForm
            selectedGamePackage={selectedGamePackage}
            locale={locale}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}

