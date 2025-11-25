import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { SlideshowForm } from '@/components/admin/cms/SlideshowForm';

export default async function NewSlideshowSlidePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Új Slideshow Slide</h1>
        <p className="text-gray-600">Slideshow slide hozzáadása</p>
      </div>

      <SlideshowForm locale={locale} />
    </div>
  );
}

