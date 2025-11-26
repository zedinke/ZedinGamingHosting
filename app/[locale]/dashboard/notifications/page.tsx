import { Navigation } from '@/components/Navigation';
import { requireAuth } from '@/lib/auth-helpers';
import { NotificationsList } from '@/components/dashboard/NotificationsList';

export default async function NotificationsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  await requireAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation locale={locale} />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Értesítések</h1>
            <p className="text-gray-700">Minden értesítés egy helyen</p>
          </div>
          <NotificationsList locale={locale} />
        </div>
      </main>
    </div>
  );
}

