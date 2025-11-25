import { Navigation } from '@/components/Navigation';
import { getTranslations } from '@/lib/i18n';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export default async function ForgotPasswordPage({
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
          <h1 className="text-3xl font-bold mb-6 text-center">{t('auth.resetPassword')}</h1>
          <ForgotPasswordForm locale={locale} />
        </div>
      </main>
    </div>
  );
}

