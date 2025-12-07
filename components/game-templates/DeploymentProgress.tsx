'use client';

import React, { useState, useEffect } from 'react';
import { TemplateDeploySession } from '@/lib/game-templates/types';

interface DeploymentProgressProps {
  sessionId: string;
  serverId: string;
  templateId: string;
  onComplete?: (session: TemplateDeploySession) => void;
  onError?: (error: string) => void;
}

/**
 * Deployment Progress Tracker Component
 * Template deployment progress megjelenítése
 */
export function DeploymentProgress({
  sessionId,
  serverId,
  templateId,
  onComplete,
  onError,
}: DeploymentProgressProps) {
  const [session, setSession] = useState<TemplateDeploySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Polling session status-ért
  useEffect(() => {
    const poll = async () => {
      try {
        const response = await fetch(
          `/api/templates/deploy/status?sessionId=${sessionId}&serverId=${serverId}`
        );

        if (response.ok) {
          const data = await response.json();
          setSession(data.session);

          // Completion check
          if (data.session.phase === 'COMPLETED') {
            setLoading(false);
            setPollingInterval(null);
            onComplete?.(data.session);
          }

          // Error check
          if (data.session.phase === 'FAILED') {
            setLoading(false);
            setPollingInterval(null);
            onError?.(data.session.error || 'Deployment sikertelen');
          }
        }
      } catch (error) {
        console.error('Deploy status hiba:', error);
      }
    };

    // Első lekérés azonnal
    poll();

    // Polling minden 2 másodpercben
    const interval = setInterval(poll, 2000);
    setPollingInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sessionId, serverId, onComplete, onError]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [pollingInterval]);

  if (!session) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin">⏳</div>
        <p className="text-gray-600 mt-2">Deployment indítása...</p>
      </div>
    );
  }

  const phaseLabels: Record<string, string> = {
    DOWNLOADING: '📥 Letöltés',
    EXTRACTING: '📦 Kibontás',
    CONFIGURING: '⚙️ Konfigurálás',
    STARTING: '🚀 Indítás',
    COMPLETED: '✅ Befejezve',
    FAILED: '❌ Hiba',
  };

  const phases = ['DOWNLOADING', 'EXTRACTING', 'CONFIGURING', 'STARTING', 'COMPLETED'];

  const getPhaseStatus = (phase: string): 'completed' | 'active' | 'pending' => {
    const currentIndex = phases.indexOf(session.phase);
    const phaseIndex = phases.indexOf(phase);

    if (phaseIndex < currentIndex) return 'completed';
    if (phaseIndex === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">🎮 Szerver Deployment Progress</h3>
        <p className="text-sm text-gray-600 mt-1">
          Template: {templateId} | Szerver: {serverId}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm font-medium text-gray-700">Előrehaladás</span>
          <span className="text-sm font-semibold text-blue-600">{session.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all duration-300"
            style={{ width: `${session.progress}%` }}
          />
        </div>
      </div>

      {/* Phase Steps */}
      <div className="space-y-3">
        {phases.map((phase) => {
          const status = getPhaseStatus(phase);
          const isCompleted = status === 'completed';
          const isActive = status === 'active';

          return (
            <div
              key={phase}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 border border-blue-200'
                  : isCompleted
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isActive
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-300 text-white'
                }`}
              >
                {isCompleted ? '✓' : isActive ? '◉' : '○'}
              </div>
              <span
                className={`font-medium ${
                  isActive ? 'text-blue-700' : isCompleted ? 'text-green-700' : 'text-gray-600'
                }`}
              >
                {phaseLabels[phase]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Messages Log */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-gray-700">📋 Logok</h4>
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
          {session.messages.length === 0 ? (
            <p className="text-gray-500">Nincs üzenet</p>
          ) : (
            session.messages.map((msg, idx) => {
              const levelColor =
                msg.level === 'ERROR'
                  ? 'text-red-400'
                  : msg.level === 'WARNING'
                    ? 'text-yellow-400'
                    : 'text-green-400';

              return (
                <div key={idx} className={levelColor}>
                  <span className="text-gray-500">[{msg.timestamp.toString().slice(11, 19)}]</span>{' '}
                  {msg.message}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Error Message */}
      {session.phase === 'FAILED' && session.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">❌ Hiba történt:</p>
          <p className="text-red-700 text-sm mt-1">{session.error}</p>
        </div>
      )}

      {/* Success Message */}
      {session.phase === 'COMPLETED' && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">✅ Szerver sikeresen telepítve!</p>
          <p className="text-green-700 text-sm mt-1">
            A szerver mostantól elérhető és indítható.
          </p>
        </div>
      )}

      {/* Current Phase Info */}
      {session.phase !== 'COMPLETED' && session.phase !== 'FAILED' && (
        <div className="text-center text-sm text-gray-600">
          <p className="animate-pulse">⏳ {phaseLabels[session.phase]} folyamban...</p>
        </div>
      )}
    </div>
  );
}

export default DeploymentProgress;
