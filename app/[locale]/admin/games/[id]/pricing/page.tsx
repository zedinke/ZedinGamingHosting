import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { GamePricingForm } from '@/components/admin/GamePricingForm';
import { notFound } from 'next/navigation';

export default async function GamePricingPage({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  const gameConfig = await prisma.gameConfig.findUnique({
    where: { id },
    include: {
      pricingConfig: true,
    },
  });

  if (!gameConfig) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Árazási Konfiguráció</h1>
        <p className="text-gray-700">{gameConfig.displayName}</p>
      </div>

      <GamePricingForm
        locale={locale}
        gameConfigId={id}
        gameType={gameConfig.gameType}
        pricingConfig={gameConfig.pricingConfig}
      />
    </div>
  );
}

