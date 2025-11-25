'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { loadTranslations, getNestedValue } from '@/lib/translations';
import toast from 'react-hot-toast';

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'A jelszónak legalább 8 karakter hosszúnak kell lennie'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'A jelszavak nem egyeznek',
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordFormProps {
  locale: string;
  token: string;
}

export function ResetPasswordForm({ locale, token }: ResetPasswordFormProps) {
  const router = useRouter();
  const [translations, setTranslations] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    loadTranslations(locale, 'common').then(setTranslations);
    validateToken();
  }, [locale, token]);

  const t = (key: string) => getNestedValue(translations, key) || key;

  const validateToken = async () => {
    try {
      const response = await fetch(`/api/auth/validate-reset-token?token=${token}`);
      const result = await response.json();
      
      if (response.ok && result.valid) {
        setIsValid(true);
      } else {
        setIsValid(false);
        toast.error(result.error || 'Érvénytelen vagy lejárt token');
      }
    } catch (error) {
      setIsValid(false);
      toast.error(t('common.error'));
    } finally {
      setIsValidating(false);
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || t('common.error'));
        return;
      }

      toast.success('Jelszó sikeresen megváltoztatva!');
      router.push(`/${locale}/login`);
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="text-center">
        <p className="text-gray-600">{t('common.loading')}</p>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="text-center">
        <p className="text-red-600 mb-4">Érvénytelen vagy lejárt jelszó visszaállítási link.</p>
        <a
          href={`/${locale}/forgot-password`}
          className="text-primary-600 hover:underline"
        >
          Új link kérése
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Új jelszó
        </label>
        <input
          {...register('password')}
          type="password"
          id="password"
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Új jelszó"
        />
        {errors.password && (
          <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
          Jelszó megerősítése
        </label>
        <input
          {...register('confirmPassword')}
          type="password"
          id="confirmPassword"
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Jelszó megerősítése"
        />
        {errors.confirmPassword && (
          <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? t('common.loading') : 'Jelszó megváltoztatása'}
      </button>
    </form>
  );
}

