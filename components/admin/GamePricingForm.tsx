'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { GameType } from '@prisma/client';

const pricingSchema = z.object({
  basePrice: z.string().min(0, 'Alapár megadása kötelező'),
  currency: z.string().min(1, 'Pénznem megadása kötelező'),
  pricePerSlot: z.string().min(0),
  pricePerVCpu: z.string().min(0),
  pricePerRamGB: z.string().min(0),
  minSlots: z.string().min(1, 'Minimum slot megadása kötelező'),
  minVCpu: z.string().min(1, 'Minimum vCPU megadása kötelező'),
  minRamGB: z.string().min(1, 'Minimum RAM megadása kötelező'),
  maxSlots: z.string().min(1, 'Maximum slot megadása kötelező'),
  maxVCpu: z.string().min(1, 'Maximum vCPU megadása kötelező'),
  maxRamGB: z.string().min(1, 'Maximum RAM megadása kötelező'),
  slotStep: z.string().min(1, 'Slot lépésköz megadása kötelező'),
  vCpuStep: z.string().min(1, 'vCPU lépésköz megadása kötelező'),
  ramStep: z.string().min(1, 'RAM lépésköz megadása kötelező'),
  dynamicPricingEnabled: z.boolean(),
});

type PricingFormData = z.infer<typeof pricingSchema>;

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

interface GamePricingFormProps {
  locale: string;
  gameConfigId: string;
  gameType: GameType;
  pricingConfig: GamePricingConfig | null;
}

