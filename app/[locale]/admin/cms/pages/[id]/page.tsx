import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { PageForm } from '@/components/admin/cms/PageForm';
import { notFound } from 'next/navigation';

export default async function EditPagePage({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  const page = await prisma.page.findUnique({
    where: { id },
  });

  if (!page) {
    notFound();
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Oldal Szerkesztése</h1>
        <p className="text-gray-600">{page.title}</p>
      </div>

      <PageForm locale={locale} page={page} />
    </div>
  );
}

