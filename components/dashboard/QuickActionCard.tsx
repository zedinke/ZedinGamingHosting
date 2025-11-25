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
    primary: 'bg-primary-100 text-primary-600 hover:bg-primary-200',
    secondary: 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200',
    success: 'bg-green-100 text-green-600 hover:bg-green-200',
    warning: 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200',
  };

  return (
    <Link href={href}>
      <Card hover className="text-center h-full">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${colorClasses[color]} transition-colors`}>
          <Icon className="w-8 h-8" />
        </div>
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </Card>
    </Link>
  );
}

