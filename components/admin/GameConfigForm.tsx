'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { GameType } from '@prisma/client';

const gameConfigSchema = z.object({
  gameType: z.string().min(1, 'Játék típus megadása kötelező'),
  displayName: z.string().min(1, 'Megjelenített név megadása kötelező'),
  isActive: z.boolean(),
  isVisible: z.boolean(),
  steamAppId: z.string().optional().or(z.literal('')),
  installScript: z.string().optional().or(z.literal('')),
  requiresSteamCMD: z.boolean(),
  requiresJava: z.boolean(),
  requiresWine: z.boolean(),
  startCommand: z.string().optional().or(z.literal('')),
  startCommandWindows: z.string().optional().or(z.literal('')),
  stopCommand: z.string().optional().or(z.literal('')),
  configPath: z.string().optional().or(z.literal('')),
  defaultPort: z.string().optional().or(z.literal('')),
  queryPort: z.string().optional().or(z.literal('')),
  defaultCpuCores: z.string().min(1, 'CPU magok megadása kötelező'),
  defaultRamGB: z.string().min(1, 'RAM megadása kötelező'),
  defaultDiskGB: z.string().min(1, 'Disk megadása kötelező'),
  description: z.string().optional().or(z.literal('')),
  image: z.string().optional().or(z.literal('')),
  order: z.string().min(0),
});

type GameConfigFormData = z.infer<typeof gameConfigSchema>;

interface GameConfig {
  id: string;
  gameType: GameType;
  displayName: string;
  isActive: boolean;
  isVisible: boolean;
  steamAppId: number | null;
  installScript: string | null;
  requiresSteamCMD: boolean;
  requiresJava: boolean;
  requiresWine: boolean;
  startCommand: string | null;
  startCommandWindows: string | null;
  stopCommand: string | null;
  configPath: string | null;
  defaultPort: number | null;
  queryPort: number | null;
  defaultCpuCores: number;
  defaultRamGB: number;
  defaultDiskGB: number;
  description: string | null;
  image: string | null;
  order: number;
}

interface GameConfigFormProps {
  locale: string;
  gameConfig?: GameConfig;
}

// GameType enum értékek
const GAME_TYPES: GameType[] = [
  'MINECRAFT',
  'RUST',
  'ARK_EVOLVED',
  'ARK_ASCENDED',
  'VALHEIM',
  'SEVEN_DAYS_TO_DIE',
  'CONAN_EXILES',
  'DAYZ',
  'PROJECT_ZOMBOID',
  'PALWORLD',
  'ENSHROUDED',
  'SONS_OF_THE_FOREST',
  'THE_FOREST',
  'GROUNDED',
  'V_RISING',
  'DONT_STARVE_TOGETHER',
  'CS2',
  'CSGO',
  'LEFT_4_DEAD_2',
  'KILLING_FLOOR_2',
  'INSURGENCY_SANDSTORM',
  'SQUAD',
  'HELL_LET_LOOSE',
  'POST_SCRIPTUM',
  'ARMA_3',
  'TERRARIA',
  'STARBOUND',
  'FACTORIO',
  'SATISFACTORY',
  'SPACE_ENGINEERS',
  'GARRYS_MOD',
  'UNTURNED',
  'DOTA_2',
  'OTHER',
];

const getGameTypeLabel = (gameType: GameType): string => {
  const labels: Record<string, string> = {
    MINECRAFT: 'Minecraft',
    RUST: 'Rust',
    ARK_EVOLVED: 'ARK: Survival Evolved',
    ARK_ASCENDED: 'ARK: Survival Ascended',
    VALHEIM: 'Valheim',
    SEVEN_DAYS_TO_DIE: '7 Days to Die',
    CONAN_EXILES: 'Conan Exiles',
    DAYZ: 'DayZ',
    PROJECT_ZOMBOID: 'Project Zomboid',
    PALWORLD: 'Palworld',
    ENSHROUDED: 'Enshrouded',
    SONS_OF_THE_FOREST: 'Sons of the Forest',
    THE_FOREST: 'The Forest',
    GROUNDED: 'Grounded',
    V_RISING: 'V Rising',
    DONT_STARVE_TOGETHER: "Don't Starve Together",
    CS2: 'Counter-Strike 2',
    CSGO: 'Counter-Strike: Global Offensive',
    LEFT_4_DEAD_2: 'Left 4 Dead 2',
    KILLING_FLOOR_2: 'Killing Floor 2',
    INSURGENCY_SANDSTORM: 'Insurgency: Sandstorm',
    SQUAD: 'Squad',
    HELL_LET_LOOSE: 'Hell Let Loose',
    POST_SCRIPTUM: 'Post Scriptum',
    ARMA_3: 'Arma 3',
    TERRARIA: 'Terraria',
    STARBOUND: 'Starbound',
    FACTORIO: 'Factorio',
    SATISFACTORY: 'Satisfactory',
    SPACE_ENGINEERS: 'Space Engineers',
    GARRYS_MOD: "Garry's Mod",
    UNTURNED: 'Unturned',
    DOTA_2: 'Dota 2',
    OTHER: 'Egyéb',
  };
  return labels[gameType] || gameType;
};

