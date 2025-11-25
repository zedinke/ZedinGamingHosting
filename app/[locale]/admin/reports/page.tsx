import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { AdminNavigation } from '@/components/admin/AdminNavigation';
import { ServerReports } from '@/components/admin/ServerReports';

export default async function ReportsPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { period?: string; gameType?: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation locale={locale} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Jelentések</h1>
          <p className="text-gray-700">Szerver statisztikák és elemzések</p>
        </div>
        <ServerReports
          locale={locale}
          initialPeriod={searchParams.period || '30'}
          initialGameType={searchParams.gameType || ''}
        />
      </main>
    </div>
  );
}

