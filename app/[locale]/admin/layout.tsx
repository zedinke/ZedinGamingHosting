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
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation locale={locale} />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}

