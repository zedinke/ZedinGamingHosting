import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { HomepageSectionForm } from '@/components/admin/cms/HomepageSectionForm';
import { notFound } from 'next/navigation';

export default async function EditHomepageSectionPage({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  const section = await prisma.homepageSection.findUnique({
    where: { id },
  });

  if (!section) {
    notFound();
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Homepage Szekció Szerkesztése</h1>
        <p className="text-gray-600">{section.title || section.type}</p>
      </div>

      <HomepageSectionForm locale={locale} section={section} />
    </div>
  );
}

