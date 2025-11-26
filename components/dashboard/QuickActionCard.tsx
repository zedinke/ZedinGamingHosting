'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import * as LucideIcons from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface QuickActionCardProps {
  title: string;
  description: string;
  href: string;
  iconName?: string;
  icon?: LucideIcon;
  color?: 'primary' | 'secondary' | 'success' | 'warning';
}

export function QuickActionCard({
  title,
  description,
  href,
  iconName,
  icon: Icon,
  color = 'primary',
}: QuickActionCardProps) {
  // Dinamikusan betöltjük az ikont név alapján, ha nincs közvetlenül megadva
  if (!Icon && iconName) {
    const IconComponent = (LucideIcons as any)[iconName] as LucideIcon;
    if (IconComponent) {
      Icon = IconComponent;
    }
  }
  
  // Ha még mindig nincs ikon, használunk egy default-ot
  if (!Icon) {
    Icon = LucideIcons.ArrowRight;
  }
  const colorClasses = {
    primary: 'bg-primary-100 text-primary-600',
    secondary: 'bg-gray-100 text-gray-600',
    success: 'bg-green-100 text-green-600',
    warning: 'bg-yellow-100 text-yellow-600',
  };

  return (
    <Link href={href} className="group block h-full">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all h-full">
        <div className="text-center">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-lg mb-4 ${colorClasses[color]}`}>
            <Icon className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-lg mb-2 text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
          <div className="mt-4 flex items-center justify-center gap-2 text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-sm font-medium">Tovább</span>
            <span className="transform group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

