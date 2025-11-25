'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { X, Plus } from 'lucide-react';

const pricingPlanSchema = z.object({
  name: z.string().min(1, 'Név megadása kötelező'),
  description: z.string().optional(),
  price: z.number().min(0, 'Az ár nem lehet negatív'),
  currency: z.string().min(1, 'Pénznem megadása kötelező'),
  interval: z.enum(['month', 'year']),
  stripePriceId: z.string().optional(),
  features: z.array(z.object({ value: z.string().min(1) })),
  isActive: z.boolean(),
  order: z.number().int().min(0),
});

type PricingPlanFormData = z.infer<typeof pricingPlanSchema>;

interface PricingPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  interval: string;
  stripePriceId: string | null;
  features: any;
  isActive: boolean;
  order: number;
}

interface PricingPlanFormProps {
  locale: string;
  plan?: PricingPlan;
}

export function PricingPlanForm({ locale, plan }: PricingPlanFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const featuresArray = plan?.features && Array.isArray(plan.features)
    ? plan.features.map((f: string) => ({ value: f }))
    : [{ value: '' }];

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<PricingPlanFormData>({
    resolver: zodResolver(pricingPlanSchema),
    defaultValues: plan
      ? {
          name: plan.name,
          description: plan.description || '',
          price: plan.price,
          currency: plan.currency,
          interval: plan.interval as 'month' | 'year',
          stripePriceId: plan.stripePriceId || '',
          features: featuresArray,
          isActive: plan.isActive,
          order: plan.order,
        }
      : {
          name: '',
          description: '',
          price: 0,
          currency: 'HUF',
          interval: 'month',
          stripePriceId: '',
          features: [{ value: '' }],
          isActive: true,
          order: 0,
        },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'features',
  });

  const onSubmit = async (data: PricingPlanFormData) => {
    setIsLoading(true);
    try {
      const features = data.features
        .map((f) => f.value.trim())
        .filter((f) => f.length > 0);

      const payload = {
        name: data.name,
        description: data.description || null,
        price: data.price,
        currency: data.currency,
        interval: data.interval,
        stripePriceId: data.stripePriceId || null,
        features: features,
        isActive: data.isActive,
        order: data.order,
      };

      const url = plan
        ? `/api/admin/cms/pricing/${plan.id}`
        : '/api/admin/cms/pricing';
      const method = plan ? 'PUT' : 'POST';

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

      toast.success(plan ? 'Árazási csomag frissítve' : 'Árazási csomag létrehozva');
      router.push(`/${locale}/admin/cms/pricing`);
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
            <label className="block text-sm font-medium mb-2">Név *</label>
            <input
              {...register('name')}
              type="text"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
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

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Ár *</label>
              <input
                {...register('price', { valueAsNumber: true })}
                type="number"
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              {errors.price && (
                <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Pénznem *</label>
              <select
                {...register('currency')}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="HUF">HUF</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Időtartam *</label>
              <select
                {...register('interval')}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="month">Hónap</option>
                <option value="year">Év</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Stripe Price ID</label>
            <input
              {...register('stripePriceId')}
              type="text"
              placeholder="price_xxx"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </Card>

      <Card padding="lg">
        <h2 className="text-xl font-bold mb-4">Funkciók</h2>
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <input
                {...register(`features.${index}.value`)}
                type="text"
                placeholder="Funkció leírása..."
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => append({ value: '' })}
            className="flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Funkció hozzáadása
          </button>
        </div>
      </Card>

      <Card padding="lg">
        <h2 className="text-xl font-bold mb-4">Beállítások</h2>
        <div className="space-y-4">
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
          {plan ? 'Frissítés' : 'Létrehozás'}
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

