'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const gameSchema = z.object({
  name: z.string().min(1, 'Név megadása kötelező'),
  slug: z.string().min(1, 'Slug megadása kötelező'),
  description: z.string().optional().or(z.literal('')),
  image: z.union([
    z.string().url('Érvényes URL szükséges'),
    z.literal(''),
  ]).optional(),
  categoryId: z.string().optional().or(z.literal('')),
  isActive: z.boolean(),
  order: z.number().int().min(0),
  locale: z.enum(['hu', 'en']),
});

type GameFormData = z.infer<typeof gameSchema>;

interface Game {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  categoryId: string | null;
  isActive: boolean;
  order: number;
  locale: string;
}

interface GameCategory {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

interface GameFormProps {
  locale: string;
  game?: Game;
  categories: GameCategory[];
}

export function GameForm({ locale, game, categories }: GameFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<GameFormData>({
    resolver: zodResolver(gameSchema),
    defaultValues: game
      ? {
          name: game.name,
          slug: game.slug,
          description: game.description || '',
          image: game.image || '',
          categoryId: game.categoryId || '',
          isActive: game.isActive,
          order: game.order,
          locale: game.locale as 'hu' | 'en',
        }
      : {
          name: '',
          slug: '',
          description: '',
          image: '',
          categoryId: '',
          isActive: true,
          order: 0,
          locale: 'hu',
        },
  });

  const onSubmit = async (data: GameFormData) => {
    setIsLoading(true);
    try {
      const payload = {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        image: data.image || null,
        categoryId: data.categoryId || null,
        isActive: data.isActive,
        order: data.order,
        locale: data.locale,
      };

      const url = game
        ? `/api/admin/cms/games/${game.id}`
        : '/api/admin/cms/games';
      const method = game ? 'PUT' : 'POST';

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

      toast.success(game ? 'Játék frissítve' : 'Játék létrehozva');
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
                if (!game) {
                  const slug = generateSlug(e.target.value);
                  // Set slug value manually
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
              placeholder="pl: ark-survival-evolved"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            {errors.slug && (
              <p className="text-red-500 text-sm mt-1">{errors.slug.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              URL-barát azonosító (automatikusan generálódik a névből)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Leírás</label>
            <textarea
              {...register('description')}
              rows={4}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Kép URL</label>
            <input
              {...register('image')}
              type="url"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
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
            <label className="block text-sm font-medium mb-2">Kategória</label>
            <select
              {...register('categoryId')}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Nincs kategória</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
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
          {game ? 'Frissítés' : 'Létrehozás'}
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

