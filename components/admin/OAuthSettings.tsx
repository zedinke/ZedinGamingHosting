'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface OAuthSettingsProps {
  locale: string;
}

export function OAuthSettings({ locale }: OAuthSettingsProps) {
  const [enabledProviders, setEnabledProviders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings/oauth');
      if (response.ok) {
        const data = await response.json();
        setEnabledProviders(data.enabledProviders || []);
      }
    } catch (error) {
      console.error('Error loading OAuth settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProviderToggle = async (provider: string) => {
    const newEnabledProviders = enabledProviders.includes(provider)
      ? enabledProviders.filter((p) => p !== provider)
      : [...enabledProviders, provider];

    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/settings/oauth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabledProviders: newEnabledProviders,
        }),
      });

      if (response.ok) {
        setEnabledProviders(newEnabledProviders);
        toast.success('OAuth beállítások mentve');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Hiba történt a mentés során');
      }
    } catch (error) {
      console.error('Error saving OAuth settings:', error);
      toast.error('Hiba történt a mentés során');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-gray-600">Betöltés...</div>;
  }

  const providers = [
    {
      id: 'google',
      name: 'Google',
      description: 'Bejelentkezés Google fiókkal',
      icon: (
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
      ),
    },
    {
      id: 'discord',
      name: 'Discord',
      description: 'Bejelentkezés Discord fiókkal',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
      ),
    },
    {
      id: 'credentials',
      name: 'Email/Jelszó',
      description: 'Hagyományos email és jelszó bejelentkezés',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Bejelentkezési Módok</h3>
        <p className="text-sm text-gray-600 mb-4">
          Válaszd ki, hogy mely bejelentkezési módok legyenek elérhetőek a felhasználók számára.
          Több mód is kiválasztható egyszerre.
        </p>
      </div>

      <div className="space-y-3">
        {providers.map((provider) => {
          const isEnabled = enabledProviders.includes(provider.id);
          return (
            <div
              key={provider.id}
              className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                isEnabled
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`${isEnabled ? 'text-primary-600' : 'text-gray-400'}`}>
                  {provider.icon}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{provider.name}</div>
                  <div className="text-sm text-gray-600">{provider.description}</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={() => handleProviderToggle(provider.id)}
                  disabled={isSaving}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Megjegyzés:</strong> Az OAuth provider-ek (Google, Discord) működéséhez szükséges,
          hogy a megfelelő környezeti változók (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
          DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET) be legyenek állítva a .env fájlban.
        </p>
      </div>
    </div>
  );
}

