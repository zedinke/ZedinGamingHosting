import { getTranslations } from '@/lib/i18n';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-helpers';
import { SystemHealth } from '@/components/admin/SystemHealth';

export default async function AdminDashboardPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  // Statisztikák lekérése
  const [
    totalUsers,
    totalServers,
    activeSubscriptions,
    totalRevenue,
    openTickets,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.server.count(),
    prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    prisma.invoice.aggregate({
      where: { status: 'PAID' },
      _sum: { amount: true },
    }),
    prisma.supportTicket.count({ where: { status: { not: 'CLOSED' } } }),
  ]);

  const revenue = totalRevenue._sum.amount || 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Vezérlőpult</h1>
        <p className="text-gray-700">Üdvözöljük az admin felületen</p>
      </div>

      {/* Statisztikák */}
      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Összes Felhasználó</h3>
          <p className="text-3xl font-bold text-primary-600">{totalUsers}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Összes Szerver</h3>
          <p className="text-3xl font-bold text-primary-600">{totalServers}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Aktív Előfizetések</h3>
          <p className="text-3xl font-bold text-green-600">{activeSubscriptions}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Összes Bevétel</h3>
          <p className="text-3xl font-bold text-green-600">
            {new Intl.NumberFormat('hu-HU', {
              style: 'currency',
              currency: 'HUF',
            }).format(revenue)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Nyitott Ticketek</h3>
          <p className="text-3xl font-bold text-yellow-600">{openTickets}</p>
        </div>
      </div>

      {/* Rendszer Egészség */}
      <div className="mb-8">
        <SystemHealth locale={locale} />
      </div>

      {/* Legutóbbi aktivitások */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Legutóbbi Felhasználók</h2>
          <RecentUsers />
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Legutóbbi Szerverek</h2>
          <RecentServers />
        </div>
      </div>
    </div>
  );
}

async function RecentUsers() {
  const users = await prisma.user.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      role: true,
    },
  });

  return (
    <div className="space-y-3">
      {users.map((user) => (
        <div key={user.id} className="flex justify-between items-center pb-3 border-b last:border-0">
          <div>
            <p className="font-medium">{user.name || user.email}</p>
            <p className="text-sm text-gray-700">{user.email}</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-500">
              {new Date(user.createdAt).toLocaleDateString('hu-HU')}
            </span>
            <span className="ml-2 px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded">
              {user.role}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

async function RecentServers() {
  const servers = await prisma.server.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return (
    <div className="space-y-3">
      {servers.map((server) => (
        <div key={server.id} className="flex justify-between items-center pb-3 border-b last:border-0">
          <div>
            <p className="font-medium">{server.name}</p>
            <p className="text-sm text-gray-700">
              {server.gameType} • {server.user.name || server.user.email}
            </p>
          </div>
          <div className="text-right">
            <span
              className={`px-2 py-1 text-xs rounded ${
                server.status === 'ONLINE'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {server.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

