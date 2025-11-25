'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  Gamepad2, 
  Users, 
  Server, 
  Zap,
  Shield,
  Clock
} from 'lucide-react';

interface Game {
  id: string;
  name: string;
  description: string;
  icon: string;
  players: string;
  features: string[];
  popular: boolean;
  gameType: string;
}

const games: Game[] = [
  {
    id: 'ark',
    name: 'ARK: Survival Evolved',
    description: 'Dinosszauruszokkal teli túlélő játék, ahol építhetsz, vadászhatsz és harcolhatsz.',
    icon: '🦖',
    players: '10-100',
    features: ['Mod támogatás', 'Automatikus backup', 'DLC támogatás'],
    popular: true,
    gameType: 'ARK',
  },
  {
    id: 'minecraft',
    name: 'Minecraft',
    description: 'A világ legnépszerűbb sandbox játéka, végtelen lehetőségekkel.',
    icon: '🧱',
    players: '1-200',
    features: ['Plugin támogatás', 'Modpack telepítés', 'Vanilla & Modded'],
    popular: true,
    gameType: 'MINECRAFT',
  },
  {
    id: 'csgo',
    name: 'Counter-Strike: Global Offensive',
    description: 'Kompetitív FPS játék, tökéletes szerverekkel a versenyzéshez.',
    icon: '🎯',
    players: '10-64',
    features: ['SourceMod', 'Metamod', 'Competitive mode'],
    popular: true,
    gameType: 'CSGO',
  },
  {
    id: 'rust',
    name: 'Rust',
    description: 'Túlélő játék, ahol építhetsz, rabolhatsz és harcolhatsz más játékosokkal.',
    icon: '🦀',
    players: '50-200',
    features: ['Oxide plugin', 'Automatikus wipe', 'Performance tuning'],
    popular: false,
    gameType: 'RUST',
  },
  {
    id: 'valheim',
    name: 'Valheim',
    description: 'Viking túlélő játék, ahol építhetsz, felfedezhetsz és harcolhatsz.',
    icon: '⚔️',
    players: '2-10',
    features: ['Dedicated server', 'Mod támogatás', 'Crossplay'],
    popular: false,
    gameType: 'VALHEIM',
  },
  {
    id: '7days',
    name: '7 Days to Die',
    description: 'Zombi túlélő játék, ahol építhetsz erődítményeket és túléled az éjszakát.',
    icon: '🧟',
    players: '8-32',
    features: ['Mod támogatás', 'Custom maps', 'PvP & PvE'],
    popular: false,
    gameType: 'SEVEN_DAYS_TO_DIE',
  },
];

export function GameGrid({ locale }: { locale: string }) {
  const { data: session } = useSession();

  return (
    <div>
      {/* Popular Games */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Népszerű Játékok</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games
            .filter(game => game.popular)
            .map((game) => (
              <GameCard key={game.id} game={game} locale={locale} session={session} />
            ))}
        </div>
      </div>

      {/* All Games */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Összes Játék</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <GameCard key={game.id} game={game} locale={locale} session={session} />
          ))}
        </div>
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

function GameCard({ game, locale, session }: { game: Game; locale: string; session: any }) {
  return (
    <Card hover className="relative">
      {game.popular && (
        <div className="absolute top-4 right-4">
          <Badge variant="success" size="sm">Népszerű</Badge>
        </div>
      )}

      <div className="text-center mb-4">
        <div className="text-6xl mb-4">{game.icon}</div>
        <h3 className="text-xl font-bold mb-2 text-gray-900">{game.name}</h3>
        <p className="text-sm text-gray-600 mb-4">{game.description}</p>
      </div>

      <div className="space-y-2 mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="w-4 h-4" />
          <span>{game.players} játékos</span>
        </div>
        {game.features.map((feature, index) => (
          <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
            <Zap className="w-4 h-4 text-primary-600" />
            <span>{feature}</span>
          </div>
        ))}
      </div>

      <Link href={session ? `/${locale}/servers/new?game=${game.gameType}` : `/${locale}/register`}>
        <Button variant="primary" className="w-full" size="md">
          Szerver Rendelése
        </Button>
      </Link>
    </Card>
  );
}

