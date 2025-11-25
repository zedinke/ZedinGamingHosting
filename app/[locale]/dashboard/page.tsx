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
  
  if (!session || !session.user) {
    redirect(`/${locale}/login`);
  }

  // Szerializálható adatok kinyerése a session-ből
  const userEmail = session.user.email;
  const userName = session.user.name;
  const userId = (session.user as any)?.id;
  
  // Ha nincs ID, próbáljuk meg lekérni a user-t az email alapján
  let finalUserId = userId;
  
  if (!finalUserId && userEmail) {
    try {
      const user = await prisma.user.findUnique({
        where: { email: userEmail },
        select: { id: true },
      });
      
      if (user) {
        finalUserId = user.id;
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  }

  if (!finalUserId) {
    redirect(`/${locale}/login`);
  }

  // Translation betöltése
  let t: (key: string) => string;
  try {
    t = getTranslations(locale, 'common');
  } catch (error) {
    console.error('Error loading translations:', error);
    t = (key: string) => key;
  }

  // Felhasználó szervereinek lekérése
  let servers: any[] = [];
  try {
    servers = await prisma.server.findMany({
      where: { userId: finalUserId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        gameType: true,
        maxPlayers: true,
        ipAddress: true,
        port: true,
        status: true,
      },
    });
    // Konvertáljuk az enum értékeket stringgé
    servers = servers.map(server => ({
      ...server,
      gameType: String(server.gameType),
      status: String(server.status),
    }));
  } catch (error) {
    console.error('Error fetching servers:', error);
    servers = [];
  }

  // Aktív előfizetések
  let subscriptions: any[] = [];
  try {
    const subscriptionsData = await prisma.subscription.findMany({
      where: {
        userId: finalUserId,
        status: 'ACTIVE',
      },
      include: {
        server: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });
    // Konvertáljuk az enum értékeket stringgé és csak a szükséges mezőket
    subscriptions = subscriptionsData.map((sub: any) => ({
      id: sub.id,
      status: String(sub.status),
      server: sub.server ? {
        id: sub.server.id,
        name: sub.server.name,
        status: String(sub.server.status),
      } : null,
    }));
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    subscriptions = [];
  }

  const onlineServers = servers.filter((s: { status: string }) => s.status === 'ONLINE').length;

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
            Üdvözöljük, <span className="font-semibold text-gray-900">{userName || userEmail || 'Felhasználó'}</span>!
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

