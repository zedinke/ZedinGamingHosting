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
    primary: 'bg-gradient-to-br from-primary-500/20 to-primary-600/20 text-primary-400 border border-primary-500/30 group-hover:from-primary-500/30 group-hover:to-primary-600/30',
    secondary: 'bg-gradient-to-br from-secondary-500/20 to-secondary-600/20 text-secondary-400 border border-secondary-500/30 group-hover:from-secondary-500/30 group-hover:to-secondary-600/30',
    success: 'bg-gradient-to-br from-green-500/20 to-green-600/20 text-green-400 border border-green-500/30 group-hover:from-green-500/30 group-hover:to-green-600/30',
    warning: 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 text-yellow-400 border border-yellow-500/30 group-hover:from-yellow-500/30 group-hover:to-yellow-600/30',
  };

  return (
    <Link href={href} className="group block h-full">
      <Card hover className="text-center h-full card-glow border-dark-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/0 to-secondary-600/0 group-hover:from-primary-600/10 group-hover:to-secondary-600/10 transition-all duration-300"></div>
        <div className="relative">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 ${colorClasses[color]} transition-all duration-300 group-hover:scale-110 group-hover:shadow-neon border border-primary-500/30`}>
            <Icon className="w-10 h-10" />
          </div>
          <h3 className="font-bold text-xl mb-3 text-white group-hover:text-primary-300 transition-colors">{title}</h3>
          <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">{description}</p>
          <div className="mt-6 flex items-center justify-center gap-2 text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-sm font-semibold">Tovább</span>
            <span className="transform group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

