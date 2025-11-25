import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { SlideshowForm } from '@/components/admin/cms/SlideshowForm';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default async function NewSlideshowSlidePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  // Ensure locale is valid
  const validLocale = locale === 'hu' || locale === 'en' ? locale : 'hu';

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Új Slideshow Slide</h1>
          <p className="text-gray-700">Slideshow slide hozzáadása</p>
        </div>
        <a
          href={`/${locale}/admin/cms/slideshow`}
          className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          Vissza
        </a>
      </div>

      <div className="max-w-4xl">
        <ErrorBoundary>
          <SlideshowForm locale={validLocale} />
        </ErrorBoundary>
      </div>
    </div>
  );
}

