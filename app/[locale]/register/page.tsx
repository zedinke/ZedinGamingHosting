import { Navigation } from '@/components/Navigation';
import { getTranslations } from '@/lib/i18n';
import { RegisterForm } from '@/components/auth/RegisterForm';

export default async function RegisterPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = getTranslations(locale, 'common');

  return (
    <div className="min-h-screen bg-dark-900">
      <Navigation locale={locale} />
      <main className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-md mx-auto">
          <div className="card-glow p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-100 mb-2">{t('auth.signUp')}</h1>
              <p className="text-gray-400 text-sm">Hozz létre egy új fiókot</p>
            </div>
            <RegisterForm locale={locale} />
          </div>
        </div>
      </main>
    </div>
  );
}

