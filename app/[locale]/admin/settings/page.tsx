import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { BackupStorageSettings } from '@/components/admin/BackupStorageSettings';
import { InvoiceSettings } from '@/components/admin/InvoiceSettings';

export default async function AdminSettingsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Rendszer Beállítások</h1>

        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Számlázási Beállítások</h2>
            <InvoiceSettings />
          </div>
          
          <BackupStorageSettings />
        </div>
      </div>
    </div>
  );
}

