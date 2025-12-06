/**
 * Rust Mods Dashboard Page
 * /servers/[id]/mods - Rust mod marketplace oldal egy szerverhez
 */

'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import RustModStore from '@/components/games/RustModStore';
import { Loading } from '@/components/Loading';

interface Server {
  id: string;
  name: string;
  gameType: string;
  status: string;
}

export default function RustModsPage() {
  const params = useParams();
  const serverId = params?.id as string;
  const [server, setServer] = useState<Server | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchServer() {
      try {
        const response = await fetch(`/api/servers/${serverId}`);
        if (!response.ok) throw new Error('Szerver nem található');
        
        const data = await response.json();
        if (data.gameType !== 'RUST') {
          setError('Ez az oldal csak Rust szerverekhez elérhető');
        } else {
          setServer(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Hiba a szerver betöltésekor');
      } finally {
        setLoading(false);
      }
    }

    if (serverId) {
      fetchServer();
    }
  }, [serverId]);

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="bg-red-900/30 border border-red-500 rounded-lg p-6 text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-2">Hiba</h1>
          <p className="text-gray-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!server) return <Loading />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎮 Rust Mod Marketplace</h1>
          <p className="text-gray-400">Szerver: <span className="text-orange-400 font-semibold">{server.name}</span></p>
          <p className="text-sm text-gray-500 mt-2">
            📌 Egy kattintással telepítsd a modokat a szerveredre
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-8">
          <div className="flex items-start gap-3">
            <span className="text-2xl">ℹ️</span>
            <div>
              <h3 className="text-blue-300 font-semibold mb-1">Oxide Framework szükséges</h3>
              <p className="text-sm text-gray-300">
                Bizonyosítsd meg, hogy az Oxide framework telepített a szerveren. 
                Nélküle a modulok nem fognak működni.
              </p>
            </div>
          </div>
        </div>

        {/* Mod Store Component */}
        <RustModStore serverId={serverId} serverName={server.name} />
      </div>
    </div>
  );
}
