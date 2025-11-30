import { Navigation } from '@/components/Navigation';
import { getTranslations } from '@/lib/i18n';
import { LoginForm } from '@/components/auth/LoginForm';

export default async function LoginPage({
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
              <h1 className="text-3xl font-bold text-gray-100 mb-2">{t('auth.signIn')}</h1>
              <p className="text-gray-400 text-sm">Jelentkezz be a fiókodba</p>
            </div>
            <LoginForm locale={locale} />
          </div>
        </div>
      </main>
    </div>
  );
}

