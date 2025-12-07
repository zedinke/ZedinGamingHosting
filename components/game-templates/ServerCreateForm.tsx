'use client';

import React, { useState } from 'react';
import { GameTemplate, GameTemplateType } from '@/lib/game-templates/types';
import { TemplateSelector } from './TemplateSelector';
import { DeploymentProgress } from './DeploymentProgress';

interface ServerCreateFormProps {
  userId: string;
  onSuccess?: (serverId: string) => void;
  onError?: (error: string) => void;
}

type FormStep = 'template-select' | 'server-config' | 'deploying' | 'complete';

interface ServerConfig {
  serverName: string;
  adminPassword?: string;
  maxPlayers?: number;
  customConfig?: Record<string, any>;
}

/**
 * Server Create Form Component
 * Szerver létrehozása új template rendszerrel
 */
export function ServerCreateForm({ userId, onSuccess, onError }: ServerCreateFormProps) {
  const [step, setStep] = useState<FormStep>('template-select');
  const [selectedTemplate, setSelectedTemplate] = useState<GameTemplate | null>(null);
  const [deploySessionId, setDeploySessionId] = useState<string | null>(null);
  const [deployedServerId, setDeployedServerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Server config
  const [config, setConfig] = useState<ServerConfig>({
    serverName: `My Gaming Server`,
    adminPassword: 'admin123456',
    maxPlayers: 32,
  });

  // Template kiválasztása
  const handleSelectTemplate = (template: GameTemplate) => {
    setSelectedTemplate(template);
    setError(null);
  };

  // Template kiválasztás után config lépésre
  const handleContinueToConfig = () => {
    if (!selectedTemplate) {
      setError('Válassz egy template-et');
      return;
    }
    setStep('server-config');
  };

  // Szerver deployment indítása
  const handleStartDeploy = async () => {
    if (!selectedTemplate || !config.serverName) {
      setError('Tölts ki minden szükséges mezőt');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Deploy API call
      const response = await fetch('/api/templates/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId: `server-${Date.now()}`, // Temp ID, majd lesz az API-tól
          templateId: selectedTemplate.id,
          serverName: config.serverName,
          customConfig: {
            adminPassword: config.adminPassword,
            maxPlayers: config.maxPlayers,
            ...config.customConfig,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Deployment hiba');
      }

      const data = await response.json();

      if (data.success) {
        setDeploySessionId(data.sessionId);
        setDeployedServerId(data.serverId || `server-${Date.now()}`);
        setStep('deploying');
      } else {
        throw new Error(data.error || 'Deployment sikertelen');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ismeretlen hiba';
      setError(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  // Deployment befejezése
  const handleDeploymentComplete = () => {
    setStep('complete');
    onSuccess?.(deployedServerId || '');
  };

  // Template kiválasztó lépés
  if (step === 'template-select') {
    return (
      <div className="space-y-6 p-6 bg-white rounded-lg border border-gray-200">
        <div>
          <h2 className="text-2xl font-bold mb-2">🎮 Új Szerver Létrehozása</h2>
          <p className="text-gray-600">Válassz egy template-et és konfigurálj egy szervert</p>
        </div>

        <TemplateSelector onSelect={handleSelectTemplate} />

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">❌ {error}</p>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={handleContinueToConfig}
            disabled={!selectedTemplate}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
          >
            Tovább a konfigurációhoz →
          </button>
        </div>
      </div>
    );
  }

  // Server konfiguráció lépés
  if (step === 'server-config') {
    return (
      <div className="space-y-6 p-6 bg-white rounded-lg border border-gray-200">
        <div>
          <h2 className="text-2xl font-bold mb-2">⚙️ Szerver Konfiguráció</h2>
          <p className="text-gray-600">
            Template: <span className="font-medium">{selectedTemplate?.name}</span>
          </p>
        </div>

        <div className="space-y-4">
          {/* Szerver neve */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🏷️ Szerver Neve
            </label>
            <input
              type="text"
              value={config.serverName}
              onChange={(e) => setConfig({ ...config, serverName: e.target.value })}
              placeholder="Pl: My Epic Rust Server"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Admin jelszó */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🔐 Admin Jelszó
            </label>
            <input
              type="password"
              value={config.adminPassword || ''}
              onChange={(e) => setConfig({ ...config, adminPassword: e.target.value })}
              placeholder="Erős jelszó"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Legalább 8 karakter ajánlott</p>
          </div>

          {/* Max játékosok */}
          {selectedTemplate?.metadata.maxPlayers && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                👥 Max Játékosok
              </label>
              <input
                type="number"
                value={config.maxPlayers || 32}
                onChange={(e) => setConfig({ ...config, maxPlayers: parseInt(e.target.value) })}
                min="1"
                max={selectedTemplate.metadata.maxPlayers}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum: {selectedTemplate.metadata.maxPlayers}
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">❌ {error}</p>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={() => setStep('template-select')}
            className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 font-medium transition"
          >
            ← Vissza
          </button>
          <button
            onClick={handleStartDeploy}
            disabled={loading || !config.serverName}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
          >
            {loading ? '⏳ Indítás...' : '🚀 Deployment Indítása'}
          </button>
        </div>
      </div>
    );
  }

  // Deployment progress lépés
  if (step === 'deploying' && deploySessionId && deployedServerId) {
    return (
      <DeploymentProgress
        sessionId={deploySessionId}
        serverId={deployedServerId}
        templateId={selectedTemplate?.id || ''}
        onComplete={handleDeploymentComplete}
        onError={(err) => {
          setError(err);
          onError?.(err);
        }}
      />
    );
  }

  // Sikeres befejezés
  if (step === 'complete') {
    return (
      <div className="space-y-6 p-6 bg-green-50 rounded-lg border border-green-200">
        <div className="text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">Szerver Sikeresen Létrehozva!</h2>
          <p className="text-green-700">
            A szerver mostantól elérhető és használatra kész.
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-green-200 space-y-2">
          <p className="text-sm">
            <span className="font-semibold">Template:</span> {selectedTemplate?.name}
          </p>
          <p className="text-sm">
            <span className="font-semibold">Szerver:</span> {config.serverName}
          </p>
          <p className="text-sm">
            <span className="font-semibold">Server ID:</span>{' '}
            <code className="bg-gray-100 px-2 py-1 rounded text-xs">{deployedServerId}</code>
          </p>
        </div>

        <button
          onClick={() => onSuccess?.(deployedServerId || '')}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 font-medium transition"
        >
          ✓ Rendben
        </button>
      </div>
    );
  }

  return null;
}

export default ServerCreateForm;
