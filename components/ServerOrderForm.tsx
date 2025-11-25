'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

const serverOrderSchema = z.object({
  name: z.string().min(3, 'A névnek legalább 3 karakter hosszúnak kell lennie'),
  gameType: z.enum(['ARK', 'MINECRAFT', 'CSGO', 'RUST', 'VALHEIM', 'SEVEN_DAYS_TO_DIE', 'OTHER']),
  planId: z.string().min(1, 'Válassz egy csomagot'),
  maxPlayers: z.number().min(1).max(100),
});

type ServerOrderFormData = z.infer<typeof serverOrderSchema>;

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
}

interface ServerOrderFormProps {
  plans: PricingPlan[];
  selectedPlan: PricingPlan | null;
  locale: string;
}

export function ServerOrderForm({ plans, selectedPlan, locale }: ServerOrderFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ServerOrderFormData>({
    resolver: zodResolver(serverOrderSchema),
    defaultValues: {
      planId: selectedPlan?.id || '',
      maxPlayers: 10,
    },
  });

  const selectedPlanId = watch('planId');
  const currentPlan = plans.find((p) => p.id === selectedPlanId) || selectedPlan;

  const onSubmit = async (data: ServerOrderFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/servers/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Hiba történt a rendelés során');
        return;
      }

      toast.success('Szerver rendelés sikeres!');
      router.push(`/${locale}/dashboard/servers/${result.serverId}`);
    } catch (error) {
      toast.error('Hiba történt');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Szerver Információk</h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Szerver neve
            </label>
            <input
              {...register('name')}
              type="text"
              id="name"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Pl: My Awesome Server"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="gameType" className="block text-sm font-medium mb-1">
              Játék típusa
            </label>
            <select
              {...register('gameType')}
              id="gameType"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Válassz játékot...</option>
              <option value="ARK">ARK: Survival Evolved</option>
              <option value="MINECRAFT">Minecraft</option>
              <option value="CSGO">Counter-Strike: Global Offensive</option>
              <option value="RUST">Rust</option>
              <option value="VALHEIM">Valheim</option>
              <option value="SEVEN_DAYS_TO_DIE">7 Days to Die</option>
              <option value="OTHER">Egyéb</option>
            </select>
            {errors.gameType && (
              <p className="text-red-500 text-sm mt-1">{errors.gameType.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="maxPlayers" className="block text-sm font-medium mb-1">
              Maximális játékosok száma
            </label>
            <input
              {...register('maxPlayers', { valueAsNumber: true })}
              type="number"
              id="maxPlayers"
              min="1"
              max="100"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            {errors.maxPlayers && (
              <p className="text-red-500 text-sm mt-1">{errors.maxPlayers.message}</p>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-bold mb-4">Árazási Csomag</h2>
        
        <div className="space-y-3">
          {plans.map((plan) => (
            <label
              key={plan.id}
              className={`flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                selectedPlanId === plan.id ? 'border-primary-600 bg-primary-50' : ''
              }`}
            >
              <input
                {...register('planId')}
                type="radio"
                value={plan.id}
                className="mr-3"
              />
              <div className="flex-1">
                <div className="font-semibold">{plan.name}</div>
                <div className="text-sm text-gray-600">
                  {formatPrice(plan.price, plan.currency)}/{plan.interval}
                </div>
              </div>
            </label>
          ))}
        </div>
        {errors.planId && (
          <p className="text-red-500 text-sm mt-2">{errors.planId.message}</p>
        )}
      </div>

      {currentPlan && (
        <div className="card bg-primary-50 border-primary-200">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Összesen</p>
              <p className="text-2xl font-bold text-primary-600">
                {formatPrice(currentPlan.price, currentPlan.currency)}/{currentPlan.interval}
              </p>
            </div>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
      >
        {isLoading ? 'Feldolgozás...' : 'Rendelés megerősítése'}
      </button>
    </form>
  );
}

