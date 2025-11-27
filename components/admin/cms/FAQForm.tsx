'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const faqSchema = z.object({
  question: z.string().min(1, 'Kérdés megadása kötelező'),
  answer: z.string().min(1, 'Válasz megadása kötelező'),
  order: z.number().int().min(0),
  locale: z.enum(['hu', 'en']),
  isActive: z.boolean(),
});

type FAQFormData = z.infer<typeof faqSchema>;

interface FAQ {
  id: string;
  question: string;
  answer: string;
  order: number;
  locale: string;
  isActive: boolean;
}

interface FAQFormProps {
  locale: string;
  faq?: FAQ;
}

export function FAQForm({ locale, faq }: FAQFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FAQFormData>({
    resolver: zodResolver(faqSchema),
    defaultValues: faq
      ? {
          question: faq.question,
          answer: faq.answer,
          order: faq.order,
          locale: faq.locale as 'hu' | 'en',
          isActive: faq.isActive,
        }
      : {
          question: '',
          answer: '',
          order: 0,
          locale: 'hu',
          isActive: true,
        },
  });

  const onSubmit = async (data: FAQFormData) => {
    setIsLoading(true);
    try {
      const url = faq ? `/api/admin/cms/faq/${faq.id}` : '/api/admin/cms/faq';
      const method = faq ? 'PUT' : 'POST';

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

      toast.success(faq ? 'FAQ frissítve' : 'FAQ létrehozva');
      router.push(`/${locale}/admin/cms/faq`);
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
        <h2 className="text-xl font-bold mb-4">FAQ Információk</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Kérdés *</label>
            <input
              {...register('question')}
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
            />
            {errors.question && (
              <p className="text-red-500 text-sm mt-1">{errors.question.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Válasz *</label>
            <textarea
              {...register('answer')}
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
            />
            {errors.answer && (
              <p className="text-red-500 text-sm mt-1">{errors.answer.message}</p>
            )}
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
            <p className="text-xs text-gray-500 mt-1">
              Alacsonyabb szám = előrébb jelenik meg
            </p>
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
          {faq ? 'Frissítés' : 'Létrehozás'}
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

