'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface Machine {
  id: string;
  name: string;
  ipAddress: string;
  status: string;
  agents: Array<{
    id: string;
    agentId: string;
    status: string;
  }>;
}

interface ServerMigrationProps {
  serverId: string;
  currentMachineId: string | null;
  locale: string;
}

export function ServerMigration({ serverId, currentMachineId, locale }: ServerMigrationProps) {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedMachineId, setSelectedMachineId] = useState<string>('');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [preparationResult, setPreparationResult] = useState<{
    canMigrate: boolean;
    error?: string;
    estimatedSize?: number;
  } | null>(null);

  useEffect(() => {
    loadMachines();
  }, []);

  const loadMachines = async () => {
    try {
      const response = await fetch('/api/admin/machines?limit=100');
      const data = await response.json();

      if (response.ok) {
        // Szűrjük ki az aktuális gépet és csak az ONLINE gépeket
        const availableMachines = (data.machines || []).filter(
          (m: Machine) => m.id !== currentMachineId && m.status === 'ONLINE' && m.agents.length > 0
        );
        setMachines(availableMachines);
      }
    } catch (error) {
      console.error('Load machines error:', error);
    }
  };

  const handleMachineChange = async (machineId: string) => {
    setSelectedMachineId(machineId);
    setSelectedAgentId('');
    setPreparationResult(null);

    if (!machineId) return;

    setIsPreparing(true);
    try {
      const response = await fetch(
        `/api/admin/servers/${serverId}/migrate?targetMachineId=${machineId}`
      );
      const data = await response.json();

      if (response.ok) {
        setPreparationResult(data);
        // Automatikusan válasszuk az első ONLINE agentet
        const machine = machines.find((m) => m.id === machineId);
        if (machine && machine.agents.length > 0) {
          const onlineAgent = machine.agents.find((a) => a.status === 'ONLINE') || machine.agents[0];
          setSelectedAgentId(onlineAgent.id);
        }
      } else {
        toast.error(data.error || 'Hiba az előkészítés során');
        setPreparationResult({ canMigrate: false, error: data.error });
      }
    } catch (error) {
      toast.error('Hiba történt');
      setPreparationResult({ canMigrate: false, error: 'Hiba az előkészítés során' });
    } finally {
      setIsPreparing(false);
    }
  };

  const handleMigrate = async () => {
    if (!selectedMachineId || !selectedAgentId) {
      toast.error('Válassz ki egy gépet és agentet');
      return;
    }

    if (!preparationResult?.canMigrate) {
      toast.error(preparationResult?.error || 'Migráció nem lehetséges');
      return;
    }

    if (!confirm('Biztosan át szeretnéd telepíteni ezt a szervert? Ez hosszabb ideig is eltarthat.')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/servers/${serverId}/migrate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetMachineId: selectedMachineId,
          targetAgentId: selectedAgentId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Migráció sikertelen');
        return;
      }

      toast.success('Migráció elindítva! Ez eltarthat néhány percig.');
      
      // Oldal frissítése néhány másodperc után
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (error) {
      toast.error('Hiba történt a migráció során');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedMachine = machines.find((m) => m.id === selectedMachineId);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold mb-4">Szerver Migráció</h2>
      <p className="text-sm text-gray-600 mb-4">
        Telepítsd át a szervert másik gépre. Minden fájl, backup és konfiguráció át lesz másolva.
      </p>

      <div className="space-y-4">
        {/* Cél gép kiválasztása */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cél Szerver Gép
          </label>
          <select
            value={selectedMachineId}
            onChange={(e) => handleMachineChange(e.target.value)}
            disabled={isLoading || isPreparing}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
          >
            <option value="">-- Válassz gépet --</option>
            {machines.map((machine) => (
              <option key={machine.id} value={machine.id}>
                {machine.name} ({machine.ipAddress}) - {machine.agents.length} agent
              </option>
            ))}
          </select>
        </div>

        {/* Agent kiválasztása */}
        {selectedMachine && selectedMachine.agents.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cél Agent
            </label>
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              disabled={isLoading || isPreparing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
            >
              <option value="">-- Válassz agentet --</option>
              {selectedMachine.agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.agentId} ({agent.status})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Előkészítés eredménye */}
        {isPreparing && (
          <div className="text-center py-4 text-gray-600">Ellenőrzés...</div>
        )}

        {preparationResult && !isPreparing && (
          <div
            className={`p-4 rounded-lg ${
              preparationResult.canMigrate
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            {preparationResult.canMigrate ? (
              <div>
                <p className="text-green-800 font-medium mb-2">✓ Migráció lehetséges</p>
                {preparationResult.estimatedSize && (
                  <p className="text-sm text-green-700">
                    Becsült méret: ~{Math.round(preparationResult.estimatedSize / 1024 / 1024 / 1024)}GB
                  </p>
                )}
              </div>
            ) : (
              <p className="text-red-800">
                ⚠ {preparationResult.error || 'Migráció nem lehetséges'}
              </p>
            )}
          </div>
        )}

        {/* Migráció gomb */}
        <button
          onClick={handleMigrate}
          disabled={
            isLoading ||
            isPreparing ||
            !selectedMachineId ||
            !selectedAgentId ||
            !preparationResult?.canMigrate
          }
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isLoading ? 'Migráció folyamatban...' : 'Szerver Áttelepítése'}
        </button>

        {isLoading && (
          <div className="text-center text-sm text-gray-600">
            <p>Migráció folyamatban... Ez eltarthat néhány percig.</p>
            <p className="mt-2">Kérjük, ne zárja be az oldalt!</p>
          </div>
        )}
      </div>
    </div>
  );
}

