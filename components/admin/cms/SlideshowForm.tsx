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
  image: z.string().optional(),
  video: z.string().optional(),
  link: z.union([
    z.string().url('Érvényes URL szükséges'),
    z.literal(''),
    z.null(),
  ]).optional().nullable(),
  buttonText: z.string().optional().or(z.literal('')),
  isActive: z.boolean(),
  order: z.number().int().min(0),
  locale: z.enum(['hu', 'en']),
}).superRefine((data, ctx) => {
  // Kép validáció
  if (data.mediaType === 'image') {
    if (!data.image || data.image.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Kép megadása kötelező, ha kép típusú slide-ot hozol létre',
        path: ['image'],
      });
    } else if (!data.image.startsWith('http://') && !data.image.startsWith('https://') && !data.image.startsWith('/')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Érvényes URL vagy fájl elérési út szükséges',
        path: ['image'],
      });
    }
  }
  
  // Videó validáció
  if (data.mediaType === 'video') {
    if (!data.video || data.video.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Videó megadása kötelező, ha videó típusú slide-ot hozol létre',
        path: ['video'],
      });
    } else if (!data.video.startsWith('http://') && !data.video.startsWith('https://') && !data.video.startsWith('/')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Érvényes URL vagy fájl elérési út szükséges',
        path: ['video'],
      });
    }
  }
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
  
  // Ensure locale is valid
  const validLocale = (locale === 'hu' || locale === 'en') ? locale : 'hu';

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
          image: slide.image || undefined,
          video: slide.video || undefined,
          mediaType: (slide.mediaType || 'image') as 'image' | 'video',
          link: slide.link || '',
          buttonText: slide.buttonText || '',
          isActive: slide.isActive,
          order: slide.order,
          locale: slide.locale as 'hu' | 'en',
        }
      : {
          title: '',
          subtitle: '',
          image: undefined,
          video: undefined,
          mediaType: 'image' as 'image' | 'video',
          link: '',
          buttonText: '',
          isActive: true,
          order: 0,
          locale: validLocale as 'hu' | 'en',
        },
  });

  const handleImageUpload = async (file: File) => {
    if (!file) {
      toast.error('Nincs fájl kiválasztva');
      return null;
    }

    setUploading(true);
    try {
      console.log('Starting image upload (base64 method):', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      });

      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = (error) => {
          reject(error);
        };
        reader.readAsDataURL(file);
      });

      const base64Data = await base64Promise;
      console.log('File converted to base64, size:', base64Data.length);

      // Send base64 data to API
      const response = await fetch('/api/admin/upload/image-base64', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: base64Data,
          fileName: file.name,
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      const result = await response.json();
      console.log('Response result:', result);

      if (!response.ok) {
        const errorMessage = result.error || 'Hiba történt a kép feltöltése során';
        console.error('Upload error:', errorMessage);
        toast.error(errorMessage);
        setUploading(false);
        return null;
      }

      // A feltöltött kép URL-je - használjuk a publicUrl-t ha van, különben az url-t
      const uploadedUrl = result.publicUrl || result.url;
      
      if (!uploadedUrl) {
        console.error('No URL in response:', result);
        toast.error('A válasz nem tartalmazza a kép URL-jét');
        setUploading(false);
        return null;
      }

      console.log('Upload successful, URL:', uploadedUrl);
      console.log('Full response:', result);
      
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
      
      console.log('Form updated with image URL:', uploadedUrl);
      toast.success('Kép sikeresen feltöltve');
      setUploading(false);
      return uploadedUrl;
    } catch (error: any) {
      console.error('Image upload error:', error);
      const errorMessage = error.message || 'Hiba történt a kép feltöltése során';
      toast.error(errorMessage);
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

  if (!validLocale) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Hibás locale érték. Kérjük, frissítsd az oldalt.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Card padding="lg" className="bg-white border border-gray-200">
          <h2 className="text-lg font-bold mb-3 text-gray-900">Slide Információk</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900">Cím</label>
            <input
              {...register('title')}
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
              placeholder="Opcionális cím"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900">Alcím</label>
            <textarea
              {...register('subtitle')}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white text-gray-900"
              placeholder="Opcionális alcím"
            />
          </div>

          {/* Media Type Selection */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900">Média típus *</label>
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
          {watch('mediaType') === 'image' && (
            <div>
              <label className="block text-sm font-medium mb-2">Kép *</label>
              
              {/* Képfeltöltés */}
              <div className="mb-4">
                <label className="block text-sm text-gray-700 mb-2 font-medium">
                  Vagy tölts fel egy képet:
                </label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    id="image-upload-input"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        console.log('File selected:', file.name, file.size, file.type);
                        const url = await handleImageUpload(file);
                        if (url) {
                          console.log('Upload completed, URL:', url);
                        } else {
                          console.error('Upload failed');
                        }
                        // Reset input value so same file can be selected again
                        e.target.value = '';
                      }
                    }}
                    disabled={uploading}
                  />
                  <label
                    htmlFor="image-upload-input"
                    className={`flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:opacity-50 bg-white text-gray-900 cursor-pointer text-center hover:bg-gray-50 transition-colors ${
                      uploading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {uploading ? 'Feltöltés folyamatban...' : 'Kép kiválasztása'}
                  </label>
                  <button
                    type="button"
                    onClick={async () => {
                      const input = document.getElementById('image-upload-input') as HTMLInputElement;
                      const file = input?.files?.[0];
                      if (!file) {
                        toast.error('Kérjük, válassz ki egy képet először!');
                        input?.click();
                        return;
                      }
                      console.log('Direct upload button clicked:', file.name, file.size, file.type);
                      
                      // Show loading immediately
                      toast.loading('Feltöltés folyamatban...', { id: 'upload-toast' });
                      
                      const url = await handleImageUpload(file);
                      if (url) {
                        console.log('Direct upload completed, URL:', url);
                        toast.success('Kép sikeresen feltöltve!', { id: 'upload-toast' });
                      } else {
                        console.error('Direct upload failed');
                        toast.error('A feltöltés sikertelen. Ellenőrizd a konzolt a részletekért.', { id: 'upload-toast' });
                      }
                    }}
                    disabled={uploading}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm hover:shadow-md"
                  >
                    {uploading ? 'Feltöltés...' : 'Feltöltés'}
                  </button>
                </div>
                {uploading && (
                  <p className="text-sm text-gray-700 mt-2 flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Feltöltés folyamatban...
                  </p>
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
          {watch('mediaType') === 'video' && (
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
                  {...register('video')}
                  type="text"
                  value={videoPreview !== null ? videoPreview : (watch('video') || '')}
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
          <h2 className="text-lg font-bold mb-3 text-gray-900">Beállítások</h2>
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
    </div>
  );
}

