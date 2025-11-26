import { Navigation } from '@/components/Navigation';
import { getTranslations } from '@/lib/i18n';
import { requireAuth } from '@/lib/auth-helpers';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserSettings } from '@/components/settings/UserSettings';

export default async function SettingsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  await requireAuth();
  const session = await getServerSession(authOptions);

  const user = await prisma.user.findUnique({
    where: { id: (session?.user as any)?.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      twoFactorEnabled: true,
    },
  });

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation locale={locale} />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Beállítások</h1>
            <p className="text-gray-700">Fiók beállítások kezelése</p>
          </div>
          <UserSettings user={user} locale={locale} />
        </div>
      </main>
    </div>
  );
}

