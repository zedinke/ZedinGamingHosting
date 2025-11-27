'use client';

import { useState } from 'react';
import Image from 'next/image';
import { GameType } from '@prisma/client';

interface GamePackage {
  id: string;
  gameType: GameType;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  interval: string;
  image: string | null;
  slot: number;
  cpuCores: number;
  ram: number;
  discountPrice: number | null;
  isActive: boolean;
  order: number;
}

interface GamePackageCardProps {
  package: GamePackage;
  locale: string;
  onSelect?: (pkg: GamePackage) => void;
}

export function GamePackageCard({ package: pkg, locale, onSelect }: GamePackageCardProps) {
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getGameTypeLabel = (gameType: GameType): string => {
    const labels: Record<string, string> = {
      MINECRAFT: 'Minecraft',
      RUST: 'Rust',
      ARK_EVOLVED: 'ARK: Survival Evolved',
      ARK_ASCENDED: 'ARK: Survival Ascended',
      VALHEIM: 'Valheim',
      PALWORLD: 'Palworld',
      THE_FOREST: 'The Forest',
      SONS_OF_THE_FOREST: 'Sons of the Forest',
      CS2: 'Counter-Strike 2',
      CSGO: 'Counter-Strike: Global Offensive',
    };
    return labels[gameType] || gameType;
  };

  return (
    <div
      className="relative bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl group"
      onClick={() => onSelect?.(pkg)}
    >
      {/* Kép - 2/3 rész */}
      <div className="relative h-64 bg-gradient-to-br from-gray-100 to-gray-200">
        {/* Placeholder - alapértelmezetten látható, ha nincs kép */}
        <div className="image-placeholder absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
          <span className="text-4xl font-bold text-primary-600">{getGameTypeLabel(pkg.gameType).charAt(0)}</span>
        </div>
        {/* Kép - ha van, akkor ezt mutatjuk */}
        {pkg.image && (
          <img
            src={pkg.image}
            alt={pkg.name}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              // Ha a kép nem töltődik be, mutassunk placeholder-t
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const placeholder = target.parentElement?.querySelector('.image-placeholder') as HTMLElement;
              if (placeholder) {
                placeholder.style.display = 'flex';
              }
            }}
            onLoad={(e) => {
              // Ha a kép sikeresen betöltődött, rejtsük el a placeholder-t
              const target = e.target as HTMLImageElement;
              const placeholder = target.parentElement?.querySelector('.image-placeholder') as HTMLElement;
              if (placeholder) {
                placeholder.style.display = 'none';
              }
            }}
          />
        )}
        
        {/* Akció badge */}
        {pkg.discountPrice && (
          <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg z-10">
            Akció
          </div>
        )}

        {/* Sötétített alsó rész (1/3 - 70% sötétítés) */}
        <div className="absolute bottom-0 left-0 right-0 h-[33.33%] bg-gradient-to-t from-black/70 via-black/70 to-transparent flex items-end">
          <div className="px-6 pb-4 text-white w-full">
            {/* Ár */}
            <div className="mb-3">
              {pkg.discountPrice ? (
                <div>
                  <div className="text-2xl font-bold">
                    {formatPrice(pkg.discountPrice, pkg.currency)}
                    <span className="text-sm font-normal opacity-80">/{pkg.interval === 'month' ? 'hó' : 'év'}</span>
                  </div>
                  <div className="text-sm line-through opacity-60">
                    {formatPrice(pkg.price, pkg.currency)}
                  </div>
                </div>
              ) : (
                <div className="text-2xl font-bold">
                  {formatPrice(pkg.price, pkg.currency)}
                  <span className="text-sm font-normal opacity-80">/{pkg.interval === 'month' ? 'hó' : 'év'}</span>
                </div>
              )}
            </div>

            {/* Slot és Játék neve */}
            <div className="flex items-center justify-between text-sm font-medium">
              <span>{pkg.slot} Slot</span>
              <span className="opacity-90">{getGameTypeLabel(pkg.gameType)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tartalom */}
      <div className="px-6 py-4 bg-white">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
        
        {pkg.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{pkg.description}</p>
        )}

        {/* Specifikációk */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">{pkg.slot}</div>
            <div className="text-xs text-gray-500 mt-1">Slot</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">{pkg.cpuCores}</div>
            <div className="text-xs text-gray-500 mt-1">vCore</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">{pkg.ram}</div>
            <div className="text-xs text-gray-500 mt-1">GB RAM</div>
          </div>
        </div>
      </div>
    </div>
  );
}

