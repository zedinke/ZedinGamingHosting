import { requireAdmin } from '@/lib/auth-helpers';
import { PerformanceDashboard } from '@/components/admin/PerformanceDashboard';
import { SystemHealthDashboard } from '@/components/admin/SystemHealthDashboard';
import { AdminNavigation } from '@/components/admin/AdminNavigation';

export default async function PerformancePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  await requireAdmin(locale);

  return (
    <>
      <AdminNavigation locale={locale} />
      <main className="lg:ml-64 min-h-screen bg-white">
        <div className="p-6 lg:p-8">
          <h1 className="text-3xl font-bold mb-8 text-gray-900">Performance & Health Monitoring</h1>
          
          <div className="mb-8">
            <SystemHealthDashboard />
          </div>

          <PerformanceDashboard />
        </div>
      </main>
    </>
  );
}

