'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { GameType } from '@prisma/client';

interface GamePackage {
  id: string;
  gameType: GameType;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  interval: string;
  image: string | null;
  slot: number;
  cpuCores: number;
  ram: number;
  discountPrice: number | null;
  pricePerSlot: number | null;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

interface GamePackageManagementProps {
  packages: GamePackage[];
  locale: string;
}

export function GamePackageManagement({ packages: initialPackages, locale }: GamePackageManagementProps) {
  const [packages, setPackages] = useState<GamePackage[]>(initialPackages);
  const [search, setSearch] = useState('');
  const [gameTypeFilter, setGameTypeFilter] = useState<string>('');
  const [gameTypeLabels, setGameTypeLabels] = useState<Record<GameType, string>>({} as Record<GameType, string>);

  // Játék típusok címkéinek betöltése
  useEffect(() => {
    const fetchGameTypeLabels = async () => {
      try {
        const response = await fetch('/api/games/available');
        if (response.ok) {
          const data = await response.json();
          const labels: Record<GameType, string> = {} as Record<GameType, string>;
          data.gameTypes?.forEach((game: { value: GameType; label: string }) => {
            labels[game.value] = game.label;
          });
          setGameTypeLabels(labels);
        }
      } catch (error) {
        console.error('Hiba a játék típusok címkéinek lekérése során:', error);
      }
    };

    fetchGameTypeLabels();
  }, []);

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const getGameTypeLabel = (gameType: GameType): string => {
    return gameTypeLabels[gameType] || gameType.replace(/_/g, ' ');
  };

  const handleToggleActive = async (packageId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/game-packages/${packageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !currentStatus,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Hiba történt');
      }

      setPackages((prev) =>
        prev.map((pkg) =>
          pkg.id === packageId ? { ...pkg, isActive: !currentStatus } : pkg
        )
      );

      toast.success(currentStatus ? 'Csomag inaktívvá téve' : 'Csomag aktiválva');
    } catch (error: any) {
      toast.error(error.message || 'Hiba történt');
    }
  };

  const handleDelete = async (packageId: string) => {
    if (!confirm('Biztosan törölni szeretnéd ezt a csomagot?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/game-packages/${packageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Hiba történt');
      }

      setPackages((prev) => prev.filter((pkg) => pkg.id !== packageId));
      toast.success('Csomag törölve');
    } catch (error: any) {
      toast.error(error.message || 'Hiba történt');
    }
  };

  const filteredPackages = packages.filter((pkg) => {
    const matchesSearch = pkg.name.toLowerCase().includes(search.toLowerCase()) ||
      getGameTypeLabel(pkg.gameType).toLowerCase().includes(search.toLowerCase());
    const matchesGameType = !gameTypeFilter || pkg.gameType === gameTypeFilter;
    return matchesSearch && matchesGameType;
  });

  // Játék típusok listája szűréshez
  const gameTypes = Array.from(new Set(packages.map((pkg) => pkg.gameType)));

  return (
    <div className="space-y-6">
      {/* Fejléc */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Játék Csomagok</h1>
          <p className="text-gray-700 mt-1 font-medium">Játékokhoz tartozó csomagok kezelése</p>
        </div>
        <Link
          href={`/${locale}/admin/cms/game-packages/new`}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          Új csomag
        </Link>
      </div>

      {/* Keresés és szűrők */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[300px]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Keresés név vagy játék alapján..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
            />
          </div>
          <div className="min-w-[200px]">
            <select
              value={gameTypeFilter}
              onChange={(e) => setGameTypeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
            >
              <option value="">Összes játék</option>
              {gameTypes.map((gameType) => (
                <option key={gameType} value={gameType}>
                  {getGameTypeLabel(gameType)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Csomagok listája */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPackages.map((pkg) => (
          <div
            key={pkg.id}
            className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${
              !pkg.isActive ? 'opacity-60' : ''
            }`}
          >
            {/* Kép */}
            {pkg.image && (
              <div className="relative h-48 bg-gray-200">
                <img
                  src={pkg.image}
                  alt={pkg.name}
                  className="w-full h-full object-cover"
                />
                {!pkg.isActive && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
                    Inaktív
                  </div>
                )}
              </div>
            )}

            {/* Tartalom */}
            <div className="p-6">
              <div className="mb-2">
                <span className="text-xs font-semibold text-primary-600 uppercase">
                  {getGameTypeLabel(pkg.gameType)}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
              
              {pkg.description && (
                <p className="text-gray-700 text-sm mb-4 line-clamp-2 font-medium">{pkg.description}</p>
              )}

              {/* Specifikációk */}
              <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
                <div>
                  <div className="text-gray-700 font-semibold">Slot</div>
                  <div className="font-bold text-gray-900">{pkg.slot}</div>
                </div>
                <div>
                  <div className="text-gray-700 font-semibold">CPU</div>
                  <div className="font-bold text-gray-900">{pkg.cpuCores} vCore</div>
                </div>
                <div>
                  <div className="text-gray-700 font-semibold">RAM</div>
                  <div className="font-bold text-gray-900">{pkg.ram} GB</div>
                </div>
              </div>

              {/* Ár */}
              <div className="mb-4">
                {pkg.discountPrice ? (
                  <div>
                    <div className="text-2xl font-bold text-primary-600">
                      {formatPrice(pkg.discountPrice, pkg.currency)}
                    </div>
                    <div className="text-sm text-gray-500 line-through">
                      {formatPrice(pkg.price, pkg.currency)}
                    </div>
                  </div>
                ) : (
                  <div className="text-2xl font-bold text-primary-600">
                    {formatPrice(pkg.price, pkg.currency)}
                    <span className="text-sm text-gray-600">/{pkg.interval}</span>
                  </div>
                )}
              </div>

              {/* Műveletek */}
              <div className="flex gap-2 pt-4 border-t">
                <Link
                  href={`/${locale}/admin/cms/game-packages/${pkg.id}`}
                  className="flex-1 text-center bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm"
                >
                  Szerkesztés
                </Link>
                <button
                  onClick={() => handleToggleActive(pkg.id, pkg.isActive)}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    pkg.isActive
                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}
                >
                  {pkg.isActive ? 'Inaktív' : 'Aktív'}
                </button>
                <button
                  onClick={() => handleDelete(pkg.id)}
                  className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors text-sm"
                >
                  Törlés
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPackages.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-700 font-medium">Nincs találat</p>
        </div>
      )}
    </div>
  );
}

