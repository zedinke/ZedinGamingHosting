'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FileText, MapPin, Mail, Phone, Globe } from 'lucide-react';

const billingInfoSchema = z.object({
  billingName: z.string().min(1, 'Név megadása kötelező'),
  email: z.string().email('Érvényes email cím megadása kötelező'),
  phone: z.string().min(1, 'Telefonszám megadása kötelező'),
  country: z.string().min(1, 'Ország megadása kötelező'),
  postalCode: z.string().min(1, 'Irányítószám megadása kötelező'),
  city: z.string().min(1, 'Város megadása kötelező'),
  street: z.string().min(1, 'Utca és házszám megadása kötelező'),
  billingAddress: z.string().optional(), // Opcionális, automatikusan generálható
});

export type BillingInfoFormData = z.infer<typeof billingInfoSchema>;

interface BillingInfoFormProps {
  initialData?: Partial<BillingInfoFormData>;
  onSubmit: (data: BillingInfoFormData) => void;
  isLoading?: boolean;
  showSubmitButton?: boolean;
}

export function BillingInfoForm({ initialData, onSubmit, isLoading, showSubmitButton = true }: BillingInfoFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BillingInfoFormData>({
    resolver: zodResolver(billingInfoSchema),
    defaultValues: initialData || {
      billingName: '',
      email: '',
      phone: '',
      country: 'Magyarország',
      postalCode: '',
      city: '',
      street: '',
      billingAddress: '',
    },
  });

  // Automatikus cím generálás
  const postalCode = watch('postalCode');
  const city = watch('city');
  const street = watch('street');
  const country = watch('country');

  useEffect(() => {
    if (postalCode && city && street && country) {
      const fullAddress = `${street}, ${city} ${postalCode}, ${country}`;
      setValue('billingAddress', fullAddress);
    }
  }, [postalCode, city, street, country, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card padding="lg" className="bg-white">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2 text-gray-900">
          <FileText className="w-6 h-6" />
          Számlázási Adatok
        </h2>
        <p className="text-base text-gray-700 mb-6 font-medium">
          Kérjük, töltsd ki a számlázási adatokat. Ezeket a számla kiállításához használjuk.
        </p>

        <div className="space-y-5">
          {/* Név */}
          <div>
            <label htmlFor="billingName" className="block text-sm font-bold text-gray-900 mb-2">
              Teljes név *
            </label>
            <input
              {...register('billingName')}
              type="text"
              id="billingName"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white text-base font-medium"
              placeholder="Pl: Kovács János"
            />
            {errors.billingName && (
              <p className="text-red-600 text-sm mt-1 font-semibold">{errors.billingName.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-gray-900 mb-2">
              <Mail className="w-4 h-4 inline mr-1" />
              Email cím *
            </label>
            <input
              {...register('email')}
              type="email"
              id="email"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white text-base font-medium"
              placeholder="pl: kovacs.janos@example.com"
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1 font-semibold">{errors.email.message}</p>
            )}
          </div>

          {/* Telefonszám */}
          <div>
            <label htmlFor="phone" className="block text-sm font-bold text-gray-900 mb-2">
              <Phone className="w-4 h-4 inline mr-1" />
              Telefonszám *
            </label>
            <input
              {...register('phone')}
              type="tel"
              id="phone"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white text-base font-medium"
              placeholder="+36 20 123 4567"
            />
            {errors.phone && (
              <p className="text-red-600 text-sm mt-1 font-semibold">{errors.phone.message}</p>
            )}
          </div>

          {/* Ország */}
          <div>
            <label htmlFor="country" className="block text-sm font-bold text-gray-900 mb-2">
              <Globe className="w-4 h-4 inline mr-1" />
              Ország *
            </label>
            <input
              {...register('country')}
              type="text"
              id="country"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white text-base font-medium"
              placeholder="Pl: Magyarország"
            />
            {errors.country && (
              <p className="text-red-600 text-sm mt-1 font-semibold">{errors.country.message}</p>
            )}
          </div>

          {/* Irányítószám és Város */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="postalCode" className="block text-sm font-bold text-gray-900 mb-2">
                Irányítószám *
              </label>
              <input
                {...register('postalCode')}
                type="text"
                id="postalCode"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white text-base font-medium"
                placeholder="1234"
              />
              {errors.postalCode && (
                <p className="text-red-600 text-sm mt-1 font-semibold">{errors.postalCode.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-bold text-gray-900 mb-2">
                Város *
              </label>
              <input
                {...register('city')}
                type="text"
                id="city"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white text-base font-medium"
                placeholder="Budapest"
              />
              {errors.city && (
                <p className="text-red-600 text-sm mt-1 font-semibold">{errors.city.message}</p>
              )}
            </div>
          </div>

          {/* Utca és házszám */}
          <div>
            <label htmlFor="street" className="block text-sm font-bold text-gray-900 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Utca és házszám *
            </label>
            <input
              {...register('street')}
              type="text"
              id="street"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white text-base font-medium"
              placeholder="Pl: Fő utca 123"
            />
            {errors.street && (
              <p className="text-red-600 text-sm mt-1 font-semibold">{errors.street.message}</p>
            )}
          </div>

          {/* Teljes cím (opcionális, automatikusan generálható) */}
          <div>
            <label htmlFor="billingAddress" className="block text-sm font-bold text-gray-900 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Teljes cím (opcionális)
            </label>
            <textarea
              {...register('billingAddress')}
              id="billingAddress"
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500 text-base font-medium"
              placeholder="Teljes cím (automatikusan generálható a fenti adatokból)"
            />
            {errors.billingAddress && (
              <p className="text-red-600 text-sm mt-1 font-semibold">{errors.billingAddress.message}</p>
            )}
          </div>
        </div>

        {showSubmitButton && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <Button
              type="submit"
              size="lg"
              isLoading={isLoading}
              className="w-full"
            >
              {isLoading ? 'Mentés...' : 'Számlázási Adatok Mentése'}
            </Button>
          </div>
        )}
      </Card>
    </form>
  );
}

