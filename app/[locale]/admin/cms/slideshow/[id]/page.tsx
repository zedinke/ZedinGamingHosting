import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { SlideshowForm } from '@/components/admin/cms/SlideshowForm';
import { notFound } from 'next/navigation';

export default async function EditSlideshowSlidePage({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  const slide = await prisma.slideshowSlide.findUnique({
    where: { id },
  });

  if (!slide) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Slideshow Slide Szerkesztése</h1>
          <p className="text-gray-700">{slide.title || 'Névtelen slide'}</p>
        </div>
        <a
          href={`/${locale}/admin/cms/slideshow`}
          className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          Vissza
        </a>
      </div>

      <div className="max-w-4xl">
        <SlideshowForm locale={locale} slide={slide} />
      </div>
    </div>
  );
}

