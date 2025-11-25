import { Navigation } from '@/components/Navigation';
import { getTranslations } from '@/lib/i18n';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { StatCard } from '@/components/dashboard/StatCard';
import { QuickActionCard } from '@/components/dashboard/QuickActionCard';
import { ServerListCard } from '@/components/dashboard/ServerListCard';

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  try {
    // Next.js 14+ támogatás: params lehet Promise
    const resolvedParams = params instanceof Promise ? await params : params;
    const locale = resolvedParams.locale || 'hu';
    
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      redirect(`/${locale}/login`);
    }

    // Szerializálható adatok kinyerése a session-ből
    const userEmail = session.user.email || '';
    const userName = session.user.name || '';
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

  // Translation betöltése - biztonságos módon
  // Fontos: A függvényt nem lehet Client Component-nek átadni, csak az eredményt
  let dashboardTitle: string;
  try {
    const t = getTranslations(locale, 'common');
    dashboardTitle = t('dashboard.title');
  } catch (error) {
    console.error('Error loading translations:', error);
    dashboardTitle = 'Dashboard';
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

  // Biztosítjuk, hogy minden adat szerializálható legyen
  const serializableServers = servers.map(server => ({
    id: String(server.id),
    name: String(server.name || ''),
    gameType: String(server.gameType || ''),
    maxPlayers: Number(server.maxPlayers || 0),
    ipAddress: server.ipAddress ? String(server.ipAddress) : null,
    port: server.port ? Number(server.port) : null,
    status: String(server.status || 'OFFLINE'),
  }));

  const onlineServers = serializableServers.filter((s: { status: string }) => s.status === 'ONLINE').length;

  // Biztosítjuk, hogy a locale érvényes legyen
  const validLocale = locale === 'hu' || locale === 'en' ? locale : 'hu';

  return (
    <div className="min-h-screen bg-dark-900">
      <Navigation locale={validLocale} />
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-10 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-600/20 via-secondary-600/20 to-accent-500/20 blur-3xl rounded-3xl"></div>
          <div className="relative glass-effect rounded-2xl p-8 border border-primary-500/30">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 text-glow">
              <span className="bg-clip-text text-transparent gamer-gradient">
                {dashboardTitle}
              </span>
            </h1>
            <p className="text-xl text-gray-300">
              Üdvözöljük, <span className="font-bold text-primary-400">{userName || userEmail || 'Felhasználó'}</span>! 👋
            </p>
          </div>
        </div>

        {/* Statisztikák */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Szervereim"
            value={serializableServers.length}
            iconName="Server"
            color="primary"
          />
          <StatCard
            title="Aktív Előfizetések"
            value={subscriptions.length}
            iconName="CreditCard"
            color="info"
          />
          <StatCard
            title="Online Szerverek"
            value={onlineServers}
            iconName="TrendingUp"
            color="success"
          />
          <StatCard
            title="Offline Szerverek"
            value={serializableServers.length - onlineServers}
            iconName="Server"
            color="warning"
          />
        </div>

        {/* Gyors linkek */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <QuickActionCard
            title="Új Szerver"
            description="Rendelj egy új gaming szervert"
            href={`/${locale}/servers/new`}
            iconName="Server"
            color="primary"
          />
          <QuickActionCard
            title="Számlázás"
            description="Számlák és előfizetések kezelése"
            href={`/${locale}/dashboard/billing`}
            iconName="CreditCard"
            color="secondary"
          />
          <QuickActionCard
            title="Támogatás"
            description="Support ticketek kezelése"
            href={`/${locale}/dashboard/support`}
            iconName="Headphones"
            color="success"
          />
        </div>

        {/* Szerverek listája */}
        <ServerListCard servers={serializableServers} locale={locale} />
      </main>
    </div>
    );
  } catch (error: any) {
    console.error('Dashboard page error:', error);
    // Ha hiba van, próbáljuk meg egy egyszerűbb verziót renderelni
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
          <p className="text-red-600">
            Hiba történt a dashboard betöltése során. Kérjük, próbáld újra később.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {error?.message || 'Ismeretlen hiba'}
          </p>
        </div>
      </div>
    );
  }
}

