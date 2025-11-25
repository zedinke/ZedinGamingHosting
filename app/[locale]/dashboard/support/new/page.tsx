import { Navigation } from '@/components/Navigation';
import { getTranslations } from '@/lib/i18n';
import { requireAuth } from '@/lib/auth-helpers';
import { NewTicketForm } from '@/components/support/NewTicketForm';

export default async function NewTicketPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  await requireAuth();
  const t = getTranslations(locale, 'common');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation locale={locale} />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Új Ticket Létrehozása</h1>
          <NewTicketForm locale={locale} />
        </div>
      </main>
    </div>
  );
}

