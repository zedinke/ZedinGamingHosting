'use client';

import { Card } from '@/components/ui/Card';
import { Users, Server, DollarSign, FileText, Ticket } from 'lucide-react';

interface AnalyticsDashboardProps {
  stats: any;
  period: string;
  locale: string;
}

export function AnalyticsDashboard({ stats, period, locale }: AnalyticsDashboardProps) {
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: 'HUF',
    }).format(amount);
  };

  const statCards = [
    {
      icon: Users,
      title: 'Felhasználók',
      value: stats.users.total,
      subtitle: `${stats.users.new} új (${period})`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      icon: Server,
      title: 'Szerverek',
      value: stats.servers.total,
      subtitle: `${stats.servers.active} aktív`,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      icon: DollarSign,
      title: 'Bevétel',
      value: formatPrice(stats.revenue.total),
      subtitle: `${formatPrice(stats.revenue.monthly)} ebben a hónapban`,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      icon: FileText,
      title: 'Számlák',
      value: stats.invoices.total,
      subtitle: `${stats.invoices.paid} fizetve`,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      icon: Ticket,
      title: 'Ticketek',
      value: stats.tickets.total,
      subtitle: `${stats.tickets.open} nyitott`,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex gap-2">
        {['day', 'week', 'month', 'year'].map((p) => (
          <a
            key={p}
            href={`/${locale}/admin/analytics?period=${p}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              period === p
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {p === 'day' ? 'Nap' : p === 'week' ? 'Hét' : p === 'month' ? 'Hónap' : 'Év'}
          </a>
        ))}
      </div>

      {/* Stat cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} padding="lg">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm font-medium text-gray-700 mb-1">{stat.title}</div>
              <div className="text-xs text-gray-500">{stat.subtitle}</div>
            </Card>
          );
        })}
      </div>

      {/* Revenue chart placeholder */}
      <Card padding="lg">
        <h2 className="text-xl font-bold mb-4">Bevétel Trend</h2>
        <div className="h-64 flex items-center justify-center text-gray-400">
          Grafikon implementálása szükséges (recharts vagy chart.js)
        </div>
      </Card>
    </div>
  );
}

