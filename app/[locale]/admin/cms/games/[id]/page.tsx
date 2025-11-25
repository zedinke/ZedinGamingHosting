import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { GameForm } from '@/components/admin/cms/GameForm';
import { notFound } from 'next/navigation';

export default async function EditGamePage({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  const [game, categories] = await Promise.all([
    prisma.game.findUnique({
      where: { id },
      include: { category: true },
    }),
    prisma.gameCategory.findMany({
      where: { locale, isActive: true },
      orderBy: { order: 'asc' },
    }),
  ]);

  if (!game) {
    notFound();
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Játék Szerkesztése</h1>
        <p className="text-gray-600">{game.name}</p>
      </div>

      <GameForm locale={locale} game={game} categories={categories} />
    </div>
  );
}

