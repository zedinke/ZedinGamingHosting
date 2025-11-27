'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { GameType } from '@prisma/client';
import { Button } from '@/components/ui/Button';

const gamePackageSchema = z.object({
  gameType: z.nativeEnum(GameType, { required_error: 'Játék típus megadása kötelező' }),
  name: z.string().min(1, 'Név megadása kötelező'),
  description: z.string().optional(),
  price: z.number().min(0, 'Az ár nem lehet negatív'),
  currency: z.string().min(1, 'Pénznem megadása kötelező'),
  interval: z.enum(['month', 'year']),
  image: z.string().optional(),
  videoUrl: z.string().url('Érvényes YouTube URL megadása kötelező').optional().or(z.literal('')),
  slot: z.number().int().min(1, 'Slot szám megadása kötelező'),
  cpuCores: z.number().int().min(1, 'CPU vCore szám megadása kötelező'),
  ram: z.number().int().min(1, 'RAM mennyiség megadása kötelező'),
  discountPrice: z.number().min(0).optional().nullable(),
  isActive: z.boolean(),
  order: z.number().int().min(0),
});

type GamePackageFormData = z.infer<typeof gamePackageSchema>;

interface GamePackage {
  id: string;
  gameType: GameType;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  interval: string;
  image: string | null;
  videoUrl: string | null;
  slot: number;
  cpuCores: number;
  ram: number;
  discountPrice: number | null;
  isActive: boolean;
  order: number;
}

interface GamePackageFormProps {
  locale: string;
  package?: GamePackage;
}

