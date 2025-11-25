'use client';

import Link from 'next/link';
import { SubscriptionStatus } from '@prisma/client';

interface Subscription {
  id: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  server: {
    id: string;
    name: string;
    gameType: string;
    status: string;
  } | null;
}

interface SubscriptionManagementProps {
  subscriptions: Subscription[];
  currentPage: number;
  totalPages: number;
  locale: string;
  statusFilter?: string;
}

export function SubscriptionManagement({
  subscriptions,
  currentPage,
  totalPages,
  locale,
  statusFilter,
}: SubscriptionManagementProps) {
  const getStatusBadgeColor = (status: SubscriptionStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'CANCELED':
        return 'bg-red-100 text-red-800';
      case 'PAST_DUE':
        return 'bg-orange-100 text-orange-800';
      case 'UNPAID':
        return 'bg-yellow-100 text-yellow-800';
      case 'TRIALING':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Szűrők */}
      <div className="flex gap-2">
        <Link
          href={`/${locale}/admin/subscriptions`}
          className={`px-4 py-2 rounded-lg text-sm ${
            !statusFilter
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Összes
        </Link>
        {['ACTIVE', 'CANCELED', 'PAST_DUE', 'UNPAID', 'TRIALING'].map((status) => (
          <Link
            key={status}
            href={`/${locale}/admin/subscriptions?status=${status}`}
            className={`px-4 py-2 rounded-lg text-sm ${
              statusFilter === status
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status}
          </Link>
        ))}
      </div>

      {/* Előfizetések táblázata */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-gray-700">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left p-3 font-semibold text-gray-900">Felhasználó</th>
              <th className="text-left p-3 font-semibold text-gray-900">Szerver</th>
              <th className="text-left p-3 font-semibold text-gray-900">Státusz</th>
              <th className="text-left p-3 font-semibold text-gray-900">Periódus</th>
              <th className="text-left p-3 font-semibold text-gray-900">Törlés</th>
              <th className="text-left p-3 font-semibold text-gray-900">Létrehozva</th>
              <th className="text-left p-3 font-semibold text-gray-900">Műveletek</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((subscription) => (
              <tr key={subscription.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="p-3">
                  <Link
                    href={`/${locale}/admin/users/${subscription.user.id}`}
                    className="text-primary-600 hover:underline"
                  >
                    {subscription.user.name || subscription.user.email}
                  </Link>
                </td>
                <td className="p-3">
                  {subscription.server ? (
                    <Link
                      href={`/${locale}/admin/servers/${subscription.server.id}`}
                      className="text-primary-600 hover:underline"
                    >
                      {subscription.server.name}
                    </Link>
                  ) : (
                    <span className="text-gray-400">Nincs szerver</span>
                  )}
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeColor(
                      subscription.status
                    )}`}
                  >
                    {subscription.status}
                  </span>
                </td>
                <td className="p-3 text-sm">
                  {subscription.currentPeriodStart && subscription.currentPeriodEnd ? (
                    <div>
                      <div>
                        {new Date(subscription.currentPeriodStart).toLocaleDateString('hu-HU')}
                      </div>
                      <div className="text-gray-500">
                        - {new Date(subscription.currentPeriodEnd).toLocaleDateString('hu-HU')}
                      </div>
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="p-3">
                  {subscription.cancelAtPeriodEnd ? (
                    <span className="text-red-600">Igen</span>
                  ) : (
                    <span className="text-gray-400">Nem</span>
                  )}
                </td>
                <td className="p-3 text-sm text-gray-700">
                  {new Date(subscription.createdAt).toLocaleDateString('hu-HU')}
                </td>
                <td className="p-3">
                  <Link
                    href={`/${locale}/admin/subscriptions/${subscription.id}`}
                    className="text-primary-600 hover:underline text-sm"
                  >
                    Részletek
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagináció */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {currentPage > 1 && (
            <Link
              href={`/${locale}/admin/subscriptions?page=${currentPage - 1}${statusFilter ? `&status=${statusFilter}` : ''}`}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
            >
              Előző
            </Link>
          )}
          <span className="px-4 py-2 text-gray-700">
            Oldal {currentPage} / {totalPages}
          </span>
          {currentPage < totalPages && (
            <Link
              href={`/${locale}/admin/subscriptions?page=${currentPage + 1}${statusFilter ? `&status=${statusFilter}` : ''}`}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
            >
              Következő
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

