'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { GamePackageCard } from './GamePackageCard';
import { GamePackageModal } from './GamePackageModal';
import { GameType } from '@prisma/client';
import toast from 'react-hot-toast';

interface GamePackage {
  id: string;
  gameType: GameType;
  name: string;
  nameHu?: string | null;
  nameEn?: string | null;
  description: string | null;
  descriptionHu?: string | null;
  descriptionEn?: string | null;
  unlimitedSlot?: boolean;
  unlimitedRam?: boolean;
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

interface GamesSectionProps {
  locale: string;
}

interface GameGroup {
  gameType: GameType;
  gameName: string;
  packages: GamePackage[];
}

export function GamesSection({ locale }: GamesSectionProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [packages, setPackages] = useState<GamePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<GameGroup | null>(null);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await fetch('/api/game-packages');
        if (!response.ok) {
          throw new Error('Hiba a csomagok lekérése során');
        }
        const data = await response.json();
        setPackages(data.packages || []);
      } catch (error) {
        console.error('Error fetching packages:', error);
        toast.error('Hiba történt a csomagok betöltése során');
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

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

  // Csomagok csoportosítása játék típus szerint
  const gameGroups = packages.reduce((acc, pkg) => {
    const existing = acc.find((g) => g.gameType === pkg.gameType);
    if (existing) {
      existing.packages.push(pkg);
    } else {
      acc.push({
        gameType: pkg.gameType,
        gameName: getGameTypeLabel(pkg.gameType),
        packages: [pkg],
      });
    }
    return acc;
  }, [] as GameGroup[]);

  // Rendezés: több csomaggal rendelkező játékok előre
  gameGroups.sort((a, b) => {
    if (b.packages.length !== a.packages.length) {
      return b.packages.length - a.packages.length;
    }
    return a.gameName.localeCompare(b.gameName);
  });

  const handlePackageSelect = (pkg: GamePackage) => {
    if (!session) {
      router.push(`/${locale}/login?redirect=/${locale}/servers/new?package=${pkg.id}`);
      toast.error('Bejelentkezés szükséges');
      return;
    }

    // Átirányítás a szerver létrehozás oldalra
    router.push(`/${locale}/servers/new?package=${pkg.id}&gameType=${pkg.gameType}`);
  };

  const handleGameClick = (gameGroup: GameGroup) => {
    if (gameGroup.packages.length === 1) {
      // Ha csak egy csomag van, közvetlenül kiválasztjuk
      handlePackageSelect(gameGroup.packages[0]);
    } else {
      // Ha több csomag van, megnyitjuk a modal-t
      setSelectedGame(gameGroup);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-600">Csomagok betöltése...</p>
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-600">Jelenleg nincs elérhető csomag</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {gameGroups.map((gameGroup) => {
          // Ha csak egy csomag van, azt jelenítjük meg
          if (gameGroup.packages.length === 1) {
            return (
              <GamePackageCard
                key={gameGroup.packages[0].id}
                package={gameGroup.packages[0]}
                locale={locale}
                onSelect={() => handlePackageSelect(gameGroup.packages[0])}
              />
            );
          }

          // Ha több csomag van, az elsőt jelenítjük meg preview-ként
          const previewPackage = gameGroup.packages[0];
          return (
            <div key={gameGroup.gameType} onClick={() => handleGameClick(gameGroup)}>
              <GamePackageCard
                package={previewPackage}
                locale={locale}
                onSelect={() => handleGameClick(gameGroup)}
              />
              {/* Több csomag jelző */}
              <div className="mt-2 text-center">
                <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                  +{gameGroup.packages.length - 1} további csomag
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal több csomag esetén */}
      {selectedGame && (
        <GamePackageModal
          packages={selectedGame.packages}
          gameType={selectedGame.gameType}
          gameName={selectedGame.gameName}
          locale={locale}
          onSelect={handlePackageSelect}
          onClose={() => setSelectedGame(null)}
        />
      )}
    </>
  );
}

