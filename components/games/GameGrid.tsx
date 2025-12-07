'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface Game {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  category?: {
    id: string;
    name: string;
    color: string | null;
  } | null;
}

interface GameGridProps {
  games: Game[];
  locale: string;
  unsupportedGames?: string[];
}

export function GameGrid({ games, locale, unsupportedGames = [] }: GameGridProps) {
  const { data: session } = useSession();

  if (games.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">Jelenleg nincs elérhető játék</p>
        <Link href={session ? `/${locale}/dashboard/support/new` : `/${locale}/register`}>
          <Button variant="outline">Kapcsolatfelvétel</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {games.map((game) => {
          const isUnsupported = unsupportedGames.includes(game.slug.toUpperCase());
          const gameLink = `/${locale}/servers/new?gameType=${game.slug.toUpperCase()}`;
          const gameImage = game.image || '/images/games/default.jpg';

          return (
            <div
              key={game.id}
              className="group block"
            >
              <div className={`relative overflow-hidden rounded-lg border transition-all duration-300 ${
                isUnsupported 
                  ? 'bg-gray-100 border-gray-300 opacity-70 cursor-not-allowed' 
                  : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-lg'
              }`}>
                {game.category && (
                  <Badge
                    variant="outline"
                    className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-sm"
                    style={game.category.color ? { borderColor: game.category.color, color: game.category.color } : {}}
                  >
                    {game.category.name}
                  </Badge>
                )}
                
                {isUnsupported && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
                    <div className="text-center">
                      <div className="text-3xl mb-2">⚠️</div>
                      <p className="text-white font-semibold text-sm px-2">Jelenleg nem támogatott</p>
                    </div>
                  </div>
                )}

                <div className="relative w-full h-48 overflow-hidden bg-gray-100">
                  <Image
                    src={gameImage}
                    alt={game.name}
                    fill
                    className={`object-cover transition-transform duration-300 ${!isUnsupported && 'group-hover:scale-110'}`}
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 group-hover:text-primary-600 transition-colors">
                    {game.name}
                  </h3>
                  {game.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {game.description}
                    </p>
                  )}
                  <div className="text-sm font-medium">
                    {isUnsupported ? (
                      <Link href={`/${locale}/docs/SONS_OF_THE_FOREST_UNSUPPORTED`} className="text-red-600 hover:text-red-700">
                        Tudj meg többet →
                      </Link>
                    ) : (
                      <Link 
                        href={session ? gameLink : `/${locale}/register`}
                        className="text-primary-600 group-hover:text-primary-700"
                      >
                        Szerver létrehozása →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA Section */}
      <div className="mt-16 text-center">
        <Card className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white" padding="lg">
          <h3 className="text-2xl font-bold mb-4">Nem találod a játékodat?</h3>
          <p className="text-primary-100 mb-6">
            Lépj velünk kapcsolatba, és segítünk beállítani bármilyen játék szervert!
          </p>
          <Link href={session ? `/${locale}/dashboard/support/new` : `/${locale}/register`}>
            <Button variant="secondary" size="lg" className="bg-white text-primary-600 hover:bg-gray-100">
              Kapcsolatfelvétel
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}

