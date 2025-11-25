import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { SubscriptionManagement } from '@/components/admin/SubscriptionManagement';

export default async function AdminSubscriptionsPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { page?: string; status?: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  const page = parseInt(searchParams.page || '1');
  const statusFilter = searchParams.status;
  const itemsPerPage = 20;

  const where: any = {};
  if (statusFilter) {
    where.status = statusFilter;
  }

  const [subscriptions, totalSubscriptions] = await Promise.all([
    prisma.subscription.findMany({
      where,
      skip: (page - 1) * itemsPerPage,
      take: itemsPerPage,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        server: {
          select: {
            id: true,
            name: true,
            gameType: true,
            status: true,
          },
        },
      },
    }),
    prisma.subscription.count({ where }),
  ]);

  const totalPages = Math.ceil(totalSubscriptions / itemsPerPage);

  // Statisztikák
  const stats = await prisma.subscription.groupBy({
    by: ['status'],
    _count: true,
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Előfizetéskezelés</h1>
        <p className="text-gray-600">Összes előfizetés: {totalSubscriptions}</p>
      </div>

      {/* Statisztikák */}
      <div className="grid md:grid-cols-5 gap-4 mb-6">
        {stats.map((stat) => (
          <div key={stat.status} className="card">
            <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.status}</h3>
            <p className="text-2xl font-bold text-primary-600">{stat._count}</p>
          </div>
        ))}
      </div>

      <SubscriptionManagement
        subscriptions={subscriptions}
        currentPage={page}
        totalPages={totalPages}
        locale={locale}
        statusFilter={statusFilter}
      />
    </div>
  );
}

