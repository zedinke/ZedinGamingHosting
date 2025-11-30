'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { loadTranslations, getNestedValue } from '@/lib/translations';
import toast from 'react-hot-toast';
import Link from 'next/link';

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
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

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

  const handleOAuthSignIn = async (provider: 'google' | 'discord') => {
    setOauthLoading(provider);
    try {
      await signIn(provider, {
        callbackUrl: `/${locale}/dashboard`,
        redirect: true,
      });
    } catch (error) {
      toast.error(t('common.error'));
      setOauthLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* OAuth Buttons */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => handleOAuthSignIn('google')}
          disabled={isLoading || oauthLoading !== null}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {oauthLoading === 'google' ? t('common.loading') : t('auth.signInWithGoogle')}
        </button>

        <button
          type="button"
          onClick={() => handleOAuthSignIn('discord')}
          disabled={isLoading || oauthLoading !== null}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#5865F2] text-white rounded-lg hover:bg-[#4752C4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
          </svg>
          {oauthLoading === 'discord' ? t('common.loading') : t('auth.signInWithDiscord')}
        </button>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-dark-700"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-dark-800 text-gray-400">{t('auth.orContinueWith')}</span>
        </div>
      </div>

      {/* Email/Password Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
            {t('auth.email')}
          </label>
          <input
            {...register('email')}
            type="email"
            id="email"
            className="w-full px-4 py-3 bg-dark-700/50 border border-dark-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            placeholder={t('auth.email')}
            disabled={isLoading || oauthLoading !== null}
          />
          {errors.email && (
            <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
              {t('auth.password')}
            </label>
            <Link
              href={`/${locale}/forgot-password`}
              className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
            >
              {t('auth.forgotPassword')}
            </Link>
          </div>
          <input
            {...register('password')}
            type="password"
            id="password"
            className="w-full px-4 py-3 bg-dark-700/50 border border-dark-600 rounded-lg text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            placeholder={t('auth.password')}
            disabled={isLoading || oauthLoading !== null}
          />
          {errors.password && (
            <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || oauthLoading !== null}
          className="w-full btn-primary py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? t('common.loading') : t('auth.signIn')}
        </button>
      </form>

      {/* Register Link */}
      <div className="text-center text-sm">
        <span className="text-gray-400">{t('auth.noAccount')} </span>
        <Link
          href={`/${locale}/register`}
          className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
        >
          {t('auth.signUp')}
        </Link>
      </div>
    </div>
  );
}

