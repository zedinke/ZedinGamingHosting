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
  image: z.string().url('Érvényes URL szükséges').min(1, 'Kép URL megadása kötelező'),
  link: z.union([
    z.string().url('Érvényes URL szükséges'),
    z.literal(''),
  ]).optional(),
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
      const imageUrl = imagePreview || data.image;

      if (!imageUrl || imageUrl.trim() === '') {
        toast.error('Kép megadása kötelező');
        setIsLoading(false);
        return;
      }

      const payload = {
        title: data.title && data.title.trim() !== '' ? data.title : null,
        subtitle: data.subtitle && data.subtitle.trim() !== '' ? data.subtitle : null,
        image: imageUrl,
        link: data.link && data.link.trim() !== '' ? data.link : null,
        buttonText: data.buttonText && data.buttonText.trim() !== '' ? data.buttonText : null,
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
                    if (url) {
                      // Frissítjük a form értékét is
                      const form = e.target.closest('form');
                      if (form) {
                        const imageInput = form.querySelector('input[name="image"]') as HTMLInputElement;
                        if (imageInput) {
                          imageInput.value = url;
                        }
                      }
                    }
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
                {...register('image')}
                type="url"
                value={imagePreview || ''}
                onChange={(e) => {
                  setImagePreview(e.target.value);
                  register('image').onChange(e);
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
            <label className="block text-sm font-medium mb-2">Link (opcionális)</label>
            <input
              {...register('link')}
              type="url"
              placeholder="https://example.com"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Gomb szöveg</label>
            <input
              {...register('buttonText')}
              type="text"
              placeholder="Pl: További információ"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
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

