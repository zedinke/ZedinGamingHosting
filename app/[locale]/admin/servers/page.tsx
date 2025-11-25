import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { ServerManagement } from '@/components/admin/ServerManagement';

export default async function AdminServersPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { page?: string; search?: string; status?: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  const page = parseInt(searchParams.page || '1');
  const search = searchParams.search || '';
  const statusFilter = searchParams.status;
  const itemsPerPage = 20;

  // Szerverek lekérése
  const where: any = {};
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' as const } },
      { user: { email: { contains: search, mode: 'insensitive' as const } } },
    ];
  }
  
  if (statusFilter) {
    where.status = statusFilter;
  }

  const [servers, totalServers] = await Promise.all([
    prisma.server.findMany({
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
        subscription: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    }),
    prisma.server.count({ where }),
  ]);

  const totalPages = Math.ceil(totalServers / itemsPerPage);

  // Statisztikák
  const stats = await prisma.server.groupBy({
    by: ['status'],
    _count: true,
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Szerverkezelés</h1>
        <p className="text-gray-600">Összes szerver: {totalServers}</p>
      </div>

      {/* Statisztikák */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <div key={stat.status} className="card">
            <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.status}</h3>
            <p className="text-2xl font-bold text-primary-600">{stat._count}</p>
          </div>
        ))}
      </div>

      <ServerManagement
        servers={servers}
        currentPage={page}
        totalPages={totalPages}
        locale={locale}
        statusFilter={statusFilter}
      />
    </div>
  );
}

