'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Server, Check } from 'lucide-react';
import { BillingInfoForm, BillingInfoFormData } from './BillingInfoForm';

const serverOrderSchema = z.object({
  name: z.string().min(3, 'A névnek legalább 3 karakter hosszúnak kell lennie'),
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
  selectedGamePackage: GamePackage | null;
  locale: string;
}

const gameTypeLabels: Record<string, string> = {
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
  OTHER: 'Egyéb',
};

export function ServerOrderForm({ selectedGamePackage, locale }: ServerOrderFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [billingInfo, setBillingInfo] = useState<BillingInfoFormData | null>(null);
  const [showBillingForm, setShowBillingForm] = useState(false);
  const [billingFormData, setBillingFormData] = useState<BillingInfoFormData | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ServerOrderFormData>({
    resolver: zodResolver(serverOrderSchema),
    defaultValues: {
      name: '',
    },
  });

  // Felhasználó számlázási adatainak lekérése
  useEffect(() => {
    const fetchBillingInfo = async () => {
      try {
        const response = await fetch('/api/user/billing-info');
        if (response.ok) {
          const data = await response.json();
          if (data.billingInfo) {
            setBillingInfo(data.billingInfo);
            setBillingFormData(data.billingInfo);
          }
        }
      } catch (error) {
        console.error('Billing info fetch error:', error);
      }
    };

    fetchBillingInfo();
  }, []);

  // Ha nincs GamePackage, akkor redirect
  useEffect(() => {
    if (!selectedGamePackage) {
      toast.error('Nincs kiválasztott játék csomag');
      router.push(`/${locale}/games`);
    }
  }, [selectedGamePackage, locale, router]);

  const handleBillingSubmit = (data: BillingInfoFormData) => {
    setBillingFormData(data);
    setShowBillingForm(false);
  };

  const onSubmit = async (data: ServerOrderFormData) => {
    if (!selectedGamePackage) {
      toast.error('Nincs kiválasztott játék csomag');
      return;
    }

    if (!billingFormData) {
      toast.error('Kérjük, töltsd ki a számlázási adatokat');
      setShowBillingForm(true);
      return;
    }

    setIsLoading(true);
    try {
      const orderData = {
        name: data.name,
        gameType: selectedGamePackage.gameType,
        gamePackageId: selectedGamePackage.id,
        billingInfo: billingFormData,
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

  if (!selectedGamePackage) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Game Package Info */}
      <Card padding="lg" className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
        <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Check className="w-5 h-5 text-emerald-600" />
          Kiválasztott Csomag
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Csomag neve</p>
            <p className="font-semibold text-lg">{selectedGamePackage.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Ár</p>
            <p className="text-2xl font-bold text-primary-600">
              {formatPrice(selectedGamePackage.discountPrice || selectedGamePackage.price, selectedGamePackage.currency)}
              <span className="text-sm text-gray-600 font-normal">/{selectedGamePackage.interval === 'month' ? 'hó' : 'év'}</span>
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Specifikációk</p>
            <p className="font-semibold">{selectedGamePackage.slot} Slot • {selectedGamePackage.cpuCores} vCore • {selectedGamePackage.ram} GB RAM</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Játék</p>
            <p className="font-semibold">
              {gameTypeLabels[selectedGamePackage.gameType] || selectedGamePackage.gameType}
            </p>
          </div>
        </div>
      </Card>

      {/* Server Details */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card padding="lg">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Server className="w-5 h-5" />
            Szerver Információk
          </h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-1">
                Szerver neve *
              </label>
              <input
                {...register('name')}
                type="text"
                id="name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                placeholder="Pl: My Awesome Server"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Billing Info */}
        {showBillingForm ? (
          <BillingInfoForm
            initialData={billingFormData || undefined}
            onSubmit={handleBillingSubmit}
            isLoading={isLoading}
            showSubmitButton={true}
          />
        ) : billingFormData ? (
          <Card padding="lg" className="bg-blue-50 border-blue-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-3 text-gray-900">Számlázási Adatok</h3>
                <div className="space-y-2 text-base text-gray-800">
                  <p><strong className="font-bold">Név:</strong> {billingFormData.billingName}</p>
                  {billingFormData.email && (
                    <p><strong className="font-bold">Email:</strong> {billingFormData.email}</p>
                  )}
                  {billingFormData.phone && (
                    <p><strong className="font-bold">Telefon:</strong> {billingFormData.phone}</p>
                  )}
                  <p><strong className="font-bold">Cím:</strong> {billingFormData.billingAddress || `${billingFormData.street}, ${billingFormData.city} ${billingFormData.postalCode}, ${billingFormData.country}`}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowBillingForm(true)}
                className="ml-4"
              >
                Módosítás
              </Button>
            </div>
          </Card>
        ) : (
          <BillingInfoForm
            onSubmit={handleBillingSubmit}
            isLoading={isLoading}
          />
        )}

        <Button
          type="submit"
          size="lg"
          isLoading={isLoading}
          className="w-full"
          disabled={!billingFormData}
        >
          {isLoading ? 'Feldolgozás...' : 'Rendelés Jóváhagyása'}
        </Button>

        <p className="text-xs text-center text-gray-500">
          A rendelés megerősítésével elfogadod az Általános Szerződési Feltételeket.
          A szerver percek alatt készen áll a GamePackage specifikációk alapján.
        </p>
      </form>
    </div>
  );
}

