import { requireAdmin } from '@/lib/auth-helpers';
import { PerformanceDashboard } from '@/components/admin/PerformanceDashboard';
import { AdminNavigation } from '@/components/admin/AdminNavigation';

export default async function PerformancePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  await requireAdmin(locale);

  return (
    <AdminNavigation locale={locale}>
      <div className="ml-64 p-8">
        <h1 className="text-3xl font-bold mb-8">Performance Monitoring</h1>
        <PerformanceDashboard />
      </div>
    </AdminNavigation>
  );
}

