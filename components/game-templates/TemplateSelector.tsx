'use client';

import React, { useState, useEffect } from 'react';
import { GameTemplate } from '@/lib/game-templates/types';
import { getAllTemplates } from '@/lib/game-templates/models/templates';

interface TemplateSelectorProps {
  onSelect: (template: GameTemplate) => void;
  selectedId?: string;
  disabled?: boolean;
}

/**
 * Template Selector Component
 * Játék template-ek kiválasztására
 */
export function TemplateSelector({
  onSelect,
  selectedId,
  disabled = false,
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<GameTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<GameTemplate | null>(null);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const response = await fetch('/api/templates/list');
        if (response.ok) {
          const data = await response.json();
          setTemplates(data.templates || []);

          // Ha van selectedId, azt selectáljuk
          if (selectedId) {
            const selected = data.templates.find((t: GameTemplate) => t.id === selectedId);
            if (selected) {
              setSelectedTemplate(selected);
              onSelect(selected);
            }
          }
        }
      } catch (error) {
        console.error('Template list hiba:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, [selectedId, onSelect]);

  const handleSelectTemplate = (template: GameTemplate) => {
    setSelectedTemplate(template);
    onSelect(template);
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        🎮 Válassz egy játék template-et
      </label>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin">⏳</div>
          <p className="text-gray-600 mt-2">Template-ek betöltése...</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">⚠️ Nincs elérhető template</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => handleSelectTemplate(template)}
              disabled={disabled}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedTemplate?.id === template.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-lg">{template.name}</h3>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                  v{template.version}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-3">{template.description}</p>

              <div className="space-y-2 text-sm">
                {/* Követelmények */}
                <div className="flex items-center gap-2 text-gray-700">
                  <span>💾</span>
                  <span>
                    CPU: {template.requirements.cpuCores} cores | RAM:{' '}
                    {template.requirements.ramGb}GB | Disk: {template.requirements.diskGb}GB
                  </span>
                </div>

                {/* Portok */}
                <div className="flex items-center gap-2 text-gray-700">
                  <span>🌐</span>
                  <span>
                    Port: {template.ports.game}
                    {template.ports.query && `/${template.ports.query}`}
                  </span>
                </div>

                {/* Template méret */}
                <div className="flex items-center gap-2 text-gray-700">
                  <span>📦</span>
                  <span>{template.gdrive.sizeGb}GB template</span>
                </div>

                {/* Max játékosok */}
                {template.metadata.maxPlayers && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <span>👥</span>
                    <span>Max: {template.metadata.maxPlayers} játékos</span>
                  </div>
                )}
              </div>

              {/* Selection indicator */}
              {selectedTemplate?.id === template.id && (
                <div className="mt-3 pt-3 border-t border-blue-200 flex items-center gap-2 text-blue-600 font-medium">
                  <span>✅</span>
                  <span>Kiválasztva</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default TemplateSelector;
