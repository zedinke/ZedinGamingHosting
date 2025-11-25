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
  mediaType: z.enum(['image', 'video']).default('image'),
  image: z.string().optional().refine(
    (val, ctx) => {
      const mediaType = ctx.parent.mediaType;
      if (mediaType === 'image') {
        if (!val || val.trim() === '') {
          return false;
        }
        return val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/');
      }
      return true; // Ha video, akkor nem kötelező
    },
    { message: 'Kép megadása kötelező, ha kép típusú slide-ot hozol létre' }
  ),
  video: z.string().optional().refine(
    (val, ctx) => {
      const mediaType = ctx.parent.mediaType;
      if (mediaType === 'video') {
        if (!val || val.trim() === '') {
          return false;
        }
        return val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/');
      }
      return true; // Ha image, akkor nem kötelező
    },
    { message: 'Videó megadása kötelező, ha videó típusú slide-ot hozol létre' }
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
  image: string | null;
  video: string | null;
  mediaType: string;
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
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(slide?.image || null);
  const [videoPreview, setVideoPreview] = useState<string | null>(slide?.video || null);

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
        setUploading(false);
        return null;
      }

      // A feltöltött kép URL-je
      const uploadedUrl = result.url;
      
      // Frissítjük az előnézetet
      setImagePreview(uploadedUrl);
      
      // Beállítjuk a form image mezőjét is - fontos, hogy shouldValidate: true legyen
      // Várunk egy kicsit, hogy a form frissüljön
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setValue('image', uploadedUrl, { 
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
      
      // MediaType-t is beállítjuk image-re, ha még nem volt beállítva
      const currentMediaType = watch('mediaType');
      if (currentMediaType !== 'image') {
        setValue('mediaType', 'image', { shouldValidate: true });
      }
      
      toast.success('Kép sikeresen feltöltve');
      setUploading(false);
      return uploadedUrl;
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Hiba történt a kép feltöltése során');
      setUploading(false);
      return null;
    }
  };

  const handleVideoUpload = async (file: File) => {
    setUploadingVideo(true);
    try {
      // Videó hossz ellenőrzése (max 30 másodperc)
      // Megjegyzés: A pontos hossz ellenőrzéshez videó metaadatokat kellene olvasni,
      // de ez böngészőben nehézkes. A fájlméret alapján becsülhetjük.
      
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/upload/video', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Hiba történt a videó feltöltése során');
        setUploadingVideo(false);
        return null;
      }

      // A feltöltött videó URL-je
      const uploadedUrl = result.url;
      
      // Frissítjük az előnézetet
      setVideoPreview(uploadedUrl);
      
      // Beállítjuk a form video mezőjét is
      setValue('video', uploadedUrl, { 
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
      
      // MediaType-t is beállítjuk videóra
      setValue('mediaType', 'video', { shouldValidate: true });
      
      toast.success('Videó sikeresen feltöltve');
      setUploadingVideo(false);
      return uploadedUrl;
    } catch (error) {
      console.error('Video upload error:', error);
      toast.error('Hiba történt a videó feltöltése során');
      setUploadingVideo(false);
      return null;
    }
  };

  const onSubmit = async (data: SlideshowSlideFormData) => {
    setIsLoading(true);
    try {
      const currentMediaType = watch('mediaType') || data.mediaType || 'image';
      
      // Media típus alapján kép vagy videó URL-je
      let mediaUrl = '';
      if (currentMediaType === 'image') {
        const currentImageValue = watch('image');
        mediaUrl = imagePreview || currentImageValue || data.image || '';
        
        if (!mediaUrl || mediaUrl.trim() === '') {
          toast.error('Kép megadása kötelező');
          setIsLoading(false);
          return;
        }
      } else {
        const currentVideoValue = watch('video');
        mediaUrl = videoPreview || currentVideoValue || data.video || '';
        
        if (!mediaUrl || mediaUrl.trim() === '') {
          toast.error('Videó megadása kötelező');
          setIsLoading(false);
          return;
        }
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
        mediaType: currentMediaType,
        image: currentMediaType === 'image' ? mediaUrl : null,
        video: currentMediaType === 'video' ? mediaUrl : null,
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

          {/* Media Type Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Média típus *</label>
            <select
              {...register('mediaType')}
              onChange={(e) => {
                setValue('mediaType', e.target.value as 'image' | 'video', { shouldValidate: true });
              }}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
            >
              <option value="image">Kép</option>
              <option value="video">Videó (max 30 másodperc)</option>
            </select>
          </div>

          {/* Image Upload Section */}
          {mediaType === 'image' && (
            <div>
              <label className="block text-sm font-medium mb-2">Kép *</label>
              
              {/* Képfeltöltés */}
              <div className="mb-4">
                <label className="block text-sm text-gray-700 mb-2 font-medium">
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:opacity-50 bg-white text-gray-900"
                />
                {uploading && (
                  <p className="text-sm text-gray-700 mt-1">Feltöltés folyamatban...</p>
                )}
              </div>

              {/* Vagy URL megadása */}
              <div>
                <label className="block text-sm text-gray-700 mb-2 font-medium">
                  Vagy add meg a kép URL-jét vagy relatív elérési útját:
                </label>
              <input
                {...register('image')}
                type="text"
                value={imagePreview !== null ? imagePreview : (watch('image') || '')}
                onChange={(e) => {
                  const value = e.target.value;
                  setImagePreview(value);
                  setValue('image', value, { shouldValidate: true });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
                placeholder="https://example.com/image.jpg vagy /uploads/slideshow/image.jpg"
              />
                {errors.image && (
                  <p className="text-red-600 text-sm mt-1 font-medium">{errors.image.message}</p>
                )}
                <p className="text-xs text-gray-600 mt-1">
                  Megadhatsz teljes URL-t (https://...) vagy relatív elérési utat (/uploads/...)
                </p>
              </div>

              {/* Kép előnézet */}
              {imagePreview && (
                <div className="mt-4">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full max-w-2xl rounded-lg border border-gray-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Video Upload Section */}
          {mediaType === 'video' && (
            <div>
              <label className="block text-sm font-medium mb-2">Videó * (max 30 másodperc, max 50MB)</label>
              
              {/* Videófeltöltés */}
              <div className="mb-4">
                <label className="block text-sm text-gray-700 mb-2 font-medium">
                  Tölts fel egy videót:
                </label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = await handleVideoUpload(file);
                    }
                  }}
                  disabled={uploadingVideo}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:opacity-50 bg-white text-gray-900"
                />
                {uploadingVideo && (
                  <p className="text-sm text-gray-700 mt-1">Feltöltés folyamatban...</p>
                )}
              </div>

              {/* Vagy URL megadása */}
              <div>
                <label className="block text-sm text-gray-700 mb-2 font-medium">
                  Vagy add meg a videó URL-jét vagy relatív elérési útját:
                </label>
                <input
                  {...register('video', {
                    onChange: (e) => {
                      const value = e.target.value;
                      setVideoPreview(value);
                      setValue('video', value, { shouldValidate: true });
                    },
                  })}
                  type="text"
                  value={videoPreview || watch('video') || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setVideoPreview(value);
                    setValue('video', value, { shouldValidate: true });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
                  placeholder="https://example.com/video.mp4 vagy /uploads/slideshow/videos/video.mp4"
                />
                {errors.video && (
                  <p className="text-red-600 text-sm mt-1 font-medium">{errors.video.message}</p>
                )}
                <p className="text-xs text-gray-600 mt-1">
                  Megadhatsz teljes URL-t (https://...) vagy relatív elérési utat (/uploads/...)
                </p>
              </div>

              {/* Videó előnézet */}
              {videoPreview && (
                <div className="mt-4">
                  <video
                    src={videoPreview}
                    controls
                    className="w-full max-w-2xl rounded-lg border border-gray-300"
                    onError={(e) => {
                      console.error('Video load error');
                    }}
                  >
                    A böngésződ nem támogatja a videó lejátszást.
                  </video>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900">
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
            />
            {errors.link && (
              <p className="text-red-600 text-sm mt-1 font-medium">{errors.link.message}</p>
            )}
            <p className="text-xs text-gray-600 mt-1">
              Ha nem adsz meg linket, a slide csak médiaként jelenik meg, gomb nélkül.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900">
              Gomb szöveg (opcionális - csak akkor jelenik meg, ha van link is)
            </label>
            <input
              {...register('buttonText')}
              type="text"
              placeholder="Pl: További információ"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:bg-gray-100 bg-white text-gray-900"
              disabled={!watch('link') || watch('link')?.trim() === ''}
            />
            {(!watch('link') || watch('link')?.trim() === '') && (
              <p className="text-xs text-gray-600 mt-1">
                A gomb csak akkor jelenik meg, ha van link is megadva.
              </p>
            )}
          </div>
        </div>
      </Card>

        <Card padding="lg" className="bg-white border border-gray-200">
          <h2 className="text-xl font-bold mb-4 text-gray-900">Beállítások</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900">Nyelv *</label>
            <select
              {...register('locale')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
            >
              <option value="hu">Magyar</option>
              <option value="en">English</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900">Sorrend</label>
            <input
              {...register('order', { valueAsNumber: true })}
              type="number"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
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

