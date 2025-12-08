import { requireAdmin } from '@/lib/auth-helpers';
import { PerformanceDashboard } from '@/components/admin/PerformanceDashboard';
import { SystemHealthDashboard } from '@/components/admin/SystemHealthDashboard';

export default async function PerformancePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  await requireAdmin(locale);

  return (
    <>
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Performance & Health Monitoring</h1>
      
      <div className="mb-8">
        <SystemHealthDashboard />
      </div>

      <PerformanceDashboard />
    </>
  );
}

