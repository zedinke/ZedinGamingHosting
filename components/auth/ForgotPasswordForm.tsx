'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { loadTranslations, getNestedValue } from '@/lib/translations';
import toast from 'react-hot-toast';
import Link from 'next/link';

const forgotPasswordSchema = z.object({
  email: z.string().email('Érvénytelen email cím'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordFormProps {
  locale: string;
}

export function ForgotPasswordForm({ locale }: ForgotPasswordFormProps) {
  const [translations, setTranslations] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    loadTranslations(locale, 'common').then(setTranslations);
  }, [locale]);

  const t = (key: string) => getNestedValue(translations, key) || key;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          locale,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || t('common.error'));
        return;
      }

      setEmailSent(true);
      toast.success('Jelszó visszaállítási email elküldve!');
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">
            Ha ez az email cím regisztrálva van, akkor elküldtük a jelszó visszaállítási linket.
          </p>
        </div>
        <div className="text-center">
          <Link
            href={`/${locale}/login`}
            className="text-primary-600 hover:underline"
          >
            Vissza a bejelentkezéshez
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          {t('auth.email')}
        </label>
        <input
          {...register('email')}
          type="email"
          id="email"
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder={t('auth.email')}
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? t('common.loading') : 'Jelszó visszaállítási link küldése'}
      </button>

      <div className="text-center">
        <Link
          href={`/${locale}/login`}
          className="text-primary-600 hover:underline text-sm"
        >
          Vissza a bejelentkezéshez
        </Link>
      </div>
    </form>
  );
}