export function GamePricingForm({
  locale,
  gameConfigId,
  gameType,
  pricingConfig,
}: GamePricingFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PricingFormData>({
    resolver: zodResolver(pricingSchema),
    defaultValues: pricingConfig
      ? {
          basePrice: pricingConfig.basePrice.toString(),
          currency: pricingConfig.currency,
          pricePerSlot: pricingConfig.pricePerSlot.toString(),
          pricePerVCpu: pricingConfig.pricePerVCpu.toString(),
          pricePerRamGB: pricingConfig.pricePerRamGB.toString(),
          minSlots: pricingConfig.minSlots.toString(),
          minVCpu: pricingConfig.minVCpu.toString(),
          minRamGB: pricingConfig.minRamGB.toString(),
          maxSlots: pricingConfig.maxSlots.toString(),
          maxVCpu: pricingConfig.maxVCpu.toString(),
          maxRamGB: pricingConfig.maxRamGB.toString(),
          slotStep: pricingConfig.slotStep.toString(),
          vCpuStep: pricingConfig.vCpuStep.toString(),
          ramStep: pricingConfig.ramStep.toString(),
          dynamicPricingEnabled: pricingConfig.dynamicPricingEnabled,
        }
      : {
          basePrice: '0',
          currency: 'HUF',
          pricePerSlot: '0',
          pricePerVCpu: '0',
          pricePerRamGB: '0',
          minSlots: '1',
          minVCpu: '1',
          minRamGB: '1',
          maxSlots: '100',
          maxVCpu: '16',
          maxRamGB: '64',
          slotStep: '1',
          vCpuStep: '1',
          ramStep: '1',
          dynamicPricingEnabled: false,
        },
  });

  const onSubmit = async (data: PricingFormData) => {
    setIsLoading(true);
    try {
      const payload = {
        basePrice: parseFloat(data.basePrice),
        currency: data.currency,
        pricePerSlot: parseFloat(data.pricePerSlot),
        pricePerVCpu: parseFloat(data.pricePerVCpu),
        pricePerRamGB: parseFloat(data.pricePerRamGB),
        minSlots: parseInt(data.minSlots),
        minVCpu: parseInt(data.minVCpu),
        minRamGB: parseInt(data.minRamGB),
        maxSlots: parseInt(data.maxSlots),
        maxVCpu: parseInt(data.maxVCpu),
        maxRamGB: parseInt(data.maxRamGB),
        slotStep: parseInt(data.slotStep),
        vCpuStep: parseInt(data.vCpuStep),
        ramStep: parseInt(data.ramStep),
        dynamicPricingEnabled: data.dynamicPricingEnabled,
      };

      const response = await fetch(`/api/admin/games/${gameConfigId}/pricing`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Hiba történt');
        console.error('API Error:', result);
        return;
      }

      toast.success('Árazási konfiguráció mentve');
      router.push(`/${locale}/admin/games`);
      router.refresh();
    } catch (error) {
      toast.error('Hiba történt');
    } finally {
      setIsLoading(false);
    }
  };

  const dynamicEnabled = watch('dynamicPricingEnabled');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card padding="lg">
        <h2 className="text-xl font-bold mb-4">Dinamikus Árazás</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              {...register('dynamicPricingEnabled')}
              type="checkbox"
              id="dynamicPricingEnabled"
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <label htmlFor="dynamicPricingEnabled" className="text-sm font-semibold text-gray-900">
              Dinamikus árazás engedélyezése
            </label>
          </div>
          <p className="text-sm text-gray-600">
            Ha engedélyezve van, a felhasználók a szerver bérlésénél változtathatják a slot/vCPU/RAM
            mennyiséget, és az ár dinamikusan számolódik.
          </p>
        </div>
      </Card>

      <Card padding="lg">
        <h2 className="text-xl font-bold mb-4">Alapár</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Alapár (havi) *
            </label>
            <input
              {...register('basePrice')}
              type="number"
              step="0.01"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
            />
            {errors.basePrice && (
              <p className="text-red-500 text-sm mt-1">{errors.basePrice.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Pénznem *</label>
            <select
              {...register('currency')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
            >
              <option value="HUF">HUF</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
            {errors.currency && (
              <p className="text-red-500 text-sm mt-1">{errors.currency.message}</p>
            )}
          </div>
        </div>
      </Card>

      {dynamicEnabled && (
        <>
          <Card padding="lg">
            <h2 className="text-xl font-bold mb-4">Dinamikus Árazás (Egységár)</h2>
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Ár/Slot
                  </label>
                  <input
                    {...register('pricePerSlot')}
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Havi ár egy slot-ért
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Ár/vCPU
                  </label>
                  <input
                    {...register('pricePerVCpu')}
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Havi ár egy vCPU-ért
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Ár/RAM (GB)
                  </label>
                  <input
                    {...register('pricePerRamGB')}
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Havi ár egy GB RAM-ért
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card padding="lg">
            <h2 className="text-xl font-bold mb-4">Minimum Értékek</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Minimum Slot *
                </label>
                <input
                  {...register('minSlots')}
                  type="number"
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
                />
                {errors.minSlots && (
                  <p className="text-red-500 text-sm mt-1">{errors.minSlots.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Minimum vCPU *
                </label>
                <input
                  {...register('minVCpu')}
                  type="number"
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
                />
                {errors.minVCpu && (
                  <p className="text-red-500 text-sm mt-1">{errors.minVCpu.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Minimum RAM (GB) *
                </label>
                <input
                  {...register('minRamGB')}
                  type="number"
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
                />
                {errors.minRamGB && (
                  <p className="text-red-500 text-sm mt-1">{errors.minRamGB.message}</p>
                )}
              </div>
            </div>
          </Card>

          <Card padding="lg">
            <h2 className="text-xl font-bold mb-4">Maximum Értékek</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Maximum Slot *
                </label>
                <input
                  {...register('maxSlots')}
                  type="number"
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
                />
                {errors.maxSlots && (
                  <p className="text-red-500 text-sm mt-1">{errors.maxSlots.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Maximum vCPU *
                </label>
                <input
                  {...register('maxVCpu')}
                  type="number"
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
                />
                {errors.maxVCpu && (
                  <p className="text-red-500 text-sm mt-1">{errors.maxVCpu.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Maximum RAM (GB) *
                </label>
                <input
                  {...register('maxRamGB')}
                  type="number"
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
                />
                {errors.maxRamGB && (
                  <p className="text-red-500 text-sm mt-1">{errors.maxRamGB.message}</p>
                )}
              </div>
            </div>
          </Card>

          <Card padding="lg">
            <h2 className="text-xl font-bold mb-4">Lépésközök</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Slot Lépésköz *
                </label>
                <input
                  {...register('slotStep')}
                  type="number"
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
                />
                {errors.slotStep && (
                  <p className="text-red-500 text-sm mt-1">{errors.slotStep.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Hányasával változtatható (pl. 1, 5, 10)
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  vCPU Lépésköz *
                </label>
                <input
                  {...register('vCpuStep')}
                  type="number"
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
                />
                {errors.vCpuStep && (
                  <p className="text-red-500 text-sm mt-1">{errors.vCpuStep.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Hányasával változtatható (pl. 1, 2, 4)
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  RAM Lépésköz (GB) *
                </label>
                <input
                  {...register('ramStep')}
                  type="number"
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
                />
                {errors.ramStep && (
                  <p className="text-red-500 text-sm mt-1">{errors.ramStep.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Hányasával változtatható (pl. 1, 2, 4, 8)
                </p>
              </div>
            </div>
          </Card>
        </>
      )}

      <div className="flex gap-4">
        <Button type="submit" isLoading={isLoading} size="lg">
          Mentés
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          size="lg"
        >
          Mégse
        </Button>
      </div>
    </form>
  );
}

