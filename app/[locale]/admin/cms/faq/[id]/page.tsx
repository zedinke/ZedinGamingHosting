import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { FAQForm } from '@/components/admin/cms/FAQForm';
import { notFound } from 'next/navigation';

export default async function EditFAQPage({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  const faq = await prisma.fAQ.findUnique({
    where: { id },
  });

  if (!faq) {
    notFound();
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">FAQ Szerkesztése</h1>
        <p className="text-gray-600">{faq.question}</p>
      </div>

      <FAQForm locale={locale} faq={faq} />
    </div>
  );
}

