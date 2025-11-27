import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { GameConfigManagement } from '@/components/admin/GameConfigManagement';

export default async function AdminGamesPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  const gameConfigs = await prisma.gameConfig.findMany({
    include: {
      pricingConfig: true,
    },
    orderBy: [
      { order: 'asc' },
      { displayName: 'asc' },
    ],
  });

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Játékok Konfigurációja</h1>
          <p className="text-gray-700">Játékok telepítési és indítási paramétereinek kezelése</p>
        </div>
        <a
          href={`/${locale}/admin/games/new`}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-sm hover:shadow-md"
        >
          Új Játék Konfiguráció
        </a>
      </div>

      <GameConfigManagement gameConfigs={gameConfigs} locale={locale} />
    </div>
  );
}

