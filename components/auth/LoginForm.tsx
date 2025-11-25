'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { loadTranslations, getNestedValue } from '@/lib/translations';
import { useEffect } from 'react';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Érvénytelen email cím'),
  password: z.string().min(6, 'A jelszónak legalább 6 karakter hosszúnak kell lennie'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  locale: string;
}

export function LoginForm({ locale }: LoginFormProps) {
  const router = useRouter();
  const [translations, setTranslations] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadTranslations(locale, 'common').then(setTranslations);
  }, [locale]);

  const t = (key: string) => getNestedValue(translations, key) || key;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(t('common.success'));
        router.push(`/${locale}/dashboard`);
        router.refresh();
      }
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

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

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          {t('auth.password')}
        </label>
        <input
          {...register('password')}
          type="password"
          id="password"
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder={t('auth.password')}
        />
        {errors.password && (
          <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? t('common.loading') : t('auth.signIn')}
      </button>

      <div className="text-center">
        <a href={`/${locale}/forgot-password`} className="text-primary-600 hover:underline text-sm">
          {t('auth.forgotPassword')}
        </a>
      </div>
    </form>
  );
}

