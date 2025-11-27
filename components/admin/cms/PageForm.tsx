'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const pageSchema = z.object({
  slug: z.string().min(1, 'Slug megadása kötelező'),
  title: z.string().min(1, 'Cím megadása kötelező'),
  content: z.string().min(1, 'Tartalom megadása kötelező'),
  isPublished: z.boolean(),
  locale: z.enum(['hu', 'en']),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
});

type PageFormData = z.infer<typeof pageSchema>;

interface Page {
  id: string;
  slug: string;
  title: string;
  content: any;
  isPublished: boolean;
  locale: string;
  seoTitle: string | null;
  seoDescription: string | null;
}

interface PageFormProps {
  locale: string;
  page?: Page;
}

export function PageForm({ locale, page }: PageFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Convert JSON content to string for editing
  const getContentString = (content: any): string => {
    if (typeof content === 'string') return content;
    if (typeof content === 'object') {
      // Try to extract text from JSON structure
      if (content.blocks && Array.isArray(content.blocks)) {
        return content.blocks.map((block: any) => block.text || '').join('\n\n');
      }
      return JSON.stringify(content, null, 2);
    }
    return '';
  };

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PageFormData>({
    resolver: zodResolver(pageSchema),
    defaultValues: page
      ? {
          slug: page.slug,
          title: page.title,
          content: getContentString(page.content),
          isPublished: page.isPublished,
          locale: page.locale as 'hu' | 'en',
          seoTitle: page.seoTitle || '',
          seoDescription: page.seoDescription || '',
        }
      : {
          slug: '',
          title: '',
          content: '',
          isPublished: false,
          locale: 'hu',
          seoTitle: '',
          seoDescription: '',
        },
  });

  const onSubmit = async (data: PageFormData) => {
    setIsLoading(true);
    try {
      // Convert content string to JSON structure
      const contentJson = {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: data.content,
              },
            ],
          },
        ],
      };

      const payload = {
        slug: data.slug,
        title: data.title,
        content: contentJson,
        isPublished: data.isPublished,
        locale: data.locale,
        seoTitle: data.seoTitle || null,
        seoDescription: data.seoDescription || null,
      };

      const url = page
        ? `/api/admin/cms/pages/${page.id}`
        : '/api/admin/cms/pages';
      const method = page ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Hiba történt');
        return;
      }

      toast.success(page ? 'Oldal frissítve' : 'Oldal létrehozva');
      router.push(`/${locale}/admin/cms/pages`);
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
        <h2 className="text-xl font-bold mb-4">Alapinformációk</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Slug *</label>
            <input
              {...register('slug')}
              type="text"
              placeholder="pl: about-us"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
            />
            {errors.slug && (
              <p className="text-red-500 text-sm mt-1">{errors.slug.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              URL-barát azonosító (pl: about-us)
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Cím *</label>
            <input
              {...register('title')}
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Tartalom *</label>
            <textarea
              {...register('content')}
              rows={12}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-sm"
              placeholder="Oldal tartalma..."
            />
            {errors.content && (
              <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Jelenleg egyszerű szöveg formátum támogatott
            </p>
          </div>
        </div>
      </Card>

      <Card padding="lg">
        <h2 className="text-xl font-bold mb-4">SEO Beállítások</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">SEO Cím</label>
            <input
              {...register('seoTitle')}
              type="text"
              placeholder="Ha üres, az oldal címe lesz használva"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">SEO Leírás</label>
            <textarea
              {...register('seoDescription')}
              rows={3}
              placeholder="Rövid leírás a keresőmotorok számára"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
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

          <div className="flex items-center gap-2">
            <input
              {...register('isPublished')}
              type="checkbox"
              id="isPublished"
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <label htmlFor="isPublished" className="text-sm font-semibold text-gray-900">
              Közzétéve
            </label>
          </div>
        </div>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" isLoading={isLoading} size="lg">
          {page ? 'Frissítés' : 'Létrehozás'}
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

