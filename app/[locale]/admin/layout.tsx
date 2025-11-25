import { requireAdmin } from '@/lib/auth-helpers';
import { AdminNavigation } from '@/components/admin/AdminNavigation';
import { getTranslations } from '@/lib/i18n';

export default async function AdminLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNavigation locale={locale} />
      <main className="lg:ml-64 min-h-screen bg-white">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

