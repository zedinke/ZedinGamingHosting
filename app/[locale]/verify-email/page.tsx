import { Navigation } from '@/components/Navigation';
import { getTranslations } from '@/lib/i18n';
import { VerifyEmailForm } from '@/components/auth/VerifyEmailForm';

export default async function VerifyEmailPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { email?: string; token?: string };
}) {
  const t = getTranslations(locale, 'common');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation locale={locale} />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto card">
          <h1 className="text-3xl font-bold mb-6 text-center">{t('auth.verifyEmail')}</h1>
          <VerifyEmailForm locale={locale} email={searchParams.email} token={searchParams.token} />
        </div>
      </main>
    </div>
  );
}