export function GamePackageForm({ locale, package: packageData }: GamePackageFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(packageData?.image || null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [gameTypes, setGameTypes] = useState<Array<{ value: GameType; label: string }>>([]);
  const [loadingGameTypes, setLoadingGameTypes] = useState(true);

  // Elérhető játékok betöltése
  useEffect(() => {
    const fetchGameTypes = async () => {
      try {
        const response = await fetch('/api/games/available');
        if (response.ok) {
          const data = await response.json();
          setGameTypes(data.gameTypes || []);
        } else {
          console.error('Hiba az elérhető játékok lekérése során');
          // Fallback: üres lista
          setGameTypes([]);
        }
      } catch (error) {
        console.error('Hiba az elérhető játékok lekérése során:', error);
        setGameTypes([]);
      } finally {
        setLoadingGameTypes(false);
      }
    };

    fetchGameTypes();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<GamePackageFormData>({
    resolver: zodResolver(gamePackageSchema),
    defaultValues: packageData
      ? {
          gameType: packageData.gameType,
          name: packageData.name,
          description: packageData.description || '',
          price: packageData.price,
          currency: packageData.currency,
          interval: packageData.interval as 'month' | 'year',
          image: packageData.image || '',
          videoUrl: packageData.videoUrl || '',
          slot: packageData.slot,
          cpuCores: packageData.cpuCores,
          ram: packageData.ram,
          discountPrice: packageData.discountPrice,
          isActive: packageData.isActive,
          order: packageData.order,
        }
      : {
          gameType: 'MINECRAFT',
          name: '',
          description: '',
          price: 0,
          currency: 'HUF',
          interval: 'month',
          image: '',
          videoUrl: '',
          slot: 10,
          cpuCores: 2,
          ram: 4,
          discountPrice: null,
          isActive: true,
          order: 0,
        },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Kép méret ellenőrzése (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A kép mérete nem lehet nagyobb 5MB-nál');
      return;
    }

    // Kép típus ellenőrzése
    if (!file.type.startsWith('image/')) {
      toast.error('Csak képfájlok tölthetők fel');
      return;
    }

    setUploadingImage(true);

    try {
      // Kép előnézet
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Kép feltöltése
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'game-packages');

      const response = await fetch('/api/admin/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Hiba történt a kép feltöltése során');
      }

      const data = await response.json();
      setValue('image', data.url);
      toast.success('Kép sikeresen feltöltve');
    } catch (error: any) {
      toast.error(error.message || 'Hiba történt a kép feltöltése során');
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const onSubmit = async (data: GamePackageFormData) => {
    setIsLoading(true);
    try {
      const url = packageData
        ? `/api/admin/game-packages/${packageData.id}`
        : '/api/admin/game-packages';
      const method = packageData ? 'PUT' : 'POST';

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

      toast.success(packageData ? 'Csomag frissítve' : 'Csomag létrehozva');
      router.push(`/${locale}/admin/cms/game-packages`);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Hiba történt');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Alap információk */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Alap információk</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="gameType" className="block text-sm font-semibold text-gray-900 mb-1">
                Játék típus *
              </label>
              <select
                {...register('gameType')}
                id="gameType"
                disabled={loadingGameTypes}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingGameTypes ? (
                  <option>Játékok betöltése...</option>
                ) : gameTypes.length === 0 ? (
                  <option>Nincs elérhető játék</option>
                ) : (
                  gameTypes.map((game) => (
                    <option key={game.value} value={game.value}>
                      {game.label}
                    </option>
                  ))
                )}
              </select>
              {errors.gameType && (
                <p className="text-red-500 text-sm mt-1">{errors.gameType.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-1">
                Csomag neve *
              </label>
              <input
                {...register('name')}
                type="text"
                id="name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                placeholder="Pl. Starter Pack"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="description" className="block text-sm font-semibold text-gray-900 mb-1">
              Leírás
            </label>
            <textarea
              {...register('description')}
              id="description"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
              placeholder="Csomag leírása..."
            />
          </div>
        </div>

        {/* Kép feltöltés */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Kép</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="image" className="block text-sm font-semibold text-gray-900 mb-1">
                Csomag képe (Ajánlott méret: 800x600px, max 5MB)
              </label>
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white disabled:opacity-50"
              />
              {uploadingImage && (
                <p className="text-sm text-gray-700 font-medium mt-1">Kép feltöltése...</p>
              )}
            </div>

            {imagePreview && (
              <div className="relative w-full max-w-md">
                <img
                  src={imagePreview}
                  alt="Előnézet"
                  className="w-full h-48 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setValue('image', '');
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                >
                  Törlés
                </button>
              </div>
            )}
          </div>
        </div>

        {/* YouTube videó */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">YouTube Videó</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="videoUrl" className="block text-sm font-semibold text-gray-900 mb-1">
                YouTube videó URL (opcionális)
              </label>
              <input
                {...register('videoUrl')}
                type="url"
                id="videoUrl"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <p className="text-xs text-gray-600 mt-1">
                A videó a szerver rendelési oldalon jelenik meg. Támogatott formátumok: youtube.com/watch?v=... vagy youtu.be/...
              </p>
              {errors.videoUrl && (
                <p className="text-red-500 text-sm mt-1">{errors.videoUrl.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Specifikációk */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Specifikációk</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="slot" className="block text-sm font-semibold text-gray-900 mb-1">
                Fix Slot szám *
              </label>
              <input
                {...register('slot', { valueAsNumber: true })}
                type="number"
                id="slot"
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
              />
              {errors.slot && (
                <p className="text-red-500 text-sm mt-1">{errors.slot.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="cpuCores" className="block text-sm font-semibold text-gray-900 mb-1">
                Fix CPU vCore szám *
              </label>
              <input
                {...register('cpuCores', { valueAsNumber: true })}
                type="number"
                id="cpuCores"
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
              />
              {errors.cpuCores && (
                <p className="text-red-500 text-sm mt-1">{errors.cpuCores.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="ram" className="block text-sm font-semibold text-gray-900 mb-1">
                Fix RAM mennyiség (GB) *
              </label>
              <input
                {...register('ram', { valueAsNumber: true })}
                type="number"
                id="ram"
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
              />
              {errors.ram && (
                <p className="text-red-500 text-sm mt-1">{errors.ram.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Árazás */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Árazás</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-semibold text-gray-900 mb-1">
                Ár *
              </label>
              <input
                {...register('price', { valueAsNumber: true })}
                type="number"
                id="price"
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
              />
              {errors.price && (
                <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="currency" className="block text-sm font-semibold text-gray-900 mb-1">
                Pénznem *
              </label>
              <select
                {...register('currency')}
                id="currency"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
              >
                <option value="HUF">HUF</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>

            <div>
              <label htmlFor="interval" className="block text-sm font-semibold text-gray-900 mb-1">
                Időszak *
              </label>
              <select
                {...register('interval')}
                id="interval"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
              >
                <option value="month">Havi</option>
                <option value="year">Éves</option>
              </select>
            </div>

            <div>
              <label htmlFor="discountPrice" className="block text-sm font-semibold text-gray-900 mb-1">
                Akciós ár (opcionális)
              </label>
              <input
                {...register('discountPrice', { valueAsNumber: true })}
                type="number"
                id="discountPrice"
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Beállítások */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Beállítások</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="order" className="block text-sm font-semibold text-gray-900 mb-1">
                Rendezési sorrend
              </label>
              <input
                {...register('order', { valueAsNumber: true })}
                type="number"
                id="order"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
              />
            </div>

            <div className="flex items-center">
              <input
                {...register('isActive')}
                type="checkbox"
                id="isActive"
                className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="isActive" className="ml-2 text-sm font-semibold text-gray-900">
                Aktív (megjelenik és rendelhető)
              </label>
            </div>
          </div>
        </div>

        {/* Műveletek */}
        <div className="flex gap-4 pt-4 border-t">
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {isLoading ? 'Mentés...' : packageData ? 'Frissítés' : 'Létrehozás'}
          </Button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Mégse
          </button>
        </div>
      </div>
    </form>
  );
}

