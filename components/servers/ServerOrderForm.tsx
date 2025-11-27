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
  pricePerSlot: number | null;
  image: string | null;
  description: string | null;
  videoUrl: string | null;
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
  const [additionalVCpu, setAdditionalVCpu] = useState(0);
  const [additionalRamGB, setAdditionalRamGB] = useState(0);
  const [additionalSlots, setAdditionalSlots] = useState(0);
  const [upgradePrices, setUpgradePrices] = useState<{ pricePerVCpu: number; pricePerRamGB: number; currency: string } | null>(null);
  
  // Maximum értékek
  const MAX_RAM_GB = 30;
  const MAX_VCPU = 20;
  const MAX_SLOTS = 50;

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

  // Bővítési árak lekérése (minden bejelentkezett felhasználó számára elérhető)
  useEffect(() => {
    const fetchUpgradePrices = async () => {
      try {
        const response = await fetch('/api/admin/resource-upgrade-settings');
        if (response.ok) {
          const data = await response.json();
          if (data.settings) {
            setUpgradePrices(data.settings);
          }
        } else if (response.status === 401) {
          // Ha nincs bejelentkezve, akkor nincs bővítési ár
          setUpgradePrices(null);
        }
      } catch (error) {
        console.error('Upgrade prices fetch error:', error);
        setUpgradePrices(null);
      }
    };

    fetchUpgradePrices();
  }, []);

  // Ha nincs GamePackage, akkor redirect
  useEffect(() => {
    if (!selectedGamePackage) {
      toast.error('Nincs kiválasztott játék csomag');
      router.push(`/${locale}/games`);
    }
  }, [selectedGamePackage, locale, router]);

  const handleBillingSubmit = async (data: BillingInfoFormData) => {
    setIsLoading(true);
    try {
      // Mentjük el az adatokat az API-ba
      const response = await fetch('/api/user/billing-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Hiba történt a számlázási adatok mentése során');
        setIsLoading(false);
        return;
      }

      // Frissítjük a state-et - biztosítjuk, hogy minden mező meglegyen
      const savedData = result.billingInfo || data;
      // Ha nincs billingAddress, generáljuk a többi mezőből
      if (!savedData.billingAddress && savedData.street && savedData.city && savedData.postalCode && savedData.country) {
        savedData.billingAddress = `${savedData.street}, ${savedData.city} ${savedData.postalCode}, ${savedData.country}`;
      }
      
      setBillingFormData(savedData);
      setShowBillingForm(false);
      toast.success('Számlázási adatok sikeresen mentve');
    } catch (error) {
      console.error('Billing info save error:', error);
      // Ha az API hívás sikertelen, akkor is használjuk az adatokat lokálisan
      const localData = { ...data };
      if (!localData.billingAddress && localData.street && localData.city && localData.postalCode && localData.country) {
        localData.billingAddress = `${localData.street}, ${localData.city} ${localData.postalCode}, ${localData.country}`;
      }
      setBillingFormData(localData);
      setShowBillingForm(false);
      toast.error('Hiba történt a számlázási adatok mentése során');
    } finally {
      setIsLoading(false);
    }
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
        additionalVCpu: additionalVCpu || 0,
        additionalRamGB: additionalRamGB || 0,
        additionalSlots: additionalSlots || 0,
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

  // YouTube videó ID kinyerése
  const getYouTubeVideoId = (url: string | null): string | null => {
    if (!url || url.trim() === '') return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const videoId = selectedGamePackage.videoUrl ? getYouTubeVideoId(selectedGamePackage.videoUrl) : null;
  
  // Debug: ellenőrizzük, hogy van-e videó URL
  useEffect(() => {
    if (selectedGamePackage.videoUrl) {
      console.log('Video URL found:', selectedGamePackage.videoUrl);
      console.log('Extracted video ID:', videoId);
    }
  }, [selectedGamePackage.videoUrl, videoId]);

  return (
    <div className="space-y-6">
      {/* YouTube Videó - ha van */}
      {videoId && (
        <Card padding="lg" className="bg-white border-2 border-primary-200 shadow-xl">
          <h3 className="text-2xl font-bold mb-4 text-gray-900">Bemutató Videó</h3>
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              className="absolute top-0 left-0 w-full h-full rounded-lg"
              src={`https://www.youtube.com/embed/${videoId}`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </Card>
      )}

      {/* Game Package Info - Nagyobb, szebb design képpel */}
      <Card padding="lg" className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 shadow-xl overflow-hidden">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Kép rész - bal oldal */}
          <div className="md:col-span-1">
            <div className="relative h-64 md:h-full rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
              {selectedGamePackage.image ? (
                <img
                  src={selectedGamePackage.image}
                  alt={selectedGamePackage.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const placeholder = target.parentElement?.querySelector('.image-placeholder') as HTMLElement;
                    if (placeholder) {
                      placeholder.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <div className="image-placeholder absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200" style={{ display: selectedGamePackage.image ? 'none' : 'flex' }}>
                <span className="text-6xl font-bold text-primary-600">
                  {gameTypeLabels[selectedGamePackage.gameType]?.charAt(0) || '?'}
                </span>
              </div>
              {selectedGamePackage.discountPrice && (
                <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg z-10">
                  Akció
                </div>
              )}
            </div>
          </div>

          {/* Info rész - jobb oldal */}
          <div className="md:col-span-2">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-3xl font-bold mb-2 text-gray-900 flex items-center gap-2">
                  <Check className="w-6 h-6 text-emerald-600" />
                  {selectedGamePackage.name}
                </h3>
                <p className="text-lg font-bold text-gray-900 mb-2">
                  {gameTypeLabels[selectedGamePackage.gameType] || selectedGamePackage.gameType}
                </p>
                {selectedGamePackage.description && (
                  <p className="text-base text-gray-800 font-medium mb-4">{selectedGamePackage.description}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-bold text-gray-900 mb-1 uppercase">Slot</p>
                <p className="text-3xl font-bold text-primary-600">{selectedGamePackage.slot + additionalSlots}</p>
                <p className="text-xs text-gray-800 font-medium mt-1">{additionalSlots > 0 && <span className="text-green-600">(+{additionalSlots})</span>}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-bold text-gray-900 mb-1 uppercase">CPU</p>
                <p className="text-3xl font-bold text-primary-600">{selectedGamePackage.cpuCores + additionalVCpu}</p>
                <p className="text-xs text-gray-800 font-medium mt-1">vCore {additionalVCpu > 0 && <span className="text-green-600">(+{additionalVCpu})</span>}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-bold text-gray-900 mb-1 uppercase">RAM</p>
                <p className="text-3xl font-bold text-primary-600">{selectedGamePackage.ram + additionalRamGB}</p>
                <p className="text-xs text-gray-800 font-medium mt-1">GB {additionalRamGB > 0 && <span className="text-green-600">(+{additionalRamGB})</span>}</p>
              </div>
              <div className="bg-emerald-50 rounded-lg p-4 border-2 border-emerald-400">
                <p className="text-xs font-bold text-gray-900 mb-1 uppercase">Ár</p>
                <p className="text-2xl font-bold text-emerald-700">
                  {formatPrice(
                    (selectedGamePackage.discountPrice || selectedGamePackage.price) + 
                    (upgradePrices ? (additionalVCpu * upgradePrices.pricePerVCpu + additionalRamGB * upgradePrices.pricePerRamGB) : 0) +
                    (selectedGamePackage.pricePerSlot && additionalSlots > 0 ? additionalSlots * selectedGamePackage.pricePerSlot : 0),
                    selectedGamePackage.currency
                  )}
                </p>
                <p className="text-xs text-gray-900 font-semibold mt-1">/{selectedGamePackage.interval === 'month' ? 'hó' : 'év'}</p>
                {selectedGamePackage.discountPrice && (
                  <p className="text-xs text-gray-800 line-through mt-1 font-semibold">
                    {formatPrice(selectedGamePackage.price, selectedGamePackage.currency)}
                  </p>
                )}
                {((additionalVCpu > 0 || additionalRamGB > 0) && upgradePrices) || (additionalSlots > 0 && selectedGamePackage.pricePerSlot) ? (
                  <p className="text-xs text-green-700 font-semibold mt-1">
                    +{formatPrice(
                      (upgradePrices ? (additionalVCpu * upgradePrices.pricePerVCpu + additionalRamGB * upgradePrices.pricePerRamGB) : 0) +
                      (selectedGamePackage.pricePerSlot && additionalSlots > 0 ? additionalSlots * selectedGamePackage.pricePerSlot : 0),
                      selectedGamePackage.currency
                    )} bővítés
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Server Details */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          if (!billingFormData || !billingFormData.billingName || !billingFormData.billingAddress) {
            toast.error('Kérjük, töltsd ki a számlázási adatokat');
            setShowBillingForm(true);
            return;
          }
          handleSubmit(onSubmit)(e);
        }} 
        className="space-y-6"
      >
        <Card padding="lg" className="bg-white">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900">
            <Server className="w-6 h-6" />
            Szerver Információk
          </h2>
          
          <div className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-bold text-gray-900 mb-2">
                Szerver neve *
              </label>
              <input
                {...register('name')}
                type="text"
                id="name"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white text-base font-medium"
                placeholder="Pl: My Awesome Server"
              />
              {errors.name && (
                <p className="text-red-600 text-sm mt-1 font-semibold">{errors.name.message}</p>
              )}
            </div>

            {/* Erőforrás bővítés */}
            {((upgradePrices && (upgradePrices.pricePerVCpu > 0 || upgradePrices.pricePerRamGB > 0)) || selectedGamePackage.pricePerSlot) && (
            <div className="border-t pt-5 mt-5">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Erőforrás Bővítés (Opcionális)</h3>
              <p className="text-sm text-gray-600 mb-4">
                Bővítsd a szervered erőforrásait a GamePackage alapértelmezett értékei felett.
              </p>
              
              <div className="grid md:grid-cols-3 gap-4">
                {upgradePrices && upgradePrices.pricePerVCpu > 0 && (
                <div>
                  <label htmlFor="additionalVCpu" className="block text-sm font-medium text-gray-900 mb-2">
                    További vCPU (jelenleg: {selectedGamePackage.cpuCores} vCPU, max: {MAX_VCPU})
                  </label>
                  <input
                    type="number"
                    id="additionalVCpu"
                    min="0"
                    max={MAX_VCPU - selectedGamePackage.cpuCores}
                    value={additionalVCpu}
                    onChange={(e) => {
                      const value = Math.max(0, Math.min(MAX_VCPU - selectedGamePackage.cpuCores, parseInt(e.target.value) || 0));
                      setAdditionalVCpu(value);
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white text-base font-medium"
                    placeholder="0"
                  />
                  {upgradePrices && additionalVCpu > 0 && (
                    <p className="text-xs text-gray-600 mt-1">
                      +{formatPrice(additionalVCpu * upgradePrices.pricePerVCpu, upgradePrices.currency)}/hó
                    </p>
                  )}
                </div>
                )}

                {upgradePrices && upgradePrices.pricePerRamGB > 0 && (
                <div>
                  <label htmlFor="additionalRamGB" className="block text-sm font-medium text-gray-900 mb-2">
                    További RAM GB (jelenleg: {selectedGamePackage.ram} GB, max: {MAX_RAM_GB} GB)
                  </label>
                  <input
                    type="number"
                    id="additionalRamGB"
                    min="0"
                    max={MAX_RAM_GB - selectedGamePackage.ram}
                    value={additionalRamGB}
                    onChange={(e) => {
                      const value = Math.max(0, Math.min(MAX_RAM_GB - selectedGamePackage.ram, parseInt(e.target.value) || 0));
                      setAdditionalRamGB(value);
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white text-base font-medium"
                    placeholder="0"
                  />
                  {upgradePrices && additionalRamGB > 0 && (
                    <p className="text-xs text-gray-600 mt-1">
                      +{formatPrice(additionalRamGB * upgradePrices.pricePerRamGB, upgradePrices.currency)}/hó
                    </p>
                  )}
                </div>
                )}

                {selectedGamePackage.pricePerSlot && (
                <div>
                  <label htmlFor="additionalSlots" className="block text-sm font-medium text-gray-900 mb-2">
                    További Slot (jelenleg: {selectedGamePackage.slot}, max: {MAX_SLOTS})
                  </label>
                  <input
                    type="number"
                    id="additionalSlots"
                    min="0"
                    max={MAX_SLOTS - selectedGamePackage.slot}
                    value={additionalSlots}
                    onChange={(e) => {
                      const value = Math.max(0, Math.min(MAX_SLOTS - selectedGamePackage.slot, parseInt(e.target.value) || 0));
                      setAdditionalSlots(value);
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white text-base font-medium"
                    placeholder="0"
                  />
                  {selectedGamePackage.pricePerSlot && additionalSlots > 0 && (
                    <p className="text-xs text-gray-600 mt-1">
                      +{formatPrice(additionalSlots * selectedGamePackage.pricePerSlot, selectedGamePackage.currency)}/hó
                    </p>
                  )}
                </div>
                )}
              </div>

              {((additionalVCpu > 0 || additionalRamGB > 0) && upgradePrices) || (additionalSlots > 0 && selectedGamePackage.pricePerSlot) ? (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-semibold text-blue-900 mb-1">Bővítési költség:</p>
                  <p className="text-lg font-bold text-blue-700">
                    {formatPrice(
                      (upgradePrices ? (additionalVCpu * upgradePrices.pricePerVCpu + additionalRamGB * upgradePrices.pricePerRamGB) : 0) +
                      (selectedGamePackage.pricePerSlot && additionalSlots > 0 ? additionalSlots * selectedGamePackage.pricePerSlot : 0),
                      selectedGamePackage.currency
                    )}/hó
                  </p>
                </div>
              )}
            </div>
            )}
          </div>
        </Card>

        <Button
          type="submit"
          size="lg"
          isLoading={isLoading}
          className="w-full text-lg font-bold py-4"
          disabled={!billingFormData || !billingFormData.billingName || !billingFormData.billingAddress || isLoading}
        >
          {isLoading ? 'Feldolgozás...' : 'Rendelés Jóváhagyása'}
        </Button>
      </form>

      {/* Billing Info - Külön div-ben, hogy ne triggerelje a form submit-ot */}
      <div className="space-y-6">
        {showBillingForm ? (
          <BillingInfoForm
            initialData={billingFormData || undefined}
            onSubmit={handleBillingSubmit}
            isLoading={isLoading}
            showSubmitButton={true}
          />
        ) : billingFormData && billingFormData.billingName && billingFormData.billingAddress ? (
          <Card padding="lg" className="bg-blue-50 border-2 border-blue-300">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Számlázási Adatok</h3>
                <div className="space-y-2 text-base text-gray-800 font-medium">
                  <p><strong className="font-bold text-gray-900">Név:</strong> {billingFormData.billingName}</p>
                  {billingFormData.email && (
                    <p><strong className="font-bold text-gray-900">Email:</strong> {billingFormData.email}</p>
                  )}
                  {billingFormData.phone && (
                    <p><strong className="font-bold text-gray-900">Telefon:</strong> {billingFormData.phone}</p>
                  )}
                  <p><strong className="font-bold text-gray-900">Cím:</strong> {billingFormData.billingAddress || `${billingFormData.street}, ${billingFormData.city} ${billingFormData.postalCode}, ${billingFormData.country}`}</p>
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
      </div>

      <p className="text-sm text-center text-gray-800 font-semibold">
        A rendelés megerősítésével elfogadod az Általános Szerződési Feltételeket.
        <br />
        A szerver percek alatt készen áll a GamePackage specifikációk alapján.
      </p>
    </div>
  );
}

