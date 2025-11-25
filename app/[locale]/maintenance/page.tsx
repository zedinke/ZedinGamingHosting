import { getTranslations } from '@/lib/i18n';
import { prisma } from '@/lib/prisma';

export default async function MaintenancePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = getTranslations(locale, 'common');

  // Karbantartási üzenet lekérése (opcionális, lehet customizálni)
  const maintenanceMessage = await prisma.setting.findUnique({
    where: { key: 'maintenance_message' },
  });

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto px-4 text-center">
        <div className="mb-8">
          <div className="text-6xl mb-4">🔧</div>
          <h1 className="text-4xl font-bold mb-4">Karbantartás alatt</h1>
          <p className="text-xl text-gray-600 mb-6">
            {maintenanceMessage?.value ||
              'Az oldal jelenleg karbantartás alatt áll. Kérjük, látogass vissza később.'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-3 h-3 bg-primary-600 rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-primary-600 rounded-full animate-pulse delay-75"></div>
            <div className="w-3 h-3 bg-primary-600 rounded-full animate-pulse delay-150"></div>
          </div>
          <p className="text-sm text-gray-500">
            Várjunk egy pillanatot, hamarosan visszatérünk...
          </p>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>Ha adminisztrátor vagy, jelentkezz be az admin felületre.</p>
        </div>
      </div>
    </div>
  );
}

