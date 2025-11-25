import Link from 'next/link';
import { getTranslations } from '@/lib/i18n';
import { Navigation } from '@/components/Navigation';

export default async function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = getTranslations(locale, 'common');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation locale={locale} />

      <main>
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl font-bold mb-4 text-gray-900">
            {t('hero.title')}
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {t('hero.subtitle')}
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href={`/${locale}/register`}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-semibold"
            >
              {t('hero.cta')}
            </Link>
            <Link
              href={`/${locale}/pricing`}
              className="border border-primary-600 text-primary-600 px-6 py-3 rounded-lg hover:bg-primary-50 transition-colors font-semibold"
            >
              {t('hero.learnMore')}
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card text-center">
              <h3 className="text-2xl font-bold mb-4">Gyors & Megbízható</h3>
              <p className="text-gray-600">
                SSD tárhely és erős processzorok garantálják a zökkenőmentes játékélményt.
              </p>
            </div>
            <div className="card text-center">
              <h3 className="text-2xl font-bold mb-4">Könnyű Kezelés</h3>
              <p className="text-gray-600">
                Intuitív vezérlőpult, ahol mindent egy helyen kezelhetsz.
              </p>
            </div>
            <div className="card text-center">
              <h3 className="text-2xl font-bold mb-4">24/7 Támogatás</h3>
              <p className="text-gray-600">
                Szakértő csapatunk mindig elérhető, ha segítségre van szükséged.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-white mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-gray-600">
          <p>&copy; {new Date().getFullYear()} ZedinGamingHosting. Minden jog fenntartva.</p>
        </div>
      </footer>
    </div>
  );
}

