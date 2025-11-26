'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Template {
  id: string;
  name: string;
  gameType: string;
  description: string;
  configuration: any;
  maxPlayers: number;
}

interface ServerTemplatesProps {
  locale: string;
}

export function ServerTemplates({ locale }: ServerTemplatesProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/server-templates');
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Hiba történt');
        return;
      }

      setTemplates(data.templates || []);
    } catch (error) {
      toast.error('Hiba történt a sablonok betöltése során');
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = (template: Template) => {
    // TODO: Valós implementációban itt kellene a sablon alkalmazása új szerver létrehozásakor
    toast('Sablon használata hamarosan elérhető', {
      icon: 'ℹ️',
    });
  };

  if (loading && templates.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8 text-gray-500">Betöltés...</div>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Sablonok listája */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Elérhető Sablonok</h2>
        {templates.map((template) => (
          <div
            key={template.id}
            className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer transition-all ${
              selectedTemplate?.id === template.id
                ? 'ring-2 ring-primary-600'
                : 'hover:shadow-lg'
            }`}
            onClick={() => setSelectedTemplate(template)}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">{template.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                <div className="flex gap-2 text-xs">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                    {template.gameType}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">
                    Max {template.maxPlayers} játékos
                  </span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUseTemplate(template);
                }}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
              >
                Használat
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Kiválasztott sablon részletei */}
      {selectedTemplate && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold mb-4">Sablon Részletek</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Név
              </label>
              <p className="text-gray-900">{selectedTemplate.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Játék Típus
              </label>
              <p className="text-gray-900">{selectedTemplate.gameType}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Leírás
              </label>
              <p className="text-gray-900">{selectedTemplate.description}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Játékosok
              </label>
              <p className="text-gray-900">{selectedTemplate.maxPlayers}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Konfiguráció
              </label>
              <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
                {JSON.stringify(selectedTemplate.configuration, null, 2)}
              </pre>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/${locale}/servers/new?template=${selectedTemplate.id}&gameType=${selectedTemplate.gameType}`}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-center"
              >
                Új Szerver Létrehozása
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

