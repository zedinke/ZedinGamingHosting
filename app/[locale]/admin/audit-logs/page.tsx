import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { AdminNavigation } from '@/components/admin/AdminNavigation';
import { AuditLogsViewer } from '@/components/admin/AuditLogsViewer';

export default async function AuditLogsPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { userId?: string; action?: string; resourceType?: string; page?: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation locale={locale} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Audit Logok</h1>
          <p className="text-gray-700">Rendszer események és felhasználói műveletek naplója</p>
        </div>
        <AuditLogsViewer
          locale={locale}
          initialUserId={searchParams.userId}
          initialAction={searchParams.action}
          initialResourceType={searchParams.resourceType}
          initialPage={parseInt(searchParams.page || '1')}
        />
      </main>
    </div>
  );
}

