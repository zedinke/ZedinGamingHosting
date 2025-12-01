import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { LicenseManagement } from '@/components/admin/LicenseManagement';

export default async function AdminLicensePage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { status?: string; page?: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  const pageNum = parseInt(searchParams.page || '1');
  const status = searchParams.status;
  const itemsPerPage = 20;

  const where: any = {};
  if (status) {
    where.paymentStatus = status;
  }

  const [orders, totalOrders, plans] = await Promise.all([
    prisma.saaSOrder.findMany({
      where,
      include: {
        plan: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * itemsPerPage,
      take: itemsPerPage,
    }),
    prisma.saaSOrder.count({ where }),
    prisma.saaSPlan.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    }),
  ]);

  const totalPages = Math.ceil(totalOrders / itemsPerPage);

  // Statisztikák
  const [totalPaid, totalPending, totalActive] = await Promise.all([
    prisma.saaSOrder.count({ where: { paymentStatus: 'PAID' } }),
    prisma.saaSOrder.count({ where: { paymentStatus: 'PENDING' } }),
    prisma.saaSOrder.count({ where: { isActive: true } }),
  ]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">License Kezelés</h1>
        <p className="text-gray-700">
          SaaS megrendelések és license key-ek kezelése
        </p>
      </div>

      {/* Statisztikák */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Összes megrendelés</h3>
          <p className="text-3xl font-bold text-primary-600">{totalOrders}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Fizetett</h3>
          <p className="text-3xl font-bold text-green-600">{totalPaid}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Függőben</h3>
          <p className="text-3xl font-bold text-yellow-600">{totalPending}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Aktív license-ek</h3>
          <p className="text-3xl font-bold text-blue-600">{totalActive}</p>
        </div>
      </div>

      <LicenseManagement
        orders={orders}
        plans={plans}
        currentPage={pageNum}
        totalPages={totalPages}
        locale={locale}
        statusFilter={status}
      />
    </div>
  );
}

