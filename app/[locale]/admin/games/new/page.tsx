import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { GameConfigForm } from '@/components/admin/GameConfigForm';

export default async function NewGameConfigPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Új Játék Konfiguráció</h1>
        <p className="text-gray-700">Játék telepítési és indítási paramétereinek beállítása</p>
      </div>

      <GameConfigForm locale={locale} />
    </div>
  );
}

