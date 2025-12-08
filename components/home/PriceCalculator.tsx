'use client';

import { useState, useEffect } from 'react';
import { GameType } from '@prisma/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { loadTranslations, getNestedValue } from '@/lib/translations';

interface GameConfig {
  id: string;
  gameType: GameType;
  displayName: string;
  isActive: boolean;
  isVisible: boolean;
  image: string | null;
  pricingConfig: {
    id: string;
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
  } | null;
}

export function PriceCalculator({ locale }: { locale: string }) {
  const [gameConfigs, setGameConfigs] = useState<GameConfig[]>([]);
  const [selectedGameType, setSelectedGameType] = useState<GameType | ''>('');
  const [slots, setSlots] = useState(10);
  const [vCpu, setVCpu] = useState(2);
  const [ramGB, setRamGB] = useState(4);
  const [loading, setLoading] = useState(true);
  const [translations, setTranslations] = useState<any>({});

  useEffect(() => {
    loadTranslations(locale, 'common').then(setTranslations);

    const fetchGameConfigs = async () => {
      try {
        const response = await fetch('/api/game-configs');
        if (response.ok) {
          const data = await response.json();
          const visibleConfigs = data.gameConfigs.filter(
            (gc: GameConfig) => gc.isActive && gc.isVisible && gc.pricingConfig?.dynamicPricingEnabled
          );
          setGameConfigs(visibleConfigs);
          if (visibleConfigs.length > 0) {
            setSelectedGameType(visibleConfigs[0].gameType);
            const pricing = visibleConfigs[0].pricingConfig;
            if (pricing) {
              setSlots(pricing.minSlots);
              setVCpu(pricing.minVCpu);
              setRamGB(pricing.minRamGB);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching game configs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGameConfigs();
  }, [locale]);

  const t = (key: string) => getNestedValue(translations, key) || key;

  const selectedConfig = gameConfigs.find((gc) => gc.gameType === selectedGameType);
  const pricing = selectedConfig?.pricingConfig;

  const calculatePrice = () => {
    if (!pricing) return 0;
    return (
      pricing.basePrice +
      slots * pricing.pricePerSlot +
      vCpu * pricing.pricePerVCpu +
      ramGB * pricing.pricePerRamGB
    );
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const adjustValue = (
    current: number,
    delta: number,
    min: number,
    max: number,
    step: number
  ) => {
    const newValue = current + delta * step;
    return Math.max(min, Math.min(max, Math.round(newValue / step) * step));
  };

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-600">{t('priceCalculator.loading') || 'Loading price calculator...'}</p>
      </div>
    );
  }

  if (gameConfigs.length === 0) {
    return null;
  }

  return (
    <Card padding="lg" className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('priceCalculator.title') || 'Price Calculator'}</h2>
        <p className="text-gray-600">
          {t('priceCalculator.subtitle') || 'Choose the game and resources to see your price'}
        </p>
      </div>

      <div className="space-y-6">
        {/* Játék választás */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">{t('priceCalculator.labels.game') || 'Game'}</label>
          <select
            value={selectedGameType}
            onChange={(e) => {
              const gameType = e.target.value as GameType;
              setSelectedGameType(gameType);
              const config = gameConfigs.find((gc) => gc.gameType === gameType);
              if (config?.pricingConfig) {
                const p = config.pricingConfig;
                setSlots(p.minSlots);
                setVCpu(p.minVCpu);
                setRamGB(p.minRamGB);
              }
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
          >
            {gameConfigs.map((config) => (
              <option key={config.id} value={config.gameType}>
                {config.displayName}
              </option>
            ))}
          </select>
        </div>

        {pricing && (
          <>
            {/* Slot */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-gray-900">
                  {t('priceCalculator.labels.slot') || 'Slot'}: {slots}
                </label>
                <span className="text-sm text-gray-600">
                  {pricing.minSlots} - {pricing.maxSlots} ({t('priceCalculator.step') || 'step'}: {pricing.slotStep})
                </span>
              </div>
              <div className="flex gap-2 items-center">
                <button
                  type="button"
                  onClick={() =>
                    setSlots(adjustValue(slots, -1, pricing.minSlots, pricing.maxSlots, pricing.slotStep))
                  }
                  disabled={slots <= pricing.minSlots}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  -
                </button>
                <input
                  type="number"
                  value={slots}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || pricing.minSlots;
                    setSlots(
                      Math.max(
                        pricing.minSlots,
                        Math.min(pricing.maxSlots, Math.round(value / pricing.slotStep) * pricing.slotStep)
                      )
                    );
                  }}
                  min={pricing.minSlots}
                  max={pricing.maxSlots}
                  step={pricing.slotStep}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white text-center"
                />
                <button
                  type="button"
                  onClick={() =>
                    setSlots(adjustValue(slots, 1, pricing.minSlots, pricing.maxSlots, pricing.slotStep))
                  }
                  disabled={slots >= pricing.maxSlots}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
            </div>

            {/* vCPU */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-gray-900">
                  vCPU: {vCpu}
                </label>
                <span className="text-sm text-gray-600">
                  {pricing.minVCpu} - {pricing.maxVCpu} ({t('priceCalculator.step') || 'step'}: {pricing.vCpuStep})
                </span>
              </div>
              <div className="flex gap-2 items-center">
                <button
                  type="button"
                  onClick={() =>
                    setVCpu(adjustValue(vCpu, -1, pricing.minVCpu, pricing.maxVCpu, pricing.vCpuStep))
                  }
                  disabled={vCpu <= pricing.minVCpu}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  -
                </button>
                <input
                  type="number"
                  value={vCpu}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || pricing.minVCpu;
                    setVCpu(
                      Math.max(
                        pricing.minVCpu,
                        Math.min(pricing.maxVCpu, Math.round(value / pricing.vCpuStep) * pricing.vCpuStep)
                      )
                    );
                  }}
                  min={pricing.minVCpu}
                  max={pricing.maxVCpu}
                  step={pricing.vCpuStep}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white text-center"
                />
                <button
                  type="button"
                  onClick={() =>
                    setVCpu(adjustValue(vCpu, 1, pricing.minVCpu, pricing.maxVCpu, pricing.vCpuStep))
                  }
                  disabled={vCpu >= pricing.maxVCpu}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
            </div>

            {/* RAM */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-gray-900">
                  RAM: {ramGB} GB
                </label>
                <span className="text-sm text-gray-600">
                  {pricing.minRamGB} - {pricing.maxRamGB} GB ({t('priceCalculator.step') || 'step'}: {pricing.ramStep})
                </span>
              </div>
              <div className="flex gap-2 items-center">
                <button
                  type="button"
                  onClick={() =>
                    setRamGB(adjustValue(ramGB, -1, pricing.minRamGB, pricing.maxRamGB, pricing.ramStep))
                  }
                  disabled={ramGB <= pricing.minRamGB}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  -
                </button>
                <input
                  type="number"
                  value={ramGB}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || pricing.minRamGB;
                    setRamGB(
                      Math.max(
                        pricing.minRamGB,
                        Math.min(pricing.maxRamGB, Math.round(value / pricing.ramStep) * pricing.ramStep)
                      )
                    );
                  }}
                  min={pricing.minRamGB}
                  max={pricing.maxRamGB}
                  step={pricing.ramStep}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white text-center"
                />
                <button
                  type="button"
                  onClick={() =>
                    setRamGB(adjustValue(ramGB, 1, pricing.minRamGB, pricing.maxRamGB, pricing.ramStep))
                  }
                  disabled={ramGB >= pricing.maxRamGB}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
            </div>

            {/* Ár összesítés */}
            <div className="pt-6 border-t border-gray-200">
              <div className="bg-primary-50 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold text-gray-900">{t('priceCalculator.priceLabel') || 'Monthly price'}:</span>
                  <span className="text-3xl font-bold text-primary-600">
                    {formatPrice(calculatePrice(), pricing.currency)}
                  </span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span>{t('priceCalculator.basePrice') || 'Base price'}:</span>
                    <span>{formatPrice(pricing.basePrice, pricing.currency)}</span>
                  </div>
                  {pricing.pricePerSlot > 0 && (
                    <div className="flex justify-between">
                      <span>
                        {t('priceCalculator.labels.slot') || 'Slot'} ({slots} × {formatPrice(pricing.pricePerSlot, pricing.currency)}):
                      </span>
                      <span>{formatPrice(slots * pricing.pricePerSlot, pricing.currency)}</span>
                    </div>
                  )}
                  {pricing.pricePerVCpu > 0 && (
                    <div className="flex justify-between">
                      <span>vCPU ({vCpu} × {formatPrice(pricing.pricePerVCpu, pricing.currency)}):</span>
                      <span>{formatPrice(vCpu * pricing.pricePerVCpu, pricing.currency)}</span>
                    </div>
                  )}
                  {pricing.pricePerRamGB > 0 && (
                    <div className="flex justify-between">
                      <span>RAM ({ramGB} GB × {formatPrice(pricing.pricePerRamGB, pricing.currency)}):</span>
                      <span>{formatPrice(ramGB * pricing.pricePerRamGB, pricing.currency)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Rendelés gomb */}
            <div className="pt-4">
              <Button
                size="lg"
                className="w-full"
                onClick={() => {
                  window.location.href = `/${locale}/servers/new?gameType=${selectedGameType}&slots=${slots}&vCpu=${vCpu}&ramGB=${ramGB}`;
                }}
              >
                {t('priceCalculator.order') || 'Order now'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