export function GameConfigForm({ locale, gameConfig }: GameConfigFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [usedGameTypes, setUsedGameTypes] = useState<GameType[]>([]);

  useEffect(() => {
    // Betöltjük a már használt játék típusokat
    fetch('/api/admin/games')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const used = data.gameConfigs
            .filter((gc: GameConfig) => gc.id !== gameConfig?.id)
            .map((gc: GameConfig) => gc.gameType);
          setUsedGameTypes(used);
        }
      })
      .catch(console.error);
  }, [gameConfig?.id]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<GameConfigFormData>({
    resolver: zodResolver(gameConfigSchema),
    defaultValues: gameConfig
      ? {
          gameType: gameConfig.gameType,
          displayName: gameConfig.displayName,
          isActive: gameConfig.isActive,
          isVisible: gameConfig.isVisible,
          steamAppId: gameConfig.steamAppId?.toString() || '',
          installScript: gameConfig.installScript || '',
          requiresSteamCMD: gameConfig.requiresSteamCMD,
          requiresJava: gameConfig.requiresJava,
          requiresWine: gameConfig.requiresWine,
          startCommand: gameConfig.startCommand || '',
          startCommandWindows: gameConfig.startCommandWindows || '',
          stopCommand: gameConfig.stopCommand || '',
          configPath: gameConfig.configPath || '',
          defaultPort: gameConfig.defaultPort?.toString() || '',
          queryPort: gameConfig.queryPort?.toString() || '',
          defaultCpuCores: gameConfig.defaultCpuCores.toString(),
          defaultRamGB: gameConfig.defaultRamGB.toString(),
          defaultDiskGB: gameConfig.defaultDiskGB.toString(),
          description: gameConfig.description || '',
          image: gameConfig.image || '',
          order: gameConfig.order.toString(),
        }
      : {
          gameType: '',
          displayName: '',
          isActive: true,
          isVisible: true,
          steamAppId: '',
          installScript: '',
          requiresSteamCMD: false,
          requiresJava: false,
          requiresWine: false,
          startCommand: '',
          startCommandWindows: '',
          stopCommand: '',
          configPath: '',
          defaultPort: '',
          queryPort: '',
          defaultCpuCores: '1',
          defaultRamGB: '2',
          defaultDiskGB: '5',
          description: '',
          image: '',
          order: '0',
        },
  });

  const onSubmit = async (data: GameConfigFormData) => {
    setIsLoading(true);
    try {
      const payload = {
        gameType: data.gameType,
        displayName: data.displayName.trim(),
        isActive: data.isActive,
        isVisible: data.isVisible,
        steamAppId: data.steamAppId && data.steamAppId.trim() !== '' ? data.steamAppId : null,
        installScript: data.installScript && data.installScript.trim() !== '' ? data.installScript : null,
        requiresSteamCMD: data.requiresSteamCMD,
        requiresJava: data.requiresJava,
        requiresWine: data.requiresWine,
        startCommand: data.startCommand && data.startCommand.trim() !== '' ? data.startCommand : null,
        startCommandWindows: data.startCommandWindows && data.startCommandWindows.trim() !== '' ? data.startCommandWindows : null,
        stopCommand: data.stopCommand && data.stopCommand.trim() !== '' ? data.stopCommand : null,
        configPath: data.configPath && data.configPath.trim() !== '' ? data.configPath : null,
        defaultPort: data.defaultPort && data.defaultPort.trim() !== '' ? data.defaultPort : null,
        queryPort: data.queryPort && data.queryPort.trim() !== '' ? data.queryPort : null,
        defaultCpuCores: data.defaultCpuCores,
        defaultRamGB: data.defaultRamGB,
        defaultDiskGB: data.defaultDiskGB,
        description: data.description && data.description.trim() !== '' ? data.description : null,
        image: data.image && data.image.trim() !== '' ? data.image : null,
        order: data.order,
      };

      const url = gameConfig ? `/api/admin/games/${gameConfig.id}` : '/api/admin/games';
      const method = gameConfig ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Hiba történt');
        console.error('API Error:', result);
        return;
      }

      toast.success(gameConfig ? 'Játék konfiguráció frissítve' : 'Játék konfiguráció létrehozva');
      router.push(`/${locale}/admin/games`);
      router.refresh();
    } catch (error) {
      toast.error('Hiba történt');
    } finally {
      setIsLoading(false);
    }
  };

  const availableGameTypes = GAME_TYPES.filter((gt) => !usedGameTypes.includes(gt) || gameConfig?.gameType === gt);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card padding="lg">
        <h2 className="text-xl font-bold mb-4">Alapinformációk</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Játék Típus *
            </label>
            <select
              {...register('gameType')}
              disabled={!!gameConfig}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Válassz játék típust...</option>
              {availableGameTypes.map((gameType) => (
                <option key={gameType} value={gameType}>
                  {getGameTypeLabel(gameType)}
                </option>
              ))}
            </select>
            {errors.gameType && (
              <p className="text-red-500 text-sm mt-1">{errors.gameType.message}</p>
            )}
            {gameConfig && (
              <p className="text-xs text-gray-500 mt-1">
                A játék típus nem módosítható szerkesztéskor
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Megjelenített Név *
            </label>
            <input
              {...register('displayName')}
              type="text"
              placeholder="Pl: Satisfactory Dedicated Server"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
            />
            {errors.displayName && (
              <p className="text-red-500 text-sm mt-1">{errors.displayName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Leírás</label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Kép URL</label>
            <input
              {...register('image')}
              type="url"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
            />
            {watch('image') && (
              <img
                src={watch('image')}
                alt="Preview"
                className="mt-2 w-full max-w-md rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Sorrend</label>
            <input
              {...register('order')}
              type="number"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
            />
          </div>

          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <input
                {...register('isActive')}
                type="checkbox"
                id="isActive"
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <label htmlFor="isActive" className="text-sm font-semibold text-gray-900">
                Aktív
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                {...register('isVisible')}
                type="checkbox"
                id="isVisible"
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <label htmlFor="isVisible" className="text-sm font-semibold text-gray-900">
                Látható a játékok listájában
              </label>
            </div>
          </div>
        </div>
      </Card>

      <Card padding="lg">
        <h2 className="text-xl font-bold mb-4">Telepítési Paraméterek</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Steam App ID
            </label>
            <input
              {...register('steamAppId')}
              type="number"
              placeholder="Pl: 1690800 (Satisfactory)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Steam App ID, ha SteamCMD-t használunk (pl. Satisfactory: 1690800)
            </p>
          </div>

          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <input
                {...register('requiresSteamCMD')}
                type="checkbox"
                id="requiresSteamCMD"
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <label htmlFor="requiresSteamCMD" className="text-sm font-semibold text-gray-900">
                SteamCMD szükséges
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                {...register('requiresJava')}
                type="checkbox"
                id="requiresJava"
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <label htmlFor="requiresJava" className="text-sm font-semibold text-gray-900">
                Java szükséges
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                {...register('requiresWine')}
                type="checkbox"
                id="requiresWine"
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <label htmlFor="requiresWine" className="text-sm font-semibold text-gray-900">
                Wine szükséges
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Telepítési Script
            </label>
            <textarea
              {...register('installScript')}
              rows={10}
              placeholder="#!/bin/bash&#10;set -e&#10;# Telepítési script..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Bash script a játék telepítéséhez. Használhatsz placeholder-eket: {'{serverId}'}, {'{port}'}, stb.
            </p>
          </div>
        </div>
      </Card>

      <Card padding="lg">
        <h2 className="text-xl font-bold mb-4">Indítási Paraméterek</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Indítási Parancs (Linux)
            </label>
            <textarea
              {...register('startCommand')}
              rows={3}
              placeholder="cd FactoryGame/Binaries/Linux && ./FactoryGameServer -log -unattended"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Parancs a szerver indításához. Használhatsz placeholder-eket: {'{port}'}, {'{maxPlayers}'}, stb.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Indítási Parancs (Windows/Wine)
            </label>
            <textarea
              {...register('startCommandWindows')}
              rows={3}
              placeholder="xvfb-run wine ./Server.exe -port {port}"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Opcionális: Windows bináris indítása Wine-on keresztül
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Leállítási Parancs
            </label>
            <input
              {...register('stopCommand')}
              type="text"
              placeholder="quit"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Konfigurációs Fájl Elérési Út
            </label>
            <input
              {...register('configPath')}
              type="text"
              placeholder="/opt/servers/{serverId}/FactoryGame/Saved/Config/LinuxServer/GameUserSettings.ini"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Használhatsz {'{serverId}'} placeholder-t
            </p>
          </div>
        </div>
      </Card>

      <Card padding="lg">
        <h2 className="text-xl font-bold mb-4">Portok és Erőforrások</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Alapértelmezett Port
            </label>
            <input
              {...register('defaultPort')}
              type="number"
              placeholder="15777"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Query Port
            </label>
            <input
              {...register('queryPort')}
              type="number"
              placeholder="7777"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Alapértelmezett CPU Magok *
            </label>
            <input
              {...register('defaultCpuCores')}
              type="number"
              min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
            />
            {errors.defaultCpuCores && (
              <p className="text-red-500 text-sm mt-1">{errors.defaultCpuCores.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Alapértelmezett RAM (GB) *
            </label>
            <input
              {...register('defaultRamGB')}
              type="number"
              min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
            />
            {errors.defaultRamGB && (
              <p className="text-red-500 text-sm mt-1">{errors.defaultRamGB.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Alapértelmezett Disk (GB) *
            </label>
            <input
              {...register('defaultDiskGB')}
              type="number"
              min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white placeholder:text-gray-500"
            />
            {errors.defaultDiskGB && (
              <p className="text-red-500 text-sm mt-1">{errors.defaultDiskGB.message}</p>
            )}
          </div>
        </div>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" isLoading={isLoading} size="lg">
          {gameConfig ? 'Frissítés' : 'Létrehozás'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          size="lg"
        >
          Mégse
        </Button>
      </div>
    </form>
  );
}

