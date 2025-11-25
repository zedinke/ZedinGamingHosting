'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

interface Game {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  categoryId: string | null;
  isActive: boolean;
  order: number;
  locale: string;
  category: {
    id: string;
    name: string;
    color: string | null;
  } | null;
}

interface GameCategory {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

interface GamesManagementProps {
  games: Game[];
  categories: GameCategory[];
  locale: string;
}

export function GamesManagement({ games, categories, locale }: GamesManagementProps) {
  return (
    <div className="space-y-6">
      {/* Kategóriák */}
      <div>
        <h2 className="text-xl font-bold mb-4">Kategóriák</h2>
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/${locale}/admin/cms/games?categoryId=${category.id}`}
            >
              <Badge
                variant="outline"
                style={category.color ? { borderColor: category.color, color: category.color } : {}}
              >
                {category.name}
              </Badge>
            </Link>
          ))}
        </div>
      </div>

      {/* Játékok */}
      <div>
        <h2 className="text-xl font-bold mb-4">Játékok</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <Card key={game.id} className={!game.isActive ? 'opacity-60' : ''} hover>
              {game.image && (
                <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden bg-gray-200">
                  <Image
                    src={game.image}
                    alt={game.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg">{game.name}</h3>
                  {game.category && (
                    <Badge
                      variant="outline"
                      size="sm"
                      style={game.category.color ? { borderColor: game.category.color, color: game.category.color } : {}}
                    >
                      {game.category.name}
                    </Badge>
                  )}
                </div>
                {game.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{game.description}</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Badge variant={game.isActive ? 'success' : 'default'} size="sm">
                    {game.isActive ? 'Aktív' : 'Inaktív'}
                  </Badge>
                  <span className="text-xs text-gray-500">#{game.order}</span>
                </div>
                <Link
                  href={`/${locale}/admin/cms/games/${game.id}`}
                  className="text-primary-600 hover:underline text-sm"
                >
                  Szerkesztés
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {games.length === 0 && (
        <Card className="text-center py-12">
          <p className="text-gray-600">Még nincs játék</p>
        </Card>
      )}
    </div>
  );
}

