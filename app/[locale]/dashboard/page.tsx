import { Navigation } from '@/components/Navigation';
import { getTranslations } from '@/lib/i18n';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { StatCard } from '@/components/dashboard/StatCard';
import { QuickActionCard } from '@/components/dashboard/QuickActionCard';
import { ServerListCard } from '@/components/dashboard/ServerListCard';
import { Server, CreditCard, Headphones, TrendingUp } from 'lucide-react';

export default async function DashboardPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect(`/${locale}/login`);
  }

  const t = getTranslations(locale, 'common');

  // Felhasználó szervereinek lekérése
  const servers = await prisma.server.findMany({
    where: { userId: (session.user as any).id },
    orderBy: { createdAt: 'desc' },
  });

  // Aktív előfizetések
  const subscriptions = await prisma.subscription.findMany({
    where: {
      userId: (session.user as any).id,
      status: 'ACTIVE',
    },
    include: {
      server: true,
    },
  });

  const onlineServers = servers.filter(s => s.status === 'ONLINE').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation locale={locale} />
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900">
            {t('dashboard.title')}
          </h1>
          <p className="text-gray-600 text-lg">
            Üdvözöljük, <span className="font-semibold text-gray-900">{session.user?.name || session.user?.email}</span>!
          </p>
        </div>

        {/* Statisztikák */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Szervereim"
            value={servers.length}
            icon={Server}
            color="primary"
          />
          <StatCard
            title="Aktív Előfizetések"
            value={subscriptions.length}
            icon={CreditCard}
            color="info"
          />
          <StatCard
            title="Online Szerverek"
            value={onlineServers}
            icon={TrendingUp}
            color="success"
          />
          <StatCard
            title="Offline Szerverek"
            value={servers.length - onlineServers}
            icon={Server}
            color="warning"
          />
        </div>

        {/* Gyors linkek */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <QuickActionCard
            title="Új Szerver"
            description="Rendelj egy új gaming szervert"
            href={`/${locale}/servers/new`}
            icon={Server}
            color="primary"
          />
          <QuickActionCard
            title="Számlázás"
            description="Számlák és előfizetések kezelése"
            href={`/${locale}/dashboard/billing`}
            icon={CreditCard}
            color="secondary"
          />
          <QuickActionCard
            title="Támogatás"
            description="Support ticketek kezelése"
            href={`/${locale}/dashboard/support`}
            icon={Headphones}
            color="success"
          />
        </div>

        {/* Szerverek listája */}
        <ServerListCard servers={servers} locale={locale} />
      </main>
    </div>
  );
}

