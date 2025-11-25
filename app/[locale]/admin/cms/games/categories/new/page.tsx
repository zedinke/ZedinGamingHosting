import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { GameCategoryForm } from '@/components/admin/cms/GameCategoryForm';

export default async function NewGameCategoryPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Új Játék Kategória</h1>
        <p className="text-gray-700">Játék kategória hozzáadása</p>
      </div>

      <GameCategoryForm locale={locale} />
    </div>
  );
}

