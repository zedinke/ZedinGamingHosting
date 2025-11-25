import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { TestimonialManagement } from '@/components/admin/cms/TestimonialManagement';

export default async function AdminTestimonialsPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { localeFilter?: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  const localeFilter = searchParams.localeFilter;

  const where: any = {};
  if (localeFilter) {
    where.locale = localeFilter;
  }

  const testimonials = await prisma.testimonial.findMany({
    where,
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Testimonials</h1>
          <p className="text-gray-700">Vélemények kezelése</p>
        </div>
        <a
          href={`/${locale}/admin/cms/testimonials/new`}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-sm hover:shadow-md"
        >
          Új vélemény
        </a>
      </div>

      <TestimonialManagement
        testimonials={testimonials}
        locale={locale}
        localeFilter={localeFilter}
      />
    </div>
  );
}

