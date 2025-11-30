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
  searchParams: { plan?: string; game?: string; package?: string; gameType?: string; premiumPackage?: string };
}) {
  await requireAuth();
  const t = getTranslations(locale, 'common');

  // Premium package vagy game package ellenőrzése - legalább egy kötelező
  if (!searchParams.package && !searchParams.premiumPackage) {
    redirect(`/${locale}/games`);
  }

  // Premium package kezelése
  if (searchParams.premiumPackage) {
    const selectedPremiumPackage = await prisma.premiumPackage.findUnique({
      where: { id: searchParams.premiumPackage },
      include: {
        games: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!selectedPremiumPackage || !selectedPremiumPackage.isActive) {
      redirect(`/${locale}/games`);
    }

    // Lekérjük a GameConfig adatokat a játékokhoz
    const gameTypes = selectedPremiumPackage.games.map((g) => g.gameType);
    const gameConfigs = await prisma.gameConfig.findMany({
      where: {
        gameType: {
          in: gameTypes,
        },
      },
    });

    // Átalakítjuk az adatokat a komponens által várt formátumra
    const transformedPremiumPackage = {
      id: selectedPremiumPackage.id,
      nameHu: selectedPremiumPackage.nameHu,
      nameEn: selectedPremiumPackage.nameEn,
      descriptionHu: selectedPremiumPackage.descriptionHu,
      descriptionEn: selectedPremiumPackage.descriptionEn,
      price: selectedPremiumPackage.price,
      currency: selectedPremiumPackage.currency,
      interval: selectedPremiumPackage.interval,
      discountPrice: selectedPremiumPackage.discountPrice,
      image: selectedPremiumPackage.image,
      videoUrl: selectedPremiumPackage.videoUrl,
      cpuCores: selectedPremiumPackage.cpuCores,
      ram: selectedPremiumPackage.ram,
      games: selectedPremiumPackage.games.map((game) => {
        const gameConfig = gameConfigs.find((gc) => gc.gameType === game.gameType);
        return {
          gameType: game.gameType,
          displayName: gameConfig?.displayName || game.gameType,
          image: gameConfig?.image || null,
          videoUrl: gameConfig?.videoUrl || null,
          description: gameConfig?.description || null,
        };
      }),
    };

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
              selectedPremiumPackage={transformedPremiumPackage}
              locale={locale}
            />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Game package kezelése (eredeti logika)
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

