import { Navigation } from '@/components/Navigation';
import { getTranslations } from '@/lib/i18n';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation locale={locale} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('dashboard.title')}</h1>
          <p className="text-gray-600">Üdvözöljük, {session.user?.name || session.user?.email}!</p>
        </div>

        {/* Statisztikák */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <h3 className="text-lg font-semibold mb-2">Szervereim</h3>
            <p className="text-3xl font-bold text-primary-600">{servers.length}</p>
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold mb-2">Aktív Előfizetések</h3>
            <p className="text-3xl font-bold text-primary-600">{subscriptions.length}</p>
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold mb-2">Online Szerverek</h3>
            <p className="text-3xl font-bold text-green-600">
              {servers.filter(s => s.status === 'ONLINE').length}
            </p>
          </div>
        </div>

        {/* Gyors linkek */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Link
            href={`/${locale}/servers/new`}
            className="card hover:shadow-lg transition-shadow text-center"
          >
            <div className="text-3xl mb-2">🖥️</div>
            <h3 className="font-semibold">Új szerver</h3>
            <p className="text-sm text-gray-600">Rendelj egy új szervert</p>
          </Link>
          <Link
            href={`/${locale}/dashboard/billing`}
            className="card hover:shadow-lg transition-shadow text-center"
          >
            <div className="text-3xl mb-2">💳</div>
            <h3 className="font-semibold">Számlázás</h3>
            <p className="text-sm text-gray-600">Számlák és előfizetések</p>
          </Link>
          <Link
            href={`/${locale}/dashboard/support`}
            className="card hover:shadow-lg transition-shadow text-center"
          >
            <div className="text-3xl mb-2">🎫</div>
            <h3 className="font-semibold">Támogatás</h3>
            <p className="text-sm text-gray-600">Ticketek kezelése</p>
          </Link>
        </div>

        {/* Szerverek listája */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">{t('dashboard.servers')}</h2>
            <a
              href={`/${locale}/servers/new`}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Új szerver rendelése
            </a>
          </div>

          {servers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">Még nincs szervered</p>
              <a
                href={`/${locale}/pricing`}
                className="text-primary-600 hover:underline"
              >
                Tekintsd meg az árazást
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {servers.map((server) => (
                <div
                  key={server.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{server.name}</h3>
                      <p className="text-sm text-gray-600">
                        {server.gameType} • {server.maxPlayers} játékos
                      </p>
                      <p className="text-sm text-gray-500">
                        {server.ipAddress && `${server.ipAddress}:${server.port}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                          server.status === 'ONLINE'
                            ? 'bg-green-100 text-green-800'
                            : server.status === 'OFFLINE'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {t(`server.${server.status.toLowerCase()}`)}
                      </span>
                      <div className="mt-2">
                        <Link
                          href={`/${locale}/dashboard/servers/${server.id}`}
                          className="text-primary-600 hover:underline text-sm"
                        >
                          {t('server.manage')}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

