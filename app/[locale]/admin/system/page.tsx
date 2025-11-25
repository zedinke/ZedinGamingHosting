import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { SystemManagement } from '@/components/admin/SystemManagement';

export default async function SystemPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  // Karbantartási mód beállítás lekérése
  const maintenanceMode = await prisma.setting.findUnique({
    where: { key: 'maintenance_mode' },
  });

  // Utolsó frissítés információ
  const lastUpdate = await prisma.setting.findUnique({
    where: { key: 'last_update' },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Rendszer Kezelés</h1>
        <p className="text-gray-600">Rendszer frissítés és karbantartási mód</p>
      </div>

      <SystemManagement
        maintenanceMode={maintenanceMode?.value === 'true'}
        lastUpdate={lastUpdate?.value || null}
        locale={locale}
      />
    </div>
  );
}

