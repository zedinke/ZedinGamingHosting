import { requireAdmin } from '@/lib/auth-helpers';
import { DebugManagement } from '@/components/admin/DebugManagement';

export default async function DebugPage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const locale = resolvedParams.locale || 'hu';
  
  await requireAdmin(locale);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Debug Mód</h1>
        <p className="text-gray-700">
          Debug mód kezelése és logok megtekintése
        </p>
      </div>
      <DebugManagement locale={locale} />
    </div>
  );
}

