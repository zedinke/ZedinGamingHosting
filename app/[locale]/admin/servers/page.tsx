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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Szerverkezelés</h1>
        <p className="text-gray-600">
          Összes szerver: <span className="font-semibold text-gray-900">{totalServers}</span>
        </p>
      </div>

      {/* Statisztikák */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <div key={stat.status} className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl shadow-sm border border-indigo-200 p-6 hover:shadow-lg transition-all transform hover:scale-105">
            <h3 className="text-sm font-semibold text-indigo-700 mb-1">{stat.status}</h3>
            <p className="text-2xl font-bold text-indigo-900">{stat._count}</p>
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

