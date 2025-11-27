'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const homepageSectionSchema = z.object({
  type: z.enum(['hero', 'features', 'stats', 'cta', 'slideshow']),
  title: z.string().optional().or(z.literal('')),
  subtitle: z.string().optional().or(z.literal('')),
  content: z.string().optional().or(z.literal('')),
  image: z.union([
    z.string().url('Érvényes URL szükséges'),
    z.literal(''),
  ]).optional(),
  buttonText: z.string().optional().or(z.literal('')),
  buttonLink: z.union([
    z.string().url('Érvényes URL szükséges'),
    z.literal(''),
  ]).optional(),
  isActive: z.boolean(),
  order: z.number().int().min(0),
  locale: z.enum(['hu', 'en']),
});

type HomepageSectionFormData = z.infer<typeof homepageSectionSchema>;

interface HomepageSection {
  id: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  content: any;
  image: string | null;
  buttonText: string | null;
  buttonLink: string | null;
  isActive: boolean;
  order: number;
  locale: string;
}

interface HomepageSectionFormProps {
  locale: string;
  section?: HomepageSection;
}

export function HomepageSectionForm({ locale, section }: HomepageSectionFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const getContentString = (content: any): string => {
    if (typeof content === 'string') return content;
    if (typeof content === 'object') {
      return JSON.stringify(content, null, 2);
    }
    return '';
  };

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<HomepageSectionFormData>({
    resolver: zodResolver(homepageSectionSchema),
    defaultValues: section
      ? {
          type: section.type as 'hero' | 'features' | 'stats' | 'cta' | 'slideshow',
          title: section.title || '',
          subtitle: section.subtitle || '',
          content: getContentString(section.content),
          image: section.image || '',
          buttonText: section.buttonText || '',
          buttonLink: section.buttonLink || '',
          isActive: section.isActive,
          order: section.order,
          locale: section.locale as 'hu' | 'en',
        }
      : {
          type: 'hero',
          title: '',
          subtitle: '',
          content: '',
          image: '',
          buttonText: '',
          buttonLink: '',
          isActive: true,
          order: 0,
          locale: 'hu',
        },
  });

  const onSubmit = async (data: HomepageSectionFormData) => {
    setIsLoading(true);
    try {
      // Convert content string to JSON if needed
      let contentJson: any = null;
      if (data.content) {
        try {
          contentJson = JSON.parse(data.content);
        } catch {
          contentJson = { text: data.content };
        }
      }

      const payload = {
        type: data.type,
        title: data.title && data.title.trim() !== '' ? data.title : null,
        subtitle: data.subtitle && data.subtitle.trim() !== '' ? data.subtitle : null,
        content: contentJson,
        image: data.image && data.image.trim() !== '' ? data.image : null,
        buttonText: data.buttonText && data.buttonText.trim() !== '' ? data.buttonText : null,
        buttonLink: data.buttonLink && data.buttonLink.trim() !== '' ? data.buttonLink : null,
        isActive: data.isActive,
        order: data.order,
        locale: data.locale,
      };

      const url = section
        ? `/api/admin/cms/homepage/${section.id}`
        : '/api/admin/cms/homepage';
      const method = section ? 'PUT' : 'POST';

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

      toast.success(section ? 'Szekció frissítve' : 'Szekció létrehozva');
      router.push(`/${locale}/admin/cms/homepage`);
      router.refresh();
    } catch (error) {
      toast.error('Hiba történt');
    } finally {
      setIsLoading(false);
    }
  };

  const sectionType = watch('type');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card padding="lg">
        <h2 className="text-xl font-bold mb-4">Alapinformációk</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Szekció típusa *</label>
            <select
              {...register('type')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
            >
              <option value="hero">Hero</option>
              <option value="features">Funkciók</option>
              <option value="stats">Statisztikák</option>
              <option value="cta">CTA (Call to Action)</option>
              <option value="slideshow">Slideshow</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Cím</label>
            <input
              {...register('title')}
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Alcím</label>
            <textarea
              {...register('subtitle')}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
            />
          </div>

          {(sectionType === 'hero' || sectionType === 'cta') && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Kép URL</label>
                <input
                  {...register('image')}
                  type="url"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
                />
                {watch('image') && (
                  <img
                    src={watch('image')}
                    alt="Preview"
                    className="mt-2 w-full max-w-md rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Gomb szöveg</label>
                <input
                  {...register('buttonText')}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Gomb link</label>
                <input
                  {...register('buttonLink')}
                  type="url"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Tartalom (JSON)</label>
            <textarea
              {...register('content')}
              rows={8}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-sm"
              placeholder='{"text": "Tartalom..."}'
            />
          </div>
        </div>
      </Card>

      <Card padding="lg">
        <h2 className="text-xl font-bold mb-4">Beállítások</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Nyelv *</label>
            <select
              {...register('locale')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
            >
              <option value="hu">Magyar</option>
              <option value="en">English</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Sorrend</label>
            <input
              {...register('order', { valueAsNumber: true })}
              type="number"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              {...register('isActive')}
              type="checkbox"
              id="isActive"
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <label htmlFor="isActive" className="text-sm font-semibold text-gray-900">
              Aktív
            </label>
          </div>
        </div>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" isLoading={isLoading} size="lg">
          {section ? 'Frissítés' : 'Létrehozás'}
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

