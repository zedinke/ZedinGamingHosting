'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GameType } from '@prisma/client';
import toast from 'react-hot-toast';

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
}

interface GameConfig {
  gameType: GameType;
  displayName: string;
  defaultCpuCores: number;
  defaultRamGB: number;
  image: string | null;
  isActive: boolean;
}

interface PremiumPackageFormProps {
  locale: string;
  package_?: PremiumPackage;
}

export function PremiumPackageForm({ locale, package_: existingPackage }: PremiumPackageFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [gameConfigs, setGameConfigs] = useState<GameConfig[]>([]);
  const [selectedGames, setSelectedGames] = useState<GameType[]>(
    existingPackage?.games.map((g) => g.gameType) || []
  );

  const [formData, setFormData] = useState({
    nameHu: existingPackage?.nameHu || '',
    nameEn: existingPackage?.nameEn || '',
    descriptionHu: existingPackage?.descriptionHu || '',
    descriptionEn: existingPackage?.descriptionEn || '',
    price: existingPackage?.price || 0,
    currency: existingPackage?.currency || 'HUF',
    interval: existingPackage?.interval || 'month',
    discountPrice: existingPackage?.discountPrice || null,
    isActive: existingPackage?.isActive ?? true,
    order: existingPackage?.order || 0,
    image: existingPackage?.image || '',
    videoUrl: existingPackage?.videoUrl || '',
  });

  useEffect(() => {
    // Játékok betöltése
    fetch('/api/admin/game-configs')
      .then((res) => res.json())
      .then((data) => {
        if (data.configs) {
          setGameConfigs(data.configs);
        }
      })
      .catch((error) => {
        console.error('Error loading game configs:', error);
        toast.error('Hiba a játékok betöltése során');
      });
  }, []);

  // Számoljuk ki az erőforrás limiteket
  const calculateResources = () => {
    if (selectedGames.length === 0) {
      return { cpuCores: 2, ram: 4 };
    }

    let maxCpuCores = 0;
    let maxRamGB = 0;

    selectedGames.forEach((gameType) => {
      const config = gameConfigs.find((gc) => gc.gameType === gameType);
      if (config) {
        maxCpuCores = Math.max(maxCpuCores, config.defaultCpuCores);
        maxRamGB = Math.max(maxRamGB, config.defaultRamGB);
      }
    });

    return {
      cpuCores: maxCpuCores || 2,
      ram: maxRamGB || 4,
    };
  };

  const resources = calculateResources();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        discountPrice: formData.discountPrice || null,
        gameTypes: selectedGames,
        cpuCores: resources.cpuCores,
        ram: resources.ram,
      };

      const url = existingPackage
        ? `/api/admin/premium-packages/${existingPackage.id}`
        : '/api/admin/premium-packages';
      const method = existingPackage ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Hiba történt');
      }

      toast.success(existingPackage ? 'Csomag frissítve' : 'Csomag létrehozva');
      router.push(`/${locale}/admin/cms/premium-packages`);
    } catch (error: any) {
      toast.error(error.message || 'Hiba történt');
    } finally {
      setLoading(false);
    }
  };

  const toggleGame = (gameType: GameType) => {
    setSelectedGames((prev) => {
      if (prev.includes(gameType)) {
        return prev.filter((g) => g !== gameType);
      } else {
        return [...prev, gameType];
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {existingPackage ? 'Premium Csomag Szerkesztése' : 'Új Premium Csomag'}
        </h1>
        <p className="text-gray-700">
          Több játékot tartalmazó premium csomag {existingPackage ? 'szerkesztése' : 'létrehozása'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Alap információk */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Név (Magyar) *
            </label>
            <input
              type="text"
              value={formData.nameHu}
              onChange={(e) => setFormData({ ...formData, nameHu: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Név (Angol) *
            </label>
            <input
              type="text"
              value={formData.nameEn}
              onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Leírás (Magyar)
            </label>
            <textarea
              value={formData.descriptionHu}
              onChange={(e) => setFormData({ ...formData, descriptionHu: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Leírás (Angol)
            </label>
            <textarea
              value={formData.descriptionEn}
              onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Árazás */}
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ár *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Akciós ár
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.discountPrice || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  discountPrice: e.target.value ? parseFloat(e.target.value) : null,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valuta
            </label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="HUF">HUF</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Időszak
            </label>
            <select
              value={formData.interval}
              onChange={(e) => setFormData({ ...formData, interval: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="month">Havi</option>
              <option value="year">Éves</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sorrend
            </label>
            <input
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Játékok kiválasztása */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Játékok kiválasztása *
          </label>
          <div className="border border-gray-300 rounded-lg p-4 max-h-96 overflow-y-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {gameConfigs
                .filter((gc) => gc.isActive)
                .map((config) => (
                  <label
                    key={config.gameType}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedGames.includes(config.gameType)
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedGames.includes(config.gameType)}
                      onChange={() => toggleGame(config.gameType)}
                      className="mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium">{config.displayName}</span>
                  </label>
                ))}
            </div>
          </div>
          {selectedGames.length === 0 && (
            <p className="mt-2 text-sm text-red-600">Legalább egy játékot ki kell választani</p>
          )}
        </div>

        {/* Automatikusan számított erőforrások */}
        {selectedGames.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Automatikusan számított erőforrás limitek
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600">CPU vCore:</span>
                <span className="ml-2 font-semibold">{resources.cpuCores}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">RAM:</span>
                <span className="ml-2 font-semibold">{resources.ram} GB</span>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Az erőforrás limitek a legnagyobb gépigényű játék alapján vannak beállítva.
            </p>
          </div>
        )}

        {/* Kép és videó */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kép URL
            </label>
            <input
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Videó URL (YouTube)
            </label>
            <input
              type="url"
              value={formData.videoUrl}
              onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Aktív státusz */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700">
            Aktív (megjelenik a játékok oldalon)
          </label>
        </div>

        {/* Gombok */}
        <div className="flex justify-end gap-4 pt-4 border-t">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Mégse
          </button>
          <button
            type="submit"
            disabled={loading || selectedGames.length === 0}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Mentés...' : existingPackage ? 'Frissítés' : 'Létrehozás'}
          </button>
        </div>
      </form>
    </div>
  );
}

