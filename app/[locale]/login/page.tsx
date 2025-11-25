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
    <div className="min-h-screen bg-gray-50">
      <Navigation locale={locale} />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto card">
          <h1 className="text-3xl font-bold mb-6 text-center">{t('auth.signIn')}</h1>
          <LoginForm locale={locale} />
        </div>
      </main>
    </div>
  );
}

