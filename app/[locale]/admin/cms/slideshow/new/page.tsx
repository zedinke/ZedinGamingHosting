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
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-gray-900">Új Slideshow Slide</h1>
          <p className="text-gray-700">Slideshow slide hozzáadása</p>
        </div>
        <a
          href={`/${locale}/admin/cms/slideshow`}
          className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          Vissza
        </a>
      </div>

      <div className="max-w-4xl mx-auto">
        <SlideshowForm locale={locale} />
      </div>
    </div>
  );
}

