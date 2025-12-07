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
  try {
    await requireAdmin(locale);
    const t = getTranslations(locale, 'common');

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <AdminNavigation locale={locale} />
        <main className="lg:ml-64 min-h-screen">
          <div className="p-6 lg:p-8 bg-white/60 backdrop-blur-sm rounded-none lg:rounded-tl-2xl lg:rounded-bl-2xl">
            {children}
          </div>
        </main>
      </div>
    );
  } catch (error) {
    // Ha redirect hiba, dobjuk tovább (Next.js redirect)
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error;
    }
    console.error('Admin layout error:', error);
    throw error;
  }
}

