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
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Slideshow Slide Szerkesztése</h1>
        <p className="text-gray-600">{slide.title || 'Névtelen slide'}</p>
      </div>

      <SlideshowForm locale={locale} slide={slide} />
    </div>
  );
}

