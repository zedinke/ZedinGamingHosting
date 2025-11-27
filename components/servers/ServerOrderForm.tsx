'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Gamepad2, Users, Server, Check } from 'lucide-react';

const serverOrderSchema = z.object({
  name: z.string().min(3, 'A névnek legalább 3 karakter hosszúnak kell lennie'),
  gameType: z.enum(['ARK_EVOLVED', 'ARK_ASCENDED', 'MINECRAFT', 'RUST', 'VALHEIM', 'SEVEN_DAYS_TO_DIE', 'CONAN_EXILES', 'DAYZ', 'PROJECT_ZOMBOID', 'PALWORLD', 'ENSHROUDED', 'SONS_OF_THE_FOREST', 'THE_FOREST', 'GROUNDED', 'V_RISING', 'DONT_STARVE_TOGETHER', 'OTHER']),
  planId: z.string().min(1, 'Válassz egy csomagot'),
  maxPlayers: z.number().min(1).max(200),
});

type ServerOrderFormData = z.infer<typeof serverOrderSchema>;

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  features?: any;
}

interface GamePackage {
  id: string;
  gameType: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  slot: number;
  cpuCores: number;
  ram: number;
  discountPrice: number | null;
}

interface ServerOrderFormProps {
  plans: PricingPlan[];
  selectedPlan: PricingPlan | null;
  selectedGamePackage?: GamePackage | null;
  locale: string;
}

const gameTypes = {
  ARK_EVOLVED: { label: 'ARK: Survival Evolved', icon: '🦖', description: 'Dinosszauruszokkal teli túlélő játék' },
  ARK_ASCENDED: { label: 'ARK: Survival Ascended', icon: '🦖', description: 'ARK új generációs verziója' },
  MINECRAFT: { label: 'Minecraft', icon: '🧱', description: 'Végtelen lehetőségek sandbox játék' },
  RUST: { label: 'Rust', icon: '🦀', description: 'Túlélő játék építéssel és rablással' },
  VALHEIM: { label: 'Valheim', icon: '⚔️', description: 'Viking túlélő játék' },
  SEVEN_DAYS_TO_DIE: { label: '7 Days to Die', icon: '🧟', description: 'Zombi túlélő játék' },
  CONAN_EXILES: { label: 'Conan Exiles', icon: '⚔️', description: 'Barbár túlélő játék' },
  DAYZ: { label: 'DayZ', icon: '🧟', description: 'Zombi túlélő játék' },
  PROJECT_ZOMBOID: { label: 'Project Zomboid', icon: '🧟', description: 'Izometrikus zombi túlélő játék' },
  PALWORLD: { label: 'Palworld', icon: '🐾', description: 'Pokémon-stílusú túlélő játék' },
  ENSHROUDED: { label: 'Enshrouded', icon: '🗡️', description: 'Action RPG túlélő játék' },
  SONS_OF_THE_FOREST: { label: 'Sons of the Forest', icon: '🌲', description: 'Horror túlélő játék' },
  THE_FOREST: { label: 'The Forest', icon: '🌲', description: 'Horror túlélő játék' },
  GROUNDED: { label: 'Grounded', icon: '🐜', description: 'Mikro túlélő játék' },
  V_RISING: { label: 'V Rising', icon: '🧛', description: 'Vampír túlélő játék' },
  DONT_STARVE_TOGETHER: { label: "Don't Starve Together", icon: '🔥', description: 'Túlélő játék együtt' },
  OTHER: { label: 'Egyéb', icon: '🎮', description: 'Egyéb játék' },
};

