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

  // Fetch all slides first to debug
  const allSlides = await prisma.slideshowSlide.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });
  
  console.log('AdminSlideshowPage - All slides:', allSlides.length, allSlides.map(s => ({ id: s.id, locale: s.locale, title: s.title })));
  console.log('AdminSlideshowPage - Locale filter:', localeFilter, 'Current locale:', locale);

  // Filter by locale
  const slides = allSlides.filter(slide => slide.locale === localeFilter);
  
  const transitionInterval = await prisma.setting.findUnique({
    where: { key: 'slideshow_transition_interval' },
  });

  // Debug: log filtered slides
  console.log('AdminSlideshowPage - Filtered slides found:', slides.length, slides);

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-gray-900">Slideshow Kezelése</h1>
          <p className="text-gray-700">Kezdőoldal slideshow diák kezelése</p>
        </div>
        <a
          href={`/${locale}/admin/cms/slideshow/new`}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          Új Slide
        </a>
      </div>

      <SlideshowManagement 
        slides={slides} 
        locale={locale}
        transitionInterval={transitionInterval?.value ? parseInt(transitionInterval.value, 10) : 5}
      />
    </div>
  );
}

