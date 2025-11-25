import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { GameCategoryForm } from '@/components/admin/cms/GameCategoryForm';
import { notFound } from 'next/navigation';

export default async function EditGameCategoryPage({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  const category = await prisma.gameCategory.findUnique({
    where: { id },
  });

  if (!category) {
    notFound();
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Játék Kategória Szerkesztése</h1>
        <p className="text-gray-600">{category.name}</p>
      </div>

      <GameCategoryForm locale={locale} category={category} />
    </div>
  );
}

