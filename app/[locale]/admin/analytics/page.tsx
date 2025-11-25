import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';

export default async function AdminAnalyticsPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { period?: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  const period = searchParams.period || 'month'; // day, week, month, year

  // Calculate date range based on period
  const now = new Date();
  let startDate: Date;
  
  switch (period) {
    case 'day':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7); // Last 7 days
      break;
    case 'week':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30); // Last 30 days
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1); // Last 3 months
      break;
    case 'year':
      startDate = new Date(now.getFullYear() - 1, 0, 1); // Last year
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  }

  // Get statistics
  const [
    totalUsers,
    newUsers,
    totalServers,
    activeServers,
    totalRevenue,
    monthlyRevenue,
    totalInvoices,
    paidInvoices,
    totalTickets,
    openTickets,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: { createdAt: { gte: startDate } },
    }),
    prisma.server.count(),
    prisma.server.count({
      where: { status: 'ONLINE' },
    }),
    prisma.invoice.aggregate({
      where: { status: 'PAID' },
      _sum: { amount: true },
    }),
    prisma.invoice.aggregate({
      where: {
        status: 'PAID',
        paidAt: {
          gte: new Date(now.getFullYear(), now.getMonth(), 1),
        },
      },
      _sum: { amount: true },
    }),
    prisma.invoice.count(),
    prisma.invoice.count({
      where: { status: 'PAID' },
    }),
    prisma.supportTicket.count(),
    prisma.supportTicket.count({
      where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
    }),
  ]);

  // Get revenue by period
  const revenueByPeriod = await prisma.invoice.groupBy({
    by: ['createdAt'],
    where: {
      status: 'PAID',
      createdAt: { gte: startDate },
    },
    _sum: {
      amount: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  const stats = {
    users: {
      total: totalUsers,
      new: newUsers,
    },
    servers: {
      total: totalServers,
      active: activeServers,
    },
    revenue: {
      total: totalRevenue._sum.amount || 0,
      monthly: monthlyRevenue._sum.amount || 0,
    },
    invoices: {
      total: totalInvoices,
      paid: paidInvoices,
    },
    tickets: {
      total: totalTickets,
      open: openTickets,
    },
    revenueByPeriod,
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics & Statisztikák</h1>
        <p className="text-gray-700">Rendszer teljesítmény és használati adatok</p>
      </div>

      <AnalyticsDashboard stats={stats} period={period} locale={locale} />
    </div>
  );
}

