'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const slideshowSlideSchema = z.object({
  title: z.string().optional().or(z.literal('')),
  subtitle: z.string().optional().or(z.literal('')),
  image: z.string().min(1, 'Kép megadása kötelező').refine(
    (val) => {
      // URL vagy relatív path (pl. /uploads/slideshow/image.jpg)
      return val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/');
    },
    { message: 'Érvényes URL vagy fájl elérési út szükséges' }
  ),
  link: z.union([
    z.string().url('Érvényes URL szükséges'),
    z.literal(''),
    z.null(),
  ]).optional().nullable(),
  buttonText: z.string().optional().or(z.literal('')),
  isActive: z.boolean(),
  order: z.number().int().min(0),
  locale: z.enum(['hu', 'en']),
});

type SlideshowSlideFormData = z.infer<typeof slideshowSlideSchema>;

interface SlideshowSlide {
  id: string;
  title: string | null;
  subtitle: string | null;
  image: string;
  link: string | null;
  buttonText: string | null;
  isActive: boolean;
  order: number;
  locale: string;
}

interface SlideshowFormProps {
  locale: string;
  slide?: SlideshowSlide;
}

export function SlideshowForm({ locale, slide }: SlideshowFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(slide?.image || null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SlideshowSlideFormData>({
    resolver: zodResolver(slideshowSlideSchema),
    defaultValues: slide
      ? {
          title: slide.title || '',
          subtitle: slide.subtitle || '',
          image: slide.image,
          link: slide.link || '',
          buttonText: slide.buttonText || '',
          isActive: slide.isActive,
          order: slide.order,
          locale: slide.locale as 'hu' | 'en',
        }
      : {
          title: '',
          subtitle: '',
          image: '',
          link: '',
          buttonText: '',
          isActive: true,
          order: 0,
          locale: 'hu',
        },
  });

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/upload/image', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Hiba történt a kép feltöltése során');
        return null;
      }

      toast.success('Kép sikeresen feltöltve');
      setImagePreview(result.url);
      // Beállítjuk a form image mezőjét is
      setValue('image', result.url, { shouldValidate: true });
      return result.url;
    } catch (error) {
      toast.error('Hiba történt a kép feltöltése során');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: SlideshowSlideFormData) => {
    setIsLoading(true);
    try {
      // Ha van imagePreview, azt használjuk (feltöltött kép)
      // De először ellenőrizzük, hogy a form image mezője is frissítve van-e
      const currentImageValue = watch('image');
      const imageUrl = imagePreview || currentImageValue || data.image;

      if (!imageUrl || imageUrl.trim() === '') {
        toast.error('Kép megadása kötelező');
        setIsLoading(false);
        return;
      }

      // Ha az imageUrl nem egyezik meg a form értékével, frissítjük
      if (imageUrl !== data.image && imageUrl !== currentImageValue) {
        setValue('image', imageUrl, { shouldValidate: true });
        // Várunk egy kicsit, hogy a validáció frissüljön
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Ha nincs link, de van buttonText, akkor a buttonText-et is null-ra állítjuk
      // (mert a gomb csak akkor jelenik meg, ha van link is)
      const linkValue = data.link && data.link.trim() !== '' ? data.link : null;
      const buttonTextValue = linkValue && data.buttonText && data.buttonText.trim() !== '' 
        ? data.buttonText 
        : null;

      const payload = {
        title: data.title && data.title.trim() !== '' ? data.title : null,
        subtitle: data.subtitle && data.subtitle.trim() !== '' ? data.subtitle : null,
        image: imageUrl,
        link: linkValue,
        buttonText: buttonTextValue,
        isActive: data.isActive,
        order: data.order,
        locale: data.locale,
      };

      const url = slide
        ? `/api/admin/cms/slideshow/${slide.id}`
        : '/api/admin/cms/slideshow';
      const method = slide ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        // Részletes hibaüzenet megjelenítése
        if (result.details && Array.isArray(result.details)) {
          const errorMessages = result.details.map((err: any) => `${err.path.join('.')}: ${err.message}`).join(', ');
          toast.error(result.error + ': ' + errorMessages);
        } else {
          toast.error(result.error || 'Hiba történt');
        }
        console.error('API Error:', result);
        return;
      }

      toast.success(slide ? 'Slide frissítve' : 'Slide létrehozva');
      router.push(`/${locale}/admin/cms/slideshow`);
      router.refresh();
    } catch (error) {
      toast.error('Hiba történt');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card padding="lg">
        <h2 className="text-xl font-bold mb-4">Slide Információk</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Cím</label>
            <input
              {...register('title')}
              type="text"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Alcím</label>
            <textarea
              {...register('subtitle')}
              rows={4}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Kép *</label>
            
            {/* Képfeltöltés */}
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-2">
                Vagy tölts fel egy képet:
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const url = await handleImageUpload(file);
                    // A handleImageUpload már beállítja a setValue-t
                  }
                }}
                disabled={uploading}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
              />
              {uploading && (
                <p className="text-sm text-gray-600 mt-1">Feltöltés folyamatban...</p>
              )}
            </div>

            {/* Vagy URL megadása */}
            <div>
              <label className="block text-sm text-gray-600 mb-2">
                Vagy add meg a kép URL-jét:
              </label>
              <input
                {...register('image', {
                  onChange: (e) => {
                    setImagePreview(e.target.value);
                  },
                })}
                type="url"
                value={imagePreview || watch('image') || ''}
                onChange={(e) => {
                  setImagePreview(e.target.value);
                  setValue('image', e.target.value, { shouldValidate: true });
                }}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="https://example.com/image.jpg"
              />
              {errors.image && (
                <p className="text-red-500 text-sm mt-1">{errors.image.message}</p>
              )}
            </div>

            {/* Kép előnézet */}
            {imagePreview && (
              <div className="mt-4">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full max-w-2xl rounded-lg border"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Link (opcionális - csak akkor szükséges, ha gombot szeretnél megjeleníteni)
            </label>
            <input
              {...register('link', {
                validate: (value) => {
                  // Ha üres vagy null, akkor OK (opcionális mező)
                  if (!value || value.trim() === '') {
                    return true;
                  }
                  // Ha van érték, akkor URL-nek kell lennie
                  try {
                    new URL(value);
                    return true;
                  } catch {
                    return 'Érvényes URL szükséges';
                  }
                },
              })}
              type="text"
              placeholder="https://example.com"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            {errors.link && (
              <p className="text-red-500 text-sm mt-1">{errors.link.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Ha nem adsz meg linket, a slide csak képként jelenik meg, gomb nélkül.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Gomb szöveg (opcionális - csak akkor jelenik meg, ha van link is)
            </label>
            <input
              {...register('buttonText')}
              type="text"
              placeholder="Pl: További információ"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:bg-gray-100"
              disabled={!watch('link') || watch('link')?.trim() === ''}
            />
            {(!watch('link') || watch('link')?.trim() === '') && (
              <p className="text-xs text-gray-500 mt-1">
                A gomb csak akkor jelenik meg, ha van link is megadva.
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card padding="lg">
        <h2 className="text-xl font-bold mb-4">Beállítások</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nyelv *</label>
            <select
              {...register('locale')}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="hu">Magyar</option>
              <option value="en">English</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Sorrend</label>
            <input
              {...register('order', { valueAsNumber: true })}
              type="number"
              min="0"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              {...register('isActive')}
              type="checkbox"
              id="isActive"
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium">
              Aktív
            </label>
          </div>
        </div>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" isLoading={isLoading} size="lg">
          {slide ? 'Frissítés' : 'Létrehozás'}
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

