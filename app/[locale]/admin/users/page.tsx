import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { UserManagement } from '@/components/admin/UserManagement';

export default async function AdminUsersPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { page?: string; search?: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  const page = parseInt(searchParams.page || '1');
  const search = searchParams.search || '';
  const itemsPerPage = 20;

  // Felhasználók lekérése
  const where = search
    ? {
        OR: [
          { email: { contains: search, mode: 'insensitive' as const } },
          { name: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [users, totalUsers] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * itemsPerPage,
      take: itemsPerPage,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        _count: {
          select: {
            servers: true,
            subscriptions: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(totalUsers / itemsPerPage);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Felhasználókezelés</h1>
        <p className="text-gray-600">
          Összes felhasználó: <span className="font-semibold text-gray-900">{totalUsers}</span>
        </p>
      </div>

      <UserManagement
        users={users}
        currentPage={page}
        totalPages={totalPages}
        locale={locale}
      />
    </div>
  );
}

