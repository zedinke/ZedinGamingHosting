'use client';

import Link from 'next/link';
import { GameType } from '@prisma/client';

interface PremiumPackageGame {
  id: string;
  gameType: GameType;
  order: number;
}

interface PremiumPackage {
  id: string;
  nameHu: string;
  nameEn: string;
  descriptionHu: string | null;
  descriptionEn: string | null;
  price: number;
  currency: string;
  interval: string;
  discountPrice: number | null;
  isActive: boolean;
  order: number;
  cpuCores: number;
  ram: number;
  image: string | null;
  videoUrl: string | null;
  games: PremiumPackageGame[];
  _count: {
    servers: number;
  };
}

interface PremiumPackageManagementProps {
  packages: PremiumPackage[];
  locale: string;
}

export function PremiumPackageManagement({ packages, locale }: PremiumPackageManagementProps) {
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const getGameTypeLabel = (gameType: GameType): string => {
    const labels: Partial<Record<GameType, string>> = {
      ARK_EVOLVED: 'ARK: Survival Evolved',
      ARK_ASCENDED: 'ARK: Survival Ascended',
      MINECRAFT: 'Minecraft',
      RUST: 'Rust',
      VALHEIM: 'Valheim',
      SEVEN_DAYS_TO_DIE: '7 Days to Die',
      CONAN_EXILES: 'Conan Exiles',
      DAYZ: 'DayZ',
      PROJECT_ZOMBOID: 'Project Zomboid',
      PALWORLD: 'Palworld',
      ENSHROUDED: 'Enshrouded',
      SONS_OF_THE_FOREST: 'Sons of the Forest',
      THE_FOREST: 'The Forest',
      GROUNDED: 'Grounded',
      V_RISING: 'V Rising',
      DONT_STARVE_TOGETHER: "Don't Starve Together",
      CS2: 'Counter-Strike 2',
      CSGO: 'Counter-Strike: Global Offensive',
      TERRARIA: 'Terraria',
      SATISFACTORY: 'Satisfactory',
    };
    return labels[gameType] || gameType;
  };

  const getName = (pkg: PremiumPackage) => {
    return locale === 'hu' ? pkg.nameHu : pkg.nameEn;
  };

  const getDescription = (pkg: PremiumPackage) => {
    return locale === 'hu' ? pkg.descriptionHu : pkg.descriptionEn;
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Premium Csomagok</h1>
          <p className="text-gray-700">Több játékot tartalmazó premium csomagok kezelése</p>
        </div>
        <Link
          href={`/${locale}/admin/cms/premium-packages/new`}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-sm hover:shadow-md"
        >
          Új Premium Csomag
        </Link>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${!pkg.isActive ? 'opacity-60' : ''}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-1">{getName(pkg)}</h3>
                <div className="text-3xl font-bold text-primary-600">
                  {formatPrice(pkg.discountPrice || pkg.price, pkg.currency)}
                  {pkg.discountPrice && (
                    <span className="text-lg text-gray-400 line-through ml-2">
                      {formatPrice(pkg.price, pkg.currency)}
                    </span>
                  )}
                  <span className="text-lg text-gray-600">/{pkg.interval}</span>
                </div>
              </div>
              {!pkg.isActive && (
                <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                  Inaktív
                </span>
              )}
            </div>

            {getDescription(pkg) && (
              <p className="text-gray-600 mb-4 text-sm">{getDescription(pkg)}</p>
            )}

            {/* Játékok listája */}
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Játékok ({pkg.games.length}):
              </p>
              <div className="flex flex-wrap gap-2">
                {pkg.games.map((game) => (
                  <span
                    key={game.id}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                  >
                    {getGameTypeLabel(game.gameType)}
                  </span>
                ))}
              </div>
            </div>

            {/* Erőforrás információk */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">CPU:</span>
                  <span className="font-semibold ml-1">{pkg.cpuCores} vCore</span>
                </div>
                <div>
                  <span className="text-gray-600">RAM:</span>
                  <span className="font-semibold ml-1">{pkg.ram} GB</span>
                </div>
              </div>
            </div>

            {/* Szerverek száma */}
            {pkg._count.servers > 0 && (
              <div className="mb-4 text-sm text-gray-600">
                <span className="font-semibold">{pkg._count.servers}</span> aktív szerver
              </div>
            )}

            <div className="mt-4 pt-4 border-t flex justify-between items-center">
              <Link
                href={`/${locale}/admin/cms/premium-packages/${pkg.id}`}
                className="text-primary-600 hover:underline text-sm font-medium"
              >
                Szerkesztés
              </Link>
              {pkg._count.servers === 0 && (
                <button
                  onClick={async () => {
                    if (confirm('Biztosan törölni szeretnéd ezt a csomagot?')) {
                      try {
                        const response = await fetch(`/api/admin/premium-packages/${pkg.id}`, {
                          method: 'DELETE',
                        });
                        if (response.ok) {
                          window.location.reload();
                        } else {
                          alert('Hiba történt a törlés során');
                        }
                      } catch (error) {
                        alert('Hiba történt a törlés során');
                      }
                    }
                  }}
                  className="text-red-600 hover:underline text-sm"
                >
                  Törlés
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {packages.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center py-12">
          <p className="text-gray-600 mb-4">Még nincs premium csomag</p>
          <Link
            href={`/${locale}/admin/cms/premium-packages/new`}
            className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            Első Premium Csomag Létrehozása
          </Link>
        </div>
      )}
    </div>
  );
}

