import { Navigation } from '@/components/Navigation';
import { getTranslations } from '@/lib/i18n';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export default async function ResetPasswordPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { token?: string };
}) {
  const t = getTranslations(locale, 'common');

  if (!searchParams.token) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation locale={locale} />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto card">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-4 text-red-600">Hiba</h1>
              <p className="text-gray-600">Érvénytelen vagy hiányzó token.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation locale={locale} />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto card">
          <h1 className="text-3xl font-bold mb-6 text-center">{t('auth.resetPassword')}</h1>
          <ResetPasswordForm locale={locale} token={searchParams.token} />
        </div>
      </main>
    </div>
  );
}

