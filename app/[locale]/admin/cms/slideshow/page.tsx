import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { SlideshowManagement } from '@/components/admin/cms/SlideshowManagement';

export default async function AdminSlideshowPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { localeFilter?: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  const localeFilter = searchParams.localeFilter || locale;

  const slides = await prisma.slideshowSlide.findMany({
    where: { locale: localeFilter },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Slideshow Kezelése</h1>
          <p className="text-gray-600">Kezdőoldal slideshow diák kezelése</p>
        </div>
        <a
          href={`/${locale}/admin/cms/slideshow/new`}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          Új Slide
        </a>
      </div>

      <SlideshowManagement slides={slides} locale={locale} />
    </div>
  );
}

