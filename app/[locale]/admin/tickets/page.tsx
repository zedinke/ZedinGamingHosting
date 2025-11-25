import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { TicketManagement } from '@/components/admin/TicketManagement';

export default async function AdminTicketsPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { page?: string; status?: string; category?: string; priority?: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  const page = parseInt(searchParams.page || '1');
  const statusFilter = searchParams.status;
  const categoryFilter = searchParams.category;
  const priorityFilter = searchParams.priority;
  const itemsPerPage = 20;

  const where: any = {};
  
  if (statusFilter) {
    where.status = statusFilter;
  }
  
  if (categoryFilter) {
    where.category = categoryFilter;
  }
  
  if (priorityFilter) {
    where.priority = priorityFilter;
  }

  const [tickets, totalTickets] = await Promise.all([
    prisma.supportTicket.findMany({
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
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            createdAt: true,
            isAdmin: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    }),
    prisma.supportTicket.count({ where }),
  ]);

  const totalPages = Math.ceil(totalTickets / itemsPerPage);

  // Statisztikák
  const [statusStats, categoryStats, priorityStats] = await Promise.all([
    prisma.supportTicket.groupBy({
      by: ['status'],
      _count: true,
    }),
    prisma.supportTicket.groupBy({
      by: ['category'],
      _count: true,
    }),
    prisma.supportTicket.groupBy({
      by: ['priority'],
      _count: true,
    }),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Támogatási Ticketek</h1>
        <p className="text-gray-700">
          Összes ticket: <span className="font-semibold text-gray-900">{totalTickets}</span>
        </p>
      </div>

      {/* Statisztikák */}
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Státusz szerint</h3>
          <div className="space-y-2">
            {statusStats.map((stat) => (
              <div key={stat.status} className="flex justify-between">
                <span className="text-gray-700">{stat.status}</span>
                <span className="font-semibold text-gray-900">{stat._count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Kategória szerint</h3>
          <div className="space-y-2">
            {categoryStats.map((stat) => (
              <div key={stat.category} className="flex justify-between">
                <span className="text-gray-700">{stat.category}</span>
                <span className="font-semibold text-gray-900">{stat._count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Prioritás szerint</h3>
          <div className="space-y-2">
            {priorityStats.map((stat) => (
              <div key={stat.priority} className="flex justify-between">
                <span className="text-gray-700">{stat.priority}</span>
                <span className="font-semibold text-gray-900">{stat._count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <TicketManagement
        tickets={tickets}
        currentPage={page}
        totalPages={totalPages}
        locale={locale}
        statusFilter={statusFilter}
        categoryFilter={categoryFilter}
        priorityFilter={priorityFilter}
      />
    </div>
  );
}

