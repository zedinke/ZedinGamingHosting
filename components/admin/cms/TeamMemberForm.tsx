'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const teamMemberSchema = z.object({
  name: z.string().min(1, 'Név megadása kötelező'),
  role: z.string().min(1, 'Pozíció megadása kötelező'),
  bio: z.string().optional(),
  avatar: z.string().url().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  twitter: z.string().url().optional().or(z.literal('')),
  linkedin: z.string().url().optional().or(z.literal('')),
  github: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean(),
  order: z.number().int().min(0),
});

type TeamMemberFormData = z.infer<typeof teamMemberSchema>;

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  avatar: string | null;
  email: string | null;
  socialLinks: any;
  isActive: boolean;
  order: number;
}

interface TeamMemberFormProps {
  locale: string;
  teamMember?: TeamMember;
}

export function TeamMemberForm({ locale, teamMember }: TeamMemberFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const socialLinks = teamMember?.socialLinks || {};

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<TeamMemberFormData>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: teamMember
      ? {
          name: teamMember.name,
          role: teamMember.role,
          bio: teamMember.bio || '',
          avatar: teamMember.avatar || '',
          email: teamMember.email || '',
          twitter: socialLinks.twitter || '',
          linkedin: socialLinks.linkedin || '',
          github: socialLinks.github || '',
          isActive: teamMember.isActive,
          order: teamMember.order,
        }
      : {
          name: '',
          role: '',
          bio: '',
          avatar: '',
          email: '',
          twitter: '',
          linkedin: '',
          github: '',
          isActive: true,
          order: 0,
        },
  });

  const onSubmit = async (data: TeamMemberFormData) => {
    setIsLoading(true);
    try {
      const socialLinks: any = {};
      if (data.twitter) socialLinks.twitter = data.twitter;
      if (data.linkedin) socialLinks.linkedin = data.linkedin;
      if (data.github) socialLinks.github = data.github;

      const payload = {
        name: data.name,
        role: data.role,
        bio: data.bio || null,
        avatar: data.avatar || null,
        email: data.email || null,
        socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : null,
        isActive: data.isActive,
        order: data.order,
      };

      const url = teamMember
        ? `/api/admin/cms/team/${teamMember.id}`
        : '/api/admin/cms/team';
      const method = teamMember ? 'PUT' : 'POST';

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

      toast.success(teamMember ? 'Csapat tag frissítve' : 'Csapat tag létrehozva');
      router.push(`/${locale}/admin/cms/team`);
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
            <label className="block text-sm font-semibold text-gray-900 mb-2">Név *</label>
            <input
              {...register('name')}
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Pozíció *</label>
            <input
              {...register('role')}
              type="text"
              placeholder="Pl: CEO, Fejlesztő"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
            />
            {errors.role && (
              <p className="text-red-500 text-sm mt-1">{errors.role.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Bio</label>
            <textarea
              {...register('bio')}
              rows={4}
              placeholder="Rövid bemutatkozás..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Avatar URL</label>
            <input
              {...register('avatar')}
              type="url"
              placeholder="https://example.com/avatar.jpg"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
            />
            {watch('avatar') && (
              <img
                src={watch('avatar')}
                alt="Avatar preview"
                className="mt-2 w-24 h-24 rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Email</label>
            <input
              {...register('email')}
              type="email"
              placeholder="email@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
            />
          </div>
        </div>
      </Card>

      <Card padding="lg">
        <h2 className="text-xl font-bold mb-4">Közösségi Média</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Twitter/X URL</label>
            <input
              {...register('twitter')}
              type="url"
              placeholder="https://twitter.com/username"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">LinkedIn URL</label>
            <input
              {...register('linkedin')}
              type="url"
              placeholder="https://linkedin.com/in/username"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">GitHub URL</label>
            <input
              {...register('github')}
              type="url"
              placeholder="https://github.com/username"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
            />
          </div>
        </div>
      </Card>

      <Card padding="lg">
        <h2 className="text-xl font-bold mb-4">Beállítások</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Sorrend</label>
            <input
              {...register('order', { valueAsNumber: true })}
              type="number"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              {...register('isActive')}
              type="checkbox"
              id="isActive"
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <label htmlFor="isActive" className="text-sm font-semibold text-gray-900">
              Aktív
            </label>
          </div>
        </div>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" isLoading={isLoading} size="lg">
          {teamMember ? 'Frissítés' : 'Létrehozás'}
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

