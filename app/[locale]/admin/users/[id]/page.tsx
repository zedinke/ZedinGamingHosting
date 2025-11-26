import { getTranslations } from '@/lib/i18n';
import { requireAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { UserRole } from '@prisma/client';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle2, XCircle, Server, CreditCard, FileText, MessageSquare, Calendar, Mail, User as UserIcon } from 'lucide-react';

export default async function AdminUserDetailPage({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  await requireAdmin(locale);
  const t = getTranslations(locale, 'common');

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      servers: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          gameType: true,
          status: true,
          createdAt: true,
        },
      },
          subscriptions: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          invoices: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              amount: true,
              currency: true,
              status: true,
              createdAt: true,
            },
          },
        },
      },
      tickets: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          subject: true,
          status: true,
          priority: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          servers: true,
          subscriptions: true,
          tickets: true,
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  const getRoleLabel = (role: UserRole) => {
    const labels: Record<UserRole, string> = {
      USER: 'Felhasználó',
      ADMIN: 'Adminisztrátor',
      MODERATOR: 'Moderátor',
      PROBA: 'Próba',
    };
    return labels[role] || role;
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      case 'MODERATOR':
        return 'bg-blue-100 text-blue-800';
      case 'PROBA':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
      case 'ONLINE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
      case 'OFFLINE':
        return 'bg-gray-100 text-gray-800';
      case 'SUSPENDED':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/${locale}/admin/users`}
          className="text-primary-600 hover:underline mb-4 inline-block"
        >
          ← Vissza a felhasználókhoz
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {user.name || user.email}
        </h1>
        <p className="text-gray-600">Felhasználó részletek és kezelés</p>
      </div>

      <div className="space-y-6">
        {/* Alapinformációk */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-white border border-gray-200">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Alapinformációk</h2>
            <dl className="space-y-3">
              <div className="flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <dt className="text-sm text-gray-600">Név</dt>
                  <dd className="font-medium text-gray-900">{user.name || <span className="text-gray-400">-</span>}</dd>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <dt className="text-sm text-gray-600">Email</dt>
                  <dd className="font-medium text-gray-900">{user.email}</dd>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <dt className="text-sm text-gray-600">Szerepkör</dt>
                  <dd>
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                  </dd>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {user.emailVerified ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <div className="flex-1">
                  <dt className="text-sm text-gray-600">Email megerősítve</dt>
                  <dd className="font-medium text-gray-900">
                    {user.emailVerified ? (
                      <span className="text-green-600">Igen</span>
                    ) : (
                      <span className="text-red-600">Nem</span>
                    )}
                  </dd>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <dt className="text-sm text-gray-600">Regisztrálva</dt>
                  <dd className="font-medium text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString('hu-HU', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </dd>
                </div>
              </div>
            </dl>
          </Card>

          <Card className="bg-white border border-gray-200">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Statisztikák</h2>
            <dl className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-gray-400" />
                  <dt className="text-sm text-gray-600">Szerverek</dt>
                </div>
                <dd className="font-bold text-gray-900">{user._count.servers}</dd>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-gray-400" />
                  <dt className="text-sm text-gray-600">Előfizetések</dt>
                </div>
                <dd className="font-bold text-gray-900">{user._count.subscriptions}</dd>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-gray-400" />
                  <dt className="text-sm text-gray-600">Support ticketek</dt>
                </div>
                <dd className="font-bold text-gray-900">{user._count.tickets}</dd>
              </div>
            </dl>
          </Card>
        </div>

        {/* Szerverek */}
        {user.servers.length > 0 && (
          <Card className="bg-white border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Szerverek ({user._count.servers})</h2>
              {user._count.servers > 10 && (
                <Link
                  href={`/${locale}/admin/servers?userId=${user.id}`}
                  className="text-primary-600 hover:underline text-sm"
                >
                  Összes megtekintése →
                </Link>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Név</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Játék</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Státusz</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Létrehozva</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Műveletek</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {user.servers.map((server) => (
                    <tr key={server.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{server.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{server.gameType}</td>
                      <td className="px-4 py-3">
                        <Badge className={getStatusBadgeColor(server.status)}>
                          {server.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(server.createdAt).toLocaleDateString('hu-HU')}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/${locale}/admin/servers/${server.id}`}
                          className="text-primary-600 hover:underline text-sm"
                        >
                          Részletek →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Előfizetések */}
        {user.subscriptions.length > 0 && (
          <Card className="bg-white border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Előfizetések ({user._count.subscriptions})</h2>
              {user._count.subscriptions > 10 && (
                <Link
                  href={`/${locale}/admin/subscriptions?userId=${user.id}`}
                  className="text-primary-600 hover:underline text-sm"
                >
                  Összes megtekintése →
                </Link>
              )}
            </div>
            <div className="space-y-4">
              {user.subscriptions.map((subscription) => (
                <div key={subscription.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">Előfizetés #{subscription.id.slice(0, 8)}</h3>
                      <p className="text-sm text-gray-600">
                        {subscription.paymentProvider} • {subscription.status}
                        {subscription.currentPeriodEnd && (
                          <span className="ml-2">
                            • {new Date(subscription.currentPeriodEnd).toLocaleDateString('hu-HU')}
                          </span>
                        )}
                      </p>
                    </div>
                    <Badge className={getStatusBadgeColor(subscription.status)}>
                      {subscription.status}
                    </Badge>
                  </div>
                  {subscription.invoices.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600 mb-2">Legutóbbi számlák:</p>
                      <div className="space-y-1">
                        {subscription.invoices.map((invoice) => (
                          <div key={invoice.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-700">
                                {invoice.amount} {invoice.currency || 'HUF'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusBadgeColor(invoice.status)}>
                                {invoice.status}
                              </Badge>
                              <span className="text-gray-500 text-xs">
                                {new Date(invoice.createdAt).toLocaleDateString('hu-HU')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Support ticketek */}
        {user.tickets.length > 0 && (
          <Card className="bg-white border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Support ticketek ({user._count.tickets})</h2>
              {user._count.tickets > 10 && (
                <Link
                  href={`/${locale}/admin/tickets?userId=${user.id}`}
                  className="text-primary-600 hover:underline text-sm"
                >
                  Összes megtekintése →
                </Link>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Tárgy</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Státusz</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Prioritás</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Létrehozva</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Műveletek</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {user.tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{ticket.subject}</td>
                      <td className="px-4 py-3">
                        <Badge className={getStatusBadgeColor(ticket.status)}>
                          {ticket.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={getStatusBadgeColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(ticket.createdAt).toLocaleDateString('hu-HU')}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/${locale}/admin/tickets/${ticket.id}`}
                          className="text-primary-600 hover:underline text-sm"
                        >
                          Részletek →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Üres állapotok */}
        {user.servers.length === 0 && user.subscriptions.length === 0 && user.tickets.length === 0 && (
          <Card className="bg-white border border-gray-200">
            <p className="text-gray-600 text-center py-8">
              Ennek a felhasználónak még nincsenek szerverei, előfizetései vagy support ticketjei.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

