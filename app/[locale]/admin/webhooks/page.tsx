import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { AdminNavigation } from '@/components/admin/AdminNavigation';
import { WebhookManagement } from '@/components/admin/WebhookManagement';

export default async function WebhooksPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation locale={locale} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Webhook Kezelés</h1>
          <p className="text-gray-700">Webhook konfigurációk kezelése</p>
        </div>
        <WebhookManagement locale={locale} />
      </main>
    </div>
  );
}