export function ServerOrderForm({ plans, selectedPlan, selectedGamePackage, locale }: ServerOrderFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ServerOrderFormData>({
    resolver: zodResolver(serverOrderSchema),
    defaultValues: {
      planId: selectedPlan?.id || '',
      maxPlayers: selectedGamePackage?.slot || 10,
      gameType: (searchParams?.get('gameType') as any) || selectedGamePackage?.gameType || (searchParams?.get('game') as any) || '',
    },
  });

  const selectedPlanId = watch('planId');
  const selectedGameType = watch('gameType');
  const currentPlan = plans.find((p) => p.id === selectedPlanId) || selectedPlan;

  useEffect(() => {
    const gameParam = searchParams?.get('gameType') || searchParams?.get('game');
    if (gameParam && Object.keys(gameTypes).includes(gameParam)) {
      setValue('gameType', gameParam as any);
    }
    if (selectedGamePackage) {
      setValue('gameType', selectedGamePackage.gameType as any);
      setValue('maxPlayers', selectedGamePackage.slot);
    }
  }, [searchParams, setValue, selectedGamePackage]);

  const onSubmit = async (data: ServerOrderFormData) => {
    setIsLoading(true);
    try {
      const orderData = {
        ...data,
        gamePackageId: selectedGamePackage?.id,
      };
      
      const response = await fetch(`/api/servers/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Game Selection */}
      <Card padding="lg">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Gamepad2 className="w-5 h-5" />
          Játék Választása
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {Object.entries(gameTypes).map(([key, game]) => (
            <label
              key={key}
              className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedGameType === key
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-primary-300'
              }`}
            >
              <input
                {...register('gameType')}
                type="radio"
                value={key}
                className="sr-only"
              />
              <div className="text-center">
                <div className="text-4xl mb-2">{game.icon}</div>
                <div className="font-semibold text-sm">{game.label}</div>
                {selectedGameType === key && (
                  <div className="absolute top-2 right-2">
                    <div className="w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  </div>
                )}
              </div>
            </label>
          ))}
        </div>
        {errors.gameType && (
          <p className="text-red-500 text-sm mt-2">{errors.gameType.message}</p>
        )}
      </Card>

      {/* Server Details */}
      <Card padding="lg">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Server className="w-5 h-5" />
          Szerver Információk
        </h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2 text-gray-700">
              Szerver neve
            </label>
            <input
              {...register('name')}
              type="text"
              id="name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              placeholder="Pl: My Awesome Server"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="maxPlayers" className="block text-sm font-medium mb-2 text-gray-700">
              <Users className="w-4 h-4 inline mr-1" />
              Maximális játékosok száma
            </label>
            <input
              {...register('maxPlayers', { valueAsNumber: true })}
              type="number"
              id="maxPlayers"
              min="1"
              max="200"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            />
            <p className="text-xs text-gray-500 mt-1">
              Ajánlott: {selectedGameType === 'MINECRAFT' ? '20-50' : (selectedGameType === 'ARK_EVOLVED' || selectedGameType === 'ARK_ASCENDED') ? '10-70' : '10-32'}
            </p>
            {errors.maxPlayers && (
              <p className="text-red-500 text-sm mt-1">{errors.maxPlayers.message}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Pricing Plans */}
      <Card padding="lg">
        <h2 className="text-xl font-bold mb-4">Árazási Csomag</h2>
        
        <div className="space-y-3">
          {plans.map((plan) => (
            <label
              key={plan.id}
              className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedPlanId === plan.id
                  ? 'border-primary-600 bg-primary-50 shadow-md'
                  : 'border-gray-200 hover:border-primary-300 hover:shadow-sm'
              }`}
            >
              <input
                {...register('planId')}
                type="radio"
                value={plan.id}
                className="mr-4 w-5 h-5 text-primary-600 focus:ring-primary-500"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-semibold text-lg">{plan.name}</div>
                  <div className="text-xl font-bold text-primary-600">
                    {formatPrice(plan.price, plan.currency)}
                    <span className="text-sm text-gray-600 font-normal">/{plan.interval === 'month' ? 'hó' : plan.interval}</span>
                  </div>
                </div>
                {plan.features && Array.isArray(plan.features) && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {plan.features.slice(0, 3).map((feature: string, idx: number) => (
                      <Badge key={idx} variant="info" size="sm">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </label>
          ))}
        </div>
        {errors.planId && (
          <p className="text-red-500 text-sm mt-2">{errors.planId.message}</p>
        )}
      </Card>

      {/* Order Summary */}
      {currentPlan && (
        <Card padding="lg" className="bg-gradient-to-r from-primary-50 to-secondary-50 border-primary-200">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600 mb-1">Havi költség</p>
              <p className="text-3xl font-bold text-primary-600">
                {formatPrice(currentPlan.price, currentPlan.currency)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Automatikus számlázás minden hónapban
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">Játék</p>
              <p className="font-semibold">
                {selectedGameType ? gameTypes[selectedGameType as keyof typeof gameTypes]?.label : 'Nincs kiválasztva'}
              </p>
            </div>
          </div>
        </Card>
      )}

      <Button
        type="submit"
        size="lg"
        isLoading={isLoading}
        className="w-full"
      >
        {isLoading ? 'Feldolgozás...' : 'Rendelés Megerősítése'}
      </Button>

      <p className="text-xs text-center text-gray-500">
        A rendelés megerősítésével elfogadod az Általános Szerződési Feltételeket.
        A szerver percek alatt készen áll.
      </p>
    </form>
  );
}

