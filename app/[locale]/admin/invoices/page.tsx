import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { InvoiceManagement } from '@/components/admin/InvoiceManagement';

export default async function AdminInvoicesPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { page?: string; status?: string; search?: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  const page = parseInt(searchParams.page || '1');
  const statusFilter = searchParams.status;
  const search = searchParams.search || '';
  const itemsPerPage = 20;

  const where: any = {};
  
  if (statusFilter) {
    where.status = statusFilter;
  }
  
  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search, mode: 'insensitive' as const } },
      { user: { email: { contains: search, mode: 'insensitive' as const } } },
    ];
  }

  const [invoices, totalInvoices] = await Promise.all([
    prisma.invoice.findMany({
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
            server: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.invoice.count({ where }),
  ]);

  const totalPages = Math.ceil(totalInvoices / itemsPerPage);

  // Statisztikák
  const [stats, totalRevenue, pendingAmount] = await Promise.all([
    prisma.invoice.groupBy({
      by: ['status'],
      _count: true,
    }),
    prisma.invoice.aggregate({
      where: { status: 'PAID' },
      _sum: { amount: true },
    }),
    prisma.invoice.aggregate({
      where: { status: 'PENDING' },
      _sum: { amount: true },
    }),
  ]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Számlakezelés</h1>
        <p className="text-gray-600">Összes számla: {totalInvoices}</p>
      </div>

      {/* Statisztikák */}
      <div className="grid md:grid-cols-6 gap-4 mb-6">
        {stats.map((stat) => (
          <div key={stat.status} className="card">
            <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.status}</h3>
            <p className="text-2xl font-bold text-primary-600">{stat._count}</p>
          </div>
        ))}
        <div className="card">
          <h3 className="text-sm font-medium text-gray-600 mb-1">Összes Bevétel</h3>
          <p className="text-2xl font-bold text-green-600">
            {new Intl.NumberFormat('hu-HU', {
              style: 'currency',
              currency: 'HUF',
            }).format(totalRevenue._sum.amount || 0)}
          </p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-gray-600 mb-1">Függőben</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {new Intl.NumberFormat('hu-HU', {
              style: 'currency',
              currency: 'HUF',
            }).format(pendingAmount._sum.amount || 0)}
          </p>
        </div>
      </div>

      <InvoiceManagement
        invoices={invoices}
        currentPage={page}
        totalPages={totalPages}
        locale={locale}
        statusFilter={statusFilter}
      />
    </div>
  );
}

