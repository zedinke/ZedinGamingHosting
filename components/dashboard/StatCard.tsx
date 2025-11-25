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
    primary: 'bg-gradient-to-br from-primary-500/20 to-primary-600/20 text-primary-400 border border-primary-500/30',
    success: 'bg-gradient-to-br from-green-500/20 to-green-600/20 text-green-400 border border-green-500/30',
    warning: 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 text-yellow-400 border border-yellow-500/30',
    danger: 'bg-gradient-to-br from-red-500/20 to-red-600/20 text-red-400 border border-red-500/30',
    info: 'bg-gradient-to-br from-blue-500/20 to-blue-600/20 text-blue-400 border border-blue-500/30',
  };

  const valueColorClasses = {
    primary: 'text-primary-400',
    success: 'text-green-400',
    warning: 'text-yellow-400',
    danger: 'text-red-400',
    info: 'text-blue-400',
  };

  return (
    <div className="group relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 to-secondary-600/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-0 group-hover:opacity-100"></div>
      <Card hover className="relative card-glow overflow-hidden border-dark-700">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-500/10 to-transparent rounded-full blur-2xl"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">{title}</p>
            <p className={`text-4xl font-black ${valueColorClasses[color]} text-glow`}>
              {value}
            </p>
            {trend && (
              <p className={`text-xs mt-3 font-semibold ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                <span className="inline-block mr-1">{trend.isPositive ? '↑' : '↓'}</span>
                {Math.abs(trend.value)}%
              </p>
            )}
          </div>
          <div className={`p-4 rounded-xl ${colorClasses[color]} group-hover:scale-110 transition-transform duration-300 shadow-glow`}>
            <Icon className="w-8 h-8" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-secondary-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
      </Card>
    </div>
  );
}

