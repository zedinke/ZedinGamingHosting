import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { TestimonialForm } from '@/components/admin/cms/TestimonialForm';
import { notFound } from 'next/navigation';

export default async function EditTestimonialPage({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  const testimonial = await prisma.testimonial.findUnique({
    where: { id },
  });

  if (!testimonial) {
    notFound();
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Vélemény Szerkesztése</h1>
        <p className="text-gray-600">{testimonial.name}</p>
      </div>

      <TestimonialForm locale={locale} testimonial={testimonial} />
    </div>
  );
}

