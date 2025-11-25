'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const gameCategorySchema = z.object({
  name: z.string().min(1, 'Név megadása kötelező'),
  slug: z.string().min(1, 'Slug megadása kötelező'),
  description: z.string().optional().or(z.literal('')),
  icon: z.string().optional().or(z.literal('')),
  color: z.union([
    z.string().regex(/^#[0-9A-F]{6}$/i, 'Érvényes hex szín szükséges (pl: #4F46E5)'),
    z.literal(''),
  ]).optional(),
  isActive: z.boolean(),
  order: z.number().int().min(0),
  locale: z.enum(['hu', 'en']),
});

type GameCategoryFormData = z.infer<typeof gameCategorySchema>;

interface GameCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  isActive: boolean;
  order: number;
  locale: string;
}

interface GameCategoryFormProps {
  locale: string;
  category?: GameCategory;
}

export function GameCategoryForm({ locale, category }: GameCategoryFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<GameCategoryFormData>({
    resolver: zodResolver(gameCategorySchema),
    defaultValues: category
      ? {
          name: category.name,
          slug: category.slug,
          description: category.description || '',
          icon: category.icon || '',
          color: category.color || '#4F46E5',
          isActive: category.isActive,
          order: category.order,
          locale: category.locale as 'hu' | 'en',
        }
      : {
          name: '',
          slug: '',
          description: '',
          icon: '',
          color: '#4F46E5',
          isActive: true,
          order: 0,
          locale: 'hu',
        },
  });

  const onSubmit = async (data: GameCategoryFormData) => {
    setIsLoading(true);
    try {
      const payload = {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        icon: data.icon || null,
        color: data.color || null,
        isActive: data.isActive,
        order: data.order,
        locale: data.locale,
      };

      const url = category
        ? `/api/admin/cms/games/categories/${category.id}`
        : '/api/admin/cms/games/categories';
      const method = category ? 'PUT' : 'POST';

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

      toast.success(category ? 'Kategória frissítve' : 'Kategória létrehozva');
      router.push(`/${locale}/admin/cms/games`);
      router.refresh();
    } catch (error) {
      toast.error('Hiba történt');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card padding="lg">
        <h2 className="text-xl font-bold mb-4">Alapinformációk</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Név *</label>
            <input
              {...register('name')}
              type="text"
              onChange={(e) => {
                register('name').onChange(e);
                if (!category) {
                  const slug = generateSlug(e.target.value);
                  const slugInput = document.querySelector('input[name="slug"]') as HTMLInputElement;
                  if (slugInput && !slugInput.value) {
                    slugInput.value = slug;
                  }
                }
              }}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Slug *</label>
            <input
              {...register('slug')}
              type="text"
              placeholder="pl: survival-games"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            {errors.slug && (
              <p className="text-red-500 text-sm mt-1">{errors.slug.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Leírás</label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Ikon (emoji vagy unicode)</label>
            <input
              {...register('icon')}
              type="text"
              placeholder="🎮 vagy 🏹"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Szín (hex)</label>
            <div className="flex gap-4 items-center">
              <input
                type="color"
                {...register('color')}
                className="w-16 h-16 rounded border"
              />
              <input
                {...register('color')}
                type="text"
                placeholder="#4F46E5"
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            {errors.color && (
              <p className="text-red-500 text-sm mt-1">{errors.color.message}</p>
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
          {category ? 'Frissítés' : 'Létrehozás'}
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

