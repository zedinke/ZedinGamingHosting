import { Navigation } from '@/components/Navigation';
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
    <div className="min-h-screen bg-gray-50">
      <Navigation locale={locale} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Debug Mód</h1>
          <p className="text-gray-600 mt-2">
            Debug mód kezelése és logok megtekintése
          </p>
        </div>
        <DebugManagement locale={locale} />
      </main>
    </div>
  );
}

