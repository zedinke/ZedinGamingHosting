/**
 * Mod Management Dashboard
 * Advanced mod management interface for ARK servers
 */

'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, AlertCircle, Zap, Download } from 'lucide-react';

interface Mod {
  modId: string;
  name: string;
  version: string;
  author: string;
  compatibility: 'evolved' | 'ascended' | 'both';
  lastUpdated: number;
  rating: number;
}

interface ModConflict {
  modId1: string;
  modId2: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  reason: string;
  workaround?: string;
}

interface ModManagerProps {
  serverId: string;
  serverName: string;
  gameType: 'evolved' | 'ascended';
}

const ModManager: React.FC<ModManagerProps> = ({ serverId, serverName, gameType }) => {
  const [mods, setMods] = useState<Mod[]>([]);
  const [conflicts, setConflicts] = useState<ModConflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [selectedMods, setSelectedMods] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'mods' | 'conflicts' | 'updates' | 'stats'>('mods');

  useEffect(() => {
    fetchModConfig();
  }, [serverId]);

  const fetchModConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/servers/${serverId}/mods`);
      if (response.ok) {
        const data = await response.json();
        setMods(data.config.mods || []);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch mod config:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateMods = async () => {
    try {
      setValidating(true);
      const response = await fetch(`/api/servers/${serverId}/mods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'validate',
          mods,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setConflicts(data.conflicts || []);

        if (data.valid) {
          // toast.success('All mods are compatible');
        } else {
          // toast.error('Compatibility issues detected');
        }
      }
    } catch (error) {
      console.error('Failed to validate mods:', error);
    } finally {
      setValidating(false);
    }
  };

  const optimizeLoadOrder = async () => {
    try {
      const response = await fetch(`/api/servers/${serverId}/mods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'optimize-load-order',
          mods,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // toast.success('Load order optimized');
        // Reorder mods based on loadOrder
      }
    } catch (error) {
      console.error('Failed to optimize load order:', error);
    }
  };

  const checkForUpdates = async () => {
    try {
      const response = await fetch(`/api/servers/${serverId}/mods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check-updates',
          mods,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Show updates list
        console.log('Updates available:', data.updates);
      }
    } catch (error) {
      console.error('Failed to check updates:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-900 text-red-200';
      case 'high':
        return 'bg-orange-900 text-orange-200';
      case 'medium':
        return 'bg-yellow-900 text-yellow-200';
      default:
        return 'bg-blue-900 text-blue-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    if (severity === 'critical') return <AlertTriangle className="w-4 h-4" />;
    if (severity === 'high') return <AlertCircle className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Mod Management</h1>
          <p className="text-gray-400 text-sm">{serverName} ({gameType.toUpperCase()})</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={validateMods}
            disabled={validating}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-white text-sm flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Validate
          </button>
          <button
            onClick={optimizeLoadOrder}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white text-sm flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Optimize
          </button>
          <button
            onClick={checkForUpdates}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white text-sm flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Updates
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading mod configuration...</div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-4 border-b border-gray-700">
            {(['mods', 'conflicts', 'updates', 'stats'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-semibold ${
                  activeTab === tab
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Mods Tab */}
          {activeTab === 'mods' && (
            <div className="space-y-4">
              {mods.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No mods installed
                </div>
              ) : (
                <div className="grid gap-4">
                  {mods.map((mod) => (
                    <div
                      key={mod.modId}
                      className="bg-gray-800 p-4 rounded border border-gray-700 hover:border-gray-600 cursor-pointer"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{mod.name}</h3>
                          <p className="text-gray-400 text-sm">{mod.author}</p>
                          <div className="flex gap-4 mt-2 text-sm">
                            <span className="text-gray-400">v{mod.version}</span>
                            <span className="text-blue-400">{mod.compatibility.toUpperCase()}</span>
                            <span className="text-yellow-400">⭐ {mod.rating.toFixed(1)}</span>
                          </div>
                        </div>

                        <input
                          type="checkbox"
                          checked={selectedMods.has(mod.modId)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedMods);
                            if (e.target.checked) {
                              newSelected.add(mod.modId);
                            } else {
                              newSelected.delete(mod.modId);
                            }
                            setSelectedMods(newSelected);
                          }}
                          className="w-4 h-4"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Conflicts Tab */}
          {activeTab === 'conflicts' && (
            <div className="space-y-4">
              {conflicts.length === 0 ? (
                <div className="text-center py-8 text-green-400">
                  ✅ No mod conflicts detected
                </div>
              ) : (
                <div className="grid gap-4">
                  {conflicts.map((conflict, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded border ${getSeverityColor(conflict.severity)}`}
                    >
                      <div className="flex items-start gap-3">
                        {getSeverityIcon(conflict.severity)}
                        <div className="flex-1">
                          <h4 className="font-semibold">{conflict.severity.toUpperCase()} CONFLICT</h4>
                          <p className="mt-1">{conflict.reason}</p>
                          {conflict.workaround && (
                            <p className="mt-2 text-sm italic">
                              💡 Workaround: {conflict.workaround}
                            </p>
                          )}
                          <p className="text-xs mt-2 opacity-75">
                            {conflict.modId1} ↔ {conflict.modId2}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Updates Tab */}
          {activeTab === 'updates' && (
            <div className="text-center py-8 text-gray-400">
              Check for updates to see available mod versions
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-800 p-4 rounded">
                <p className="text-gray-400 text-sm">Total Mods</p>
                <p className="text-3xl font-bold text-blue-400">{stats.totalMods}</p>
              </div>
              <div className="bg-gray-800 p-4 rounded">
                <p className="text-gray-400 text-sm">Total Size</p>
                <p className="text-3xl font-bold text-green-400">
                  {(stats.totalSize / 1024 / 1024).toFixed(1)}MB
                </p>
              </div>
              <div className="bg-gray-800 p-4 rounded">
                <p className="text-gray-400 text-sm">Avg Rating</p>
                <p className="text-3xl font-bold text-yellow-400">
                  {stats.averageRating.toFixed(1)}⭐
                </p>
              </div>
              <div className="bg-gray-800 p-4 rounded">
                <p className="text-gray-400 text-sm">Compatible</p>
                <p className="text-lg font-bold text-purple-400">
                  {stats.compatibleVersions[gameType]} for {gameType}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ModManager;
