'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface ThemeEditorProps {
  themeSettings: Record<string, any>;
  locale: string;
}

export function ThemeEditor({ themeSettings, locale }: ThemeEditorProps) {
  const [settings, setSettings] = useState({
    primaryColor: themeSettings.primaryColor || '#4F46E5',
    secondaryColor: themeSettings.secondaryColor || '#7C3AED',
    fontFamily: themeSettings.fontFamily || 'Inter',
    borderRadius: themeSettings.borderRadius || '8px',
    ...themeSettings,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/theme', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Hiba történt');
        return;
      }

      toast.success('Téma beállítások mentve');
    } catch (error) {
      toast.error('Hiba történt');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card padding="lg">
        <h2 className="text-xl font-bold mb-4">Színek</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Elsődleges szín</label>
            <div className="flex gap-4 items-center">
              <input
                type="color"
                value={settings.primaryColor}
                onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                className="w-16 h-16 rounded border"
              />
              <input
                type="text"
                value={settings.primaryColor}
                onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                className="flex-1 px-4 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Másodlagos szín</label>
            <div className="flex gap-4 items-center">
              <input
                type="color"
                value={settings.secondaryColor}
                onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                className="w-16 h-16 rounded border"
              />
              <input
                type="text"
                value={settings.secondaryColor}
                onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                className="flex-1 px-4 py-2 border rounded-lg"
              />
            </div>
          </div>
        </div>
      </Card>

      <Card padding="lg">
        <h2 className="text-xl font-bold mb-4">Betűtípus</h2>
        <div>
          <label className="block text-sm font-medium mb-2">Betűtípus család</label>
          <select
            value={settings.fontFamily}
            onChange={(e) => setSettings({ ...settings, fontFamily: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="Inter">Inter</option>
            <option value="Roboto">Roboto</option>
            <option value="Open Sans">Open Sans</option>
            <option value="Lato">Lato</option>
            <option value="Montserrat">Montserrat</option>
          </select>
        </div>
      </Card>

      <Card padding="lg">
        <h2 className="text-xl font-bold mb-4">Stílus</h2>
        <div>
          <label className="block text-sm font-medium mb-2">Border radius</label>
          <input
            type="text"
            value={settings.borderRadius}
            onChange={(e) => setSettings({ ...settings, borderRadius: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="8px"
          />
        </div>
      </Card>

      <div className="flex gap-4">
        <Button onClick={handleSave} isLoading={isSaving} size="lg">
          Mentés
        </Button>
      </div>
    </div>
  );
}

