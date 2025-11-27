import { getTranslations } from '@/lib/i18n';
import { prisma } from '@/lib/prisma';
import { MarioGame } from '@/components/MarioGame';

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
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto w-full">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 animate-fade-in">
          <div className="text-center mb-8">
            <div className="text-8xl mb-4 animate-bounce">🔧</div>
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent animate-pulse">
              Karbantartás alatt
            </h1>
            <p className="text-xl text-gray-700 mb-6">
              {maintenanceMessage?.value ||
                'Az oldal jelenleg karbantartás alatt áll. Kérjük, látogass vissza később.'}
            </p>
          </div>

          <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl p-6 mb-8 border-2 border-blue-200">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-4 h-4 bg-primary-600 rounded-full animate-pulse"></div>
              <div className="w-4 h-4 bg-primary-600 rounded-full animate-pulse [animation-delay:0.2s]"></div>
              <div className="w-4 h-4 bg-primary-600 rounded-full animate-pulse [animation-delay:0.4s]"></div>
            </div>
            <p className="text-center text-gray-700 font-medium">
              Várjunk egy pillanatot, hamarosan visszatérünk...
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">
              Játsz Super Mario-t addig, amíg vársz! 🎮
            </h2>
            <div className="flex justify-center">
              <MarioGame />
            </div>
          </div>

          <div className="mt-8 text-center">
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 font-medium">
                💡 Ha adminisztrátor vagy, jelentkezz be az admin felületre.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

