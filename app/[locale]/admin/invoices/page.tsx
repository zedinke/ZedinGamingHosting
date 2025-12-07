import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { InvoiceManagement } from '@/components/admin/InvoiceManagement';

export default async function AdminInvoicesPage({
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
    where.status = status;
  }

  const [invoices, totalInvoices] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        subscription: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * itemsPerPage,
      take: itemsPerPage,
    }),
    prisma.invoice.count({ where }),
  ]);

  const totalPages = Math.ceil(totalInvoices / itemsPerPage);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Számlák Kezelése</h1>
        <p className="text-gray-600">
          Összes számla: <span className="font-semibold text-gray-900">{totalInvoices}</span>
        </p>
      </div>

      <InvoiceManagement
        invoices={invoices}
        currentPage={pageNum}
        totalPages={totalPages}
        locale={locale}
      />
    </div>
  );
}
