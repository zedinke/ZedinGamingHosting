'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FileText, Building2, MapPin, Hash } from 'lucide-react';

const billingInfoSchema = z.object({
  billingName: z.string().min(1, 'Számlázási név megadása kötelező'),
  billingAddress: z.string().min(1, 'Számlázási cím megadása kötelező'),
  billingTaxNumber: z.string().optional(),
  companyName: z.string().optional(),
  companyTaxNumber: z.string().optional(),
  companyAddress: z.string().optional(),
  companyVatNumber: z.string().optional(),
});

export type BillingInfoFormData = z.infer<typeof billingInfoSchema>;

interface BillingInfoFormProps {
  initialData?: Partial<BillingInfoFormData>;
  onSubmit: (data: BillingInfoFormData) => void;
  isLoading?: boolean;
  showSubmitButton?: boolean;
}

export function BillingInfoForm({ initialData, onSubmit, isLoading, showSubmitButton = true }: BillingInfoFormProps) {
  const [isCompany, setIsCompany] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<BillingInfoFormData>({
    resolver: zodResolver(billingInfoSchema),
    defaultValues: initialData || {
      billingName: '',
      billingAddress: '',
      billingTaxNumber: '',
      companyName: '',
      companyTaxNumber: '',
      companyAddress: '',
      companyVatNumber: '',
    },
  });

  const companyName = watch('companyName');

  useEffect(() => {
    setIsCompany(!!companyName);
  }, [companyName]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card padding="lg">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Számlázási Adatok
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Kérjük, töltsd ki a számlázási adatokat. Ezeket a számla kiállításához használjuk.
        </p>

        <div className="space-y-4">
          {/* Számlázási név */}
          <div>
            <label htmlFor="billingName" className="block text-sm font-semibold text-gray-900 mb-1">
              Számlázási név *
            </label>
            <input
              {...register('billingName')}
              type="text"
              id="billingName"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
              placeholder="Teljes név vagy cégnév"
            />
            {errors.billingName && (
              <p className="text-red-500 text-sm mt-1">{errors.billingName.message}</p>
            )}
          </div>

          {/* Számlázási cím */}
          <div>
            <label htmlFor="billingAddress" className="block text-sm font-semibold text-gray-900 mb-1">
              <MapPin className="w-4 h-4 inline mr-1" />
              Számlázási cím *
            </label>
            <textarea
              {...register('billingAddress')}
              id="billingAddress"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
              placeholder="Utca, házszám, város, irányítószám"
            />
            {errors.billingAddress && (
              <p className="text-red-500 text-sm mt-1">{errors.billingAddress.message}</p>
            )}
          </div>

          {/* Adószám (opcionális) */}
          <div>
            <label htmlFor="billingTaxNumber" className="block text-sm font-semibold text-gray-900 mb-1">
              <Hash className="w-4 h-4 inline mr-1" />
              Adószám (opcionális)
            </label>
            <input
              {...register('billingTaxNumber')}
              type="text"
              id="billingTaxNumber"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
              placeholder="12345678-1-23"
            />
            {errors.billingTaxNumber && (
              <p className="text-red-500 text-sm mt-1">{errors.billingTaxNumber.message}</p>
            )}
          </div>

          {/* Cég adatok (opcionális) */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="isCompany"
                checked={isCompany}
                onChange={(e) => setIsCompany(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="isCompany" className="ml-2 text-sm font-semibold text-gray-900">
                Cégként számlázás
              </label>
            </div>

            {isCompany && (
              <div className="space-y-4 pl-6 border-l-2 border-primary-200">
                <div>
                  <label htmlFor="companyName" className="block text-sm font-semibold text-gray-900 mb-1">
                    <Building2 className="w-4 h-4 inline mr-1" />
                    Cégnév
                  </label>
                  <input
                    {...register('companyName')}
                    type="text"
                    id="companyName"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                    placeholder="Cégnév"
                  />
                  {errors.companyName && (
                    <p className="text-red-500 text-sm mt-1">{errors.companyName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="companyAddress" className="block text-sm font-semibold text-gray-900 mb-1">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Cég címe
                  </label>
                  <textarea
                    {...register('companyAddress')}
                    id="companyAddress"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
                    placeholder="Cég címe"
                  />
                  {errors.companyAddress && (
                    <p className="text-red-500 text-sm mt-1">{errors.companyAddress.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="companyTaxNumber" className="block text-sm font-semibold text-gray-900 mb-1">
                    <Hash className="w-4 h-4 inline mr-1" />
                    Cég adószáma
                  </label>
                  <input
                    {...register('companyTaxNumber')}
                    type="text"
                    id="companyTaxNumber"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                    placeholder="12345678-1-23"
                  />
                  {errors.companyTaxNumber && (
                    <p className="text-red-500 text-sm mt-1">{errors.companyTaxNumber.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="companyVatNumber" className="block text-sm font-semibold text-gray-900 mb-1">
                    <Hash className="w-4 h-4 inline mr-1" />
                    ÁFA szám (EU-n kívüli cégek esetén)
                  </label>
                  <input
                    {...register('companyVatNumber')}
                    type="text"
                    id="companyVatNumber"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white"
                    placeholder="HU12345678"
                  />
                  {errors.companyVatNumber && (
                    <p className="text-red-500 text-sm mt-1">{errors.companyVatNumber.message}</p>
                  )}
                </div>
              </div>
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

