'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { GamePackageCard } from './GamePackageCard';
import { GameType } from '@prisma/client';

interface GamePackage {
  id: string;
  gameType: GameType;
  name: string;
  nameHu?: string | null;
  nameEn?: string | null;
  description: string | null;
  descriptionHu?: string | null;
  descriptionEn?: string | null;
  price: number;
  currency: string;
  interval: string;
  image: string | null;
  slot: number | null;
  unlimitedSlot?: boolean;
  cpuCores: number;
  ram: number;
  unlimitedRam?: boolean;
  discountPrice: number | null;
  isActive: boolean;
  order: number;
}

interface GamePackageModalProps {
  packages: GamePackage[];
  gameType: GameType;
  gameName: string;
  locale: string;
  onSelect: (pkg: GamePackage) => void;
  onClose: () => void;
}

export function GamePackageModal({
  packages,
  gameType,
  gameName,
  locale,
  onSelect,
  onClose,
}: GamePackageModalProps) {
  const [selectedPackage, setSelectedPackage] = useState<GamePackage | null>(null);

  useEffect(() => {
    // ESC billentyű kezelése
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden'; // Scroll letiltása

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  const handleSelect = (pkg: GamePackage) => {
    setSelectedPackage(pkg);
    onSelect(pkg);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Háttér overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal tartalom */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Fejléc */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{gameName} - Csomag választás</h2>
            <p className="text-sm text-gray-600 mt-1">
              Válassz egy csomagot a {packages.length} elérhető közül
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            aria-label="Bezárás"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Csomagok listája */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <GamePackageCard
                key={pkg.id}
                package={pkg}
                locale={locale}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </div>

        {/* Lábléc */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Mégse
          </button>
        </div>
      </div>
    </div>
  );
}

