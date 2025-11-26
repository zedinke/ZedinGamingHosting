'use client';

import { Card } from '@/components/ui/Card';
import * as LucideIcons from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  iconName?: string;
  icon?: LucideIcon;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatCard({ title, value, iconName, icon: Icon, color = 'primary', trend }: StatCardProps) {
  // Dinamikusan betöltjük az ikont név alapján, ha nincs közvetlenül megadva
  if (!Icon && iconName) {
    const IconComponent = (LucideIcons as any)[iconName] as LucideIcon;
    if (IconComponent) {
      Icon = IconComponent;
    }
  }
  
  // Ha még mindig nincs ikon, használunk egy default-ot
  if (!Icon) {
    Icon = LucideIcons.BarChart3;
  }
  const colorClasses = {
    primary: 'bg-primary-100 text-primary-600',
    success: 'bg-green-100 text-green-600',
    warning: 'bg-yellow-100 text-yellow-600',
    danger: 'bg-red-100 text-red-600',
    info: 'bg-blue-100 text-blue-600',
  };

  const valueColorClasses = {
    primary: 'text-primary-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600',
    info: 'text-blue-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-700 mb-2">{title}</h3>
          <p className={`text-3xl font-bold ${valueColorClasses[color]}`}>
            {value}
          </p>
          {trend && (
            <p className={`text-xs mt-2 font-semibold ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              <span className="inline-block mr-1">{trend.isPositive ? '↑' : '↓'}</span>
              {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

