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
}

export function GameGrid({ games, locale }: GameGridProps) {
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
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {games.map((game) => {
          const gameLink = `/${locale}/servers/new?gameType=${game.slug.toUpperCase()}`;
          const gameImage = game.image || '/images/games/default.jpg';

          return (
            <Card key={game.id} className="relative overflow-hidden group" hover>
              {game.category && (
                <Badge
                  variant="outline"
                  className="absolute top-3 left-3 z-10"
                  style={game.category.color ? { borderColor: game.category.color, color: game.category.color } : {}}
                >
                  {game.category.name}
                </Badge>
              )}
              <div className="relative w-full h-48 overflow-hidden rounded-t-lg bg-gray-200">
                <Image
                  src={gameImage}
                  alt={game.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2 text-gray-900">{game.name}</h3>
                {game.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {game.description}
                  </p>
                )}
                <Link href={session ? gameLink : `/${locale}/register`}>
                  <Button className="w-full">Szerver rendelés</Button>
                </Link>
              </div>
            </Card>
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

