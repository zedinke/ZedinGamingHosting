import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { GameForm } from '@/components/admin/cms/GameForm';
import { prisma } from '@/lib/prisma';

export default async function NewGamePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  const categories = await prisma.gameCategory.findMany({
    where: { locale, isActive: true },
    orderBy: { order: 'asc' },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Új Játék</h1>
        <p className="text-gray-700">Játék hozzáadása</p>
      </div>

      <GameForm locale={locale} categories={categories} />
    </div>
  );
}

