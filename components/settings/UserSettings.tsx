'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';

const profileSchema = z.object({
  name: z.string().min(2, 'A névnek legalább 2 karakter hosszúnak kell lennie'),
  email: z.string().email('Érvénytelen email cím'),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Jelenlegi jelszó megadása kötelező'),
    newPassword: z.string().min(8, 'Az új jelszónak legalább 8 karakter hosszúnak kell lennie'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'A jelszavak nem egyeznek',
    path: ['confirmPassword'],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

interface UserSettingsProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    twoFactorEnabled: boolean;
  };
  locale: string;
}

export function UserSettings({ user, locale }: UserSettingsProps) {
  const { update: updateSession } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name || '',
      email: user.email,
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const handleProfileUpdate = async (data: ProfileFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/user/profile`, {
        method: 'PUT',
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

      toast.success('Profil sikeresen frissítve');
      await updateSession();
    } catch (error) {
      toast.error('Hiba történt');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = async (data: PasswordFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/user/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Hiba történt');
        return;
      }

      toast.success('Jelszó sikeresen megváltoztatva');
      resetPassword();
    } catch (error) {
      toast.error('Hiba történt');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profil beállítások */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Profil Információk</h2>
        <form onSubmit={handleSubmitProfile(handleProfileUpdate)} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Név
            </label>
            <input
              {...registerProfile('name')}
              type="text"
              id="name"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            {profileErrors.name && (
              <p className="text-red-500 text-sm mt-1">{profileErrors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              {...registerProfile('email')}
              type="email"
              id="email"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            {profileErrors.email && (
              <p className="text-red-500 text-sm mt-1">{profileErrors.email.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {isLoading ? 'Mentés...' : 'Mentés'}
          </button>
        </form>
      </div>

      {/* Jelszó változtatás */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Jelszó Változtatása</h2>
        <form onSubmit={handleSubmitPassword(handlePasswordUpdate)} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium mb-1">
              Jelenlegi jelszó
            </label>
            <input
              {...registerPassword('currentPassword')}
              type="password"
              id="currentPassword"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            {passwordErrors.currentPassword && (
              <p className="text-red-500 text-sm mt-1">
                {passwordErrors.currentPassword.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium mb-1">
              Új jelszó
            </label>
            <input
              {...registerPassword('newPassword')}
              type="password"
              id="newPassword"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            {passwordErrors.newPassword && (
              <p className="text-red-500 text-sm mt-1">{passwordErrors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
              Új jelszó megerősítése
            </label>
            <input
              {...registerPassword('confirmPassword')}
              type="password"
              id="confirmPassword"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
            />
            {passwordErrors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">
                {passwordErrors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {isLoading ? 'Mentés...' : 'Jelszó megváltoztatása'}
          </button>
        </form>
      </div>
    </div>
  );
}

