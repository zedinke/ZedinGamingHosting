import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { BackupStorageSettings } from '@/components/admin/BackupStorageSettings';
import { InvoiceSettings } from '@/components/admin/InvoiceSettings';
import { ResourceUpgradeSettings } from '@/components/admin/ResourceUpgradeSettings';
import { OAuthSettings } from '@/components/admin/OAuthSettings';

export default async function AdminSettingsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Rendszer Beállítások</h1>
        <p className="text-gray-700">Rendszer beállítások kezelése</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Bejelentkezési Beállítások</h2>
          <OAuthSettings locale={locale} />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Számlázási Beállítások</h2>
          <InvoiceSettings />
        </div>
        
        <ResourceUpgradeSettings />
        
        <BackupStorageSettings />
      </div>
    </div>
  );
}

