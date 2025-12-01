import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { AdminNavigation } from '@/components/admin/AdminNavigation';
import { InstallLogsViewer } from '@/components/admin/InstallLogsViewer';

export default async function AdminInstallLogsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  // Összes szerver lekérése (limit nélkül, hogy minden szerver logját lássuk)
  const servers = await prisma.server.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return (
    <AdminNavigation locale={locale}>
      <div className="ml-64 p-8">
        <InstallLogsViewer locale={locale} servers={servers} />
      </div>
    </AdminNavigation>
  );
}

