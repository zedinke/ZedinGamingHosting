import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ServerDetail } from '@/components/admin/ServerDetail';

export default async function AdminServerDetailPage({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  const server = await prisma.server.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      subscription: {
        include: {
          invoices: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
  });

  if (!server) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/${locale}/admin/servers`}
          className="text-primary-600 hover:underline mb-4 inline-block"
        >
          ← Vissza a szerverekhez
        </Link>
        <h1 className="text-3xl font-bold mb-2">{server.name}</h1>
        <p className="text-gray-600">Szerver részletek és kezelés</p>
      </div>

      <ServerDetail server={server} locale={locale} />
    </div>
  );
}

