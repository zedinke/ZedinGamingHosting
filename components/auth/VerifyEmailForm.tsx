'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loadTranslations, getNestedValue } from '@/lib/translations';
import toast from 'react-hot-toast';

interface VerifyEmailFormProps {
  locale: string;
  email?: string;
  token?: string;
}

export function VerifyEmailForm({ locale, email: propEmail, token: propToken }: VerifyEmailFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [translations, setTranslations] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const email = propEmail || searchParams.get('email') || '';
  const token = propToken || searchParams.get('token') || '';

  useEffect(() => {
    loadTranslations(locale, 'common').then(setTranslations);
    
    // Ha van token az URL-ben, automatikusan verifikáljuk
    if (token) {
      verifyEmail(token);
    }
  }, [token, locale]);

  const t = (key: string) => getNestedValue(translations, key) || key;

  const verifyEmail = async (verificationToken: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/auth/verify-email?token=${verificationToken}`, {
        method: 'GET',
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || t('common.error'));
        return;
      }

      setIsVerified(true);
      toast.success('Email cím sikeresen megerősítve!');
      
      setTimeout(() => {
        router.push(`/${locale}/login`);
      }, 2000);
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerification = async () => {
    if (!email) {
      toast.error('Email cím megadása szükséges');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, locale }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || t('common.error'));
        return;
      }

      toast.success('Verifikációs email újraküldve!');
    } catch (error) {
      toast.error(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerified) {
    return (
      <div className="text-center">
        <div className="text-green-600 text-5xl mb-4">✓</div>
        <p className="text-lg mb-4">Email cím sikeresen megerősítve!</p>
        <p className="text-gray-600">Átirányítás a bejelentkezési oldalra...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {email && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            Verifikációs email elküldve erre a címre: <strong>{email}</strong>
          </p>
        </div>
      )}

      <div className="text-center space-y-4">
        <p className="text-gray-600">
          Kérjük, ellenőrizd az email fiókodat és kattints a verifikációs linkre.
        </p>

        {email && (
          <button
            onClick={resendVerification}
            disabled={isLoading}
            className="text-primary-600 hover:text-primary-700 underline text-sm disabled:opacity-50"
          >
            {isLoading ? t('common.loading') : 'Email újraküldése'}
          </button>
        )}

        {token && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Verifikáció folyamatban...</p>
          </div>
        )}
      </div>
    </div>
  );
}

