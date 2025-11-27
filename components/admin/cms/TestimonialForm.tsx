'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Star } from 'lucide-react';

const testimonialSchema = z.object({
  name: z.string().min(1, 'Név megadása kötelező'),
  role: z.string().optional(),
  content: z.string().min(1, 'Tartalom megadása kötelező'),
  avatar: z.string().url().optional().or(z.literal('')),
  rating: z.number().min(1).max(5),
  locale: z.enum(['hu', 'en']),
  isActive: z.boolean(),
  order: z.number().int().min(0),
});

type TestimonialFormData = z.infer<typeof testimonialSchema>;

interface Testimonial {
  id: string;
  name: string;
  role: string | null;
  content: string;
  avatar: string | null;
  rating: number;
  locale: string;
  isActive: boolean;
  order: number;
}

interface TestimonialFormProps {
  locale: string;
  testimonial?: Testimonial;
}

export function TestimonialForm({ locale, testimonial }: TestimonialFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TestimonialFormData>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: testimonial
      ? {
          name: testimonial.name,
          role: testimonial.role || '',
          content: testimonial.content,
          avatar: testimonial.avatar || '',
          rating: testimonial.rating,
          locale: testimonial.locale as 'hu' | 'en',
          isActive: testimonial.isActive,
          order: testimonial.order,
        }
      : {
          name: '',
          role: '',
          content: '',
          avatar: '',
          rating: 5,
          locale: 'hu',
          isActive: true,
          order: 0,
        },
  });

  const rating = watch('rating');
  const isActive = watch('isActive');

  const onSubmit = async (data: TestimonialFormData) => {
    setIsLoading(true);
    try {
      const url = testimonial
        ? `/api/admin/cms/testimonials/${testimonial.id}`
        : '/api/admin/cms/testimonials';
      const method = testimonial ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Hiba történt');
        return;
      }

      toast.success(testimonial ? 'Vélemény frissítve' : 'Vélemény létrehozva');
      router.push(`/${locale}/admin/cms/testimonials`);
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
            <label className="block text-sm font-semibold text-gray-900 mb-2">Név *</label>
            <input
              {...register('name')}
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Pozíció</label>
            <input
              {...register('role')}
              type="text"
              placeholder="Pl: CEO, Ügyfél"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Tartalom *</label>
            <textarea
              {...register('content')}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
            />
            {errors.content && (
              <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Avatar URL</label>
            <input
              {...register('avatar')}
              type="url"
              placeholder="https://example.com/avatar.jpg"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
            />
            {watch('avatar') && (
              <img
                src={watch('avatar')}
                alt="Avatar preview"
                className="mt-2 w-24 h-24 rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Értékelés *</label>
            <div className="flex items-center gap-2">
              {Array.from({ length: 5 }).map((_, i) => {
                const starValue = i + 1;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setValue('rating', starValue)}
                    onMouseEnter={() => setHoverRating(starValue)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        starValue <= (hoverRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                );
              })}
              <span className="ml-2 text-gray-600">{rating} / 5</span>
            </div>
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
          {testimonial ? 'Frissítés' : 'Létrehozás'}
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

