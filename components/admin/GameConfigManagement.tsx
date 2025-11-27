'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { GameType } from '@prisma/client';
import { Badge } from '@/components/ui/Badge';

interface GamePricingConfig {
  id: string;
  gameType: GameType;
  basePrice: number;
  currency: string;
  pricePerSlot: number;
  pricePerVCpu: number;
  pricePerRamGB: number;
  minSlots: number;
  minVCpu: number;
  minRamGB: number;
  maxSlots: number;
  maxVCpu: number;
  maxRamGB: number;
  slotStep: number;
  vCpuStep: number;
  ramStep: number;
  dynamicPricingEnabled: boolean;
}

interface GameConfig {
  id: string;
  gameType: GameType;
  displayName: string;
  isActive: boolean;
  isVisible: boolean;
  steamAppId: number | null;
  requiresSteamCMD: boolean;
  requiresJava: boolean;
  requiresWine: boolean;
  defaultPort: number | null;
  queryPort: number | null;
  defaultCpuCores: number;
  defaultRamGB: number;
  defaultDiskGB: number;
  description: string | null;
  image: string | null;
  order: number;
  pricingConfig: GamePricingConfig | null;
}

interface GameConfigManagementProps {
  gameConfigs: GameConfig[];
  locale: string;
}

export function GameConfigManagement({ gameConfigs, locale }: GameConfigManagementProps) {
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<string>('');

  const filteredConfigs = gameConfigs.filter((config) => {
    const matchesSearch =
      config.displayName.toLowerCase().includes(search.toLowerCase()) ||
      config.gameType.toLowerCase().includes(search.toLowerCase());
    const matchesActive =
      filterActive === '' ||
      (filterActive === 'active' && config.isActive) ||
      (filterActive === 'inactive' && !config.isActive) ||
      (filterActive === 'visible' && config.isVisible) ||
      (filterActive === 'hidden' && !config.isVisible);
    return matchesSearch && matchesActive;
  });

  const handleToggleActive = async (configId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/games/${configId}`, {
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

      toast.success(currentStatus ? 'Konfiguráció inaktívvá téve' : 'Konfiguráció aktiválva');
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || 'Hiba történt');
    }
  };

  const handleToggleVisible = async (configId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/games/${configId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isVisible: !currentStatus,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Hiba történt');
      }

      toast.success(currentStatus ? 'Konfiguráció elrejtve' : 'Konfiguráció láthatóvá téve');
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || 'Hiba történt');
    }
  };

  return (
    <div className="space-y-6">
      {/* Keresés és szűrők */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[300px]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Keresés játék neve vagy típusa alapján..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
            />
          </div>
          <div className="min-w-[200px]">
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
            >
              <option value="">Összes</option>
              <option value="active">Aktív</option>
              <option value="inactive">Inaktív</option>
              <option value="visible">Látható</option>
              <option value="hidden">Rejtett</option>
            </select>
          </div>
        </div>
      </div>

      {/* Konfigurációk listája */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredConfigs.map((config) => (
          <div
            key={config.id}
            className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${
              !config.isActive ? 'opacity-60' : ''
            }`}
          >
            {/* Kép */}
            {config.image && (
              <div className="relative h-48 bg-gray-200">
                <img
                  src={config.image}
                  alt={config.displayName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  {!config.isActive && (
                    <Badge variant="default" size="sm" className="bg-red-500 text-white">
                      Inaktív
                    </Badge>
                  )}
                  {!config.isVisible && (
                    <Badge variant="default" size="sm" className="bg-gray-500 text-white">
                      Rejtett
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Tartalom */}
            <div className="p-6">
              <div className="mb-2">
                <span className="text-xs font-semibold text-primary-600 uppercase">
                  {config.gameType}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{config.displayName}</h3>

              {config.description && (
                <p className="text-gray-700 text-sm mb-4 line-clamp-2 font-medium">
                  {config.description}
                </p>
              )}

              {/* Alapértelmezett értékek */}
              <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
                <div>
                  <div className="text-gray-700 font-semibold">CPU</div>
                  <div className="font-bold text-gray-900">{config.defaultCpuCores} vCore</div>
                </div>
                <div>
                  <div className="text-gray-700 font-semibold">RAM</div>
                  <div className="font-bold text-gray-900">{config.defaultRamGB} GB</div>
                </div>
                <div>
                  <div className="text-gray-700 font-semibold">Disk</div>
                  <div className="font-bold text-gray-900">{config.defaultDiskGB} GB</div>
                </div>
              </div>

              {/* Portok */}
              {config.defaultPort && (
                <div className="mb-4 text-sm">
                  <div className="text-gray-700 font-semibold">Portok</div>
                  <div className="font-bold text-gray-900">
                    {config.defaultPort}
                    {config.queryPort && ` / ${config.queryPort}`}
                  </div>
                </div>
              )}

              {/* Dinamikus árazás */}
              {config.pricingConfig?.dynamicPricingEnabled && (
                <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-xs font-semibold text-green-800 mb-1">
                    Dinamikus árazás aktív
                  </div>
                  <div className="text-xs text-green-700">
                    {config.pricingConfig.pricePerSlot > 0 && (
                      <div>Slot: {config.pricingConfig.pricePerSlot} {config.pricingConfig.currency}/slot</div>
                    )}
                    {config.pricingConfig.pricePerVCpu > 0 && (
                      <div>vCPU: {config.pricingConfig.pricePerVCpu} {config.pricingConfig.currency}/vCPU</div>
                    )}
                    {config.pricingConfig.pricePerRamGB > 0 && (
                      <div>RAM: {config.pricingConfig.pricePerRamGB} {config.pricingConfig.currency}/GB</div>
                    )}
                  </div>
                </div>
              )}

              {/* Műveletek */}
              <div className="flex gap-2 pt-4 border-t">
                <Link
                  href={`/${locale}/admin/games/${config.id}`}
                  className="flex-1 text-center bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm"
                >
                  Szerkesztés
                </Link>
                <Link
                  href={`/${locale}/admin/games/${config.id}/pricing`}
                  className="flex-1 text-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  Árazás
                </Link>
                <button
                  onClick={() => handleToggleVisible(config.id, config.isVisible)}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    config.isVisible
                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}
                  title={config.isVisible ? 'Elrejtés' : 'Láthatóvá tétel'}
                >
                  👁️
                </button>
                <button
                  onClick={() => handleToggleActive(config.id, config.isActive)}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    config.isActive
                      ? 'bg-red-100 text-red-800 hover:bg-red-200'
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}
                  title={config.isActive ? 'Inaktiválás' : 'Aktiválás'}
                >
                  {config.isActive ? '⏸️' : '▶️'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredConfigs.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-700 font-medium">Nincs találat</p>
        </div>
      )}
    </div>
  );
}

