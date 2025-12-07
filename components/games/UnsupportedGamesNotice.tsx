'use client';

import { AlertCircle, Info } from 'lucide-react';

export function UnsupportedGamesNotice() {
  return (
    <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-yellow-900 mb-1">
            ⚠️ Sons of the Forest - Jelenleg nem támogatott
          </h3>
          <p className="text-sm text-yellow-800 mb-2">
            A Sons of the Forest dedikált szerver jelenleg nem elérhető a SteamCMD-n keresztül. 
            Valve még nem publikálta ezt a szerverszoftvert nyilvános telepítéshez.
          </p>
          <div className="flex flex-wrap gap-3 mt-3">
            <a 
              href="#alternatives"
              className="text-sm text-yellow-700 hover:text-yellow-900 font-medium underline"
            >
              Alternatívák megtekintése →
            </a>
            <a 
              href="/docs/SONS_OF_THE_FOREST_UNSUPPORTED"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-yellow-700 hover:text-yellow-900 font-medium underline"
            >
              Teljes információ →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AlternativeGamesSection() {
  const alternatives = [
    {
      name: 'Rust',
      appId: '258550',
      players: '1-250+',
      description: 'Hardcore survival game with base building',
    },
    {
      name: 'ARK: Survival Evolved',
      appId: '376030',
      players: '1-70',
      description: 'Dinosaur survival game with extensive gameplay',
    },
    {
      name: 'Valheim',
      appId: '896660',
      players: '1-10',
      description: 'Norse mythology survival with base building',
    },
    {
      name: 'Minecraft',
      appId: 'N/A',
      players: '1-100+',
      description: 'Creative sandbox with infinite possibilities',
    },
  ];

  return (
    <div id="alternatives" className="mt-8">
      <h3 className="text-xl font-bold mb-4 text-gray-900">
        Ajánlott alternatívák (teljes támogatás):
      </h3>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {alternatives.map((game) => (
          <div 
            key={game.appId}
            className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition"
          >
            <h4 className="font-semibold text-gray-900 mb-2">{game.name}</h4>
            <p className="text-sm text-gray-600 mb-3">{game.description}</p>
            <div className="text-xs text-gray-500 space-y-1">
              <p><span className="font-medium">Játékosok:</span> {game.players}</p>
              <p><span className="font-medium">AppID:</span> {game.appId}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
