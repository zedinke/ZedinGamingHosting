'use client';

import { useState } from 'react';
import { GameType } from '@prisma/client';

interface PremiumPackageGame {
  gameType: GameType;
  displayName: string;
  image: string | null;
  videoUrl: string | null;
  description: string | null;
}

interface PremiumPackage {
  id: string;
  nameHu: string;
  nameEn: string;
  descriptionHu: string | null;
  descriptionEn: string | null;
  price: number;
  currency: string;
  interval: string;
  discountPrice: number | null;
  image: string | null;
  videoUrl: string | null;
  cpuCores: number;
  ram: number;
  games: PremiumPackageGame[];
}

interface PremiumPackageCardProps {
  package: PremiumPackage;
  locale: string;
  onSelect?: (pkg: PremiumPackage) => void;
}

export function PremiumPackageCard({ package: pkg, locale, onSelect }: PremiumPackageCardProps) {
  const [expanded, setExpanded] = useState(false);

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getName = () => {
    return locale === 'hu' ? pkg.nameHu : pkg.nameEn;
  };

  const getDescription = () => {
    return locale === 'hu' ? pkg.descriptionHu : pkg.descriptionEn;
  };

  return (
    <div
      className="relative bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl group"
      onClick={() => onSelect?.(pkg)}
    >
      {/* Fő kép vagy videó */}
      <div className="relative h-64 bg-gradient-to-br from-gray-100 to-gray-200">
        {/* Videó vagy kép */}
        {pkg.videoUrl ? (
          <div className="absolute inset-0 w-full h-full">
            <iframe
              src={pkg.videoUrl.replace('watch?v=', 'embed/')}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : pkg.image ? (
          <img
            src={pkg.image}
            alt={getName()}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        ) : (
          <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
            <span className="text-4xl font-bold text-primary-600">⭐</span>
          </div>
        )}

        {/* Akció badge */}
        {pkg.discountPrice && (
          <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg z-10">
            Akció
          </div>
        )}

        {/* Premium badge */}
        <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg z-10">
          ⭐ Premium
        </div>

        {/* Sötétített alsó rész */}
        <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-t from-black/80 via-black/70 to-transparent flex items-end">
          <div className="px-6 pb-4 text-white w-full">
            {/* Ár */}
            <div className="mb-3">
              {pkg.discountPrice ? (
                <div>
                  <div className="text-2xl font-bold">
                    {formatPrice(pkg.discountPrice, pkg.currency)}
                    <span className="text-sm font-normal opacity-80">
                      /{pkg.interval === 'month' ? (locale === 'hu' ? 'hó' : 'mo') : (locale === 'hu' ? 'év' : 'yr')}
                    </span>
                  </div>
                  <div className="text-sm line-through opacity-60">
                    {formatPrice(pkg.price, pkg.currency)}
                  </div>
                </div>
              ) : (
                <div className="text-2xl font-bold">
                  {formatPrice(pkg.price, pkg.currency)}
                  <span className="text-sm font-normal opacity-80">
                    /{pkg.interval === 'month' ? (locale === 'hu' ? 'hó' : 'mo') : (locale === 'hu' ? 'év' : 'yr')}
                  </span>
                </div>
              )}
            </div>

            {/* Játékok száma */}
            <div className="flex items-center justify-between text-sm font-medium">
              <span>{pkg.games.length} {locale === 'hu' ? 'Játék' : 'Games'}</span>
              <span className="opacity-90">{getName()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tartalom */}
      <div className="px-6 py-4 bg-white">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{getName()}</h3>

        {getDescription() && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{getDescription()}</p>
        )}

        {/* Játékok előnézet */}
        <div className="mb-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {pkg.games.slice(0, expanded ? pkg.games.length : 4).map((game, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200"
              >
                {game.image ? (
                  <img
                    src={game.image}
                    alt={game.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                    <span className="text-xs font-bold text-gray-600">
                      {game.displayName.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
            ))}
            {pkg.games.length > 4 && !expanded && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(true);
                }}
                className="flex-shrink-0 w-16 h-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors"
              >
                +{pkg.games.length - 4}
              </button>
            )}
          </div>
          {pkg.games.length > 4 && expanded && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(false);
              }}
              className="text-xs text-primary-600 hover:underline mt-2"
            >
              {locale === 'hu' ? 'Kevesebb' : 'Show less'}
            </button>
          )}
        </div>

        {/* Specifikációk */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">{pkg.cpuCores}</div>
            <div className="text-xs text-gray-500 mt-1">vCore</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">{pkg.ram}</div>
            <div className="text-xs text-gray-500 mt-1">GB RAM</div>
          </div>
        </div>

        {/* Játékok listája (expandable) */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              {locale === 'hu' ? 'Tartalmazza:' : 'Includes:'}
            </h4>
            <div className="space-y-2">
              {pkg.games.map((game, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <span className="text-green-600">✓</span>
                  <span className="text-gray-700">{game.displayName}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

