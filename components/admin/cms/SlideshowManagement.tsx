'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

interface SlideshowSlide {
  id: string;
  title: string | null;
  subtitle: string | null;
  image: string;
  link: string | null;
  buttonText: string | null;
  isActive: boolean;
  order: number;
  locale: string;
}

interface SlideshowManagementProps {
  slides: SlideshowSlide[];
  locale: string;
  transitionInterval: number;
}

export function SlideshowManagement({ slides, locale, transitionInterval }: SlideshowManagementProps) {
  const [intervalValue, setIntervalValue] = useState(transitionInterval);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveInterval = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/cms/slideshow/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transitionInterval: intervalValue,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || 'Hiba történt');
        return;
      }

      alert('Váltási idő sikeresen frissítve');
    } catch (error) {
      alert('Hiba történt');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Váltási idő beállítás */}
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h2 className="text-xl font-bold mb-4">Slideshow Beállítások</h2>
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">
            Váltási idő (másodperc):
          </label>
          <input
            type="number"
            min="1"
            max="60"
            value={intervalValue}
            onChange={(e) => setIntervalValue(parseInt(e.target.value, 10) || 5)}
            className="w-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
          />
          <button
            onClick={handleSaveInterval}
            disabled={isSaving}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Mentés...' : 'Mentés'}
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          A képek ennyi másodpercenként váltanak egymást (1-60 másodperc között)
        </p>
      </div>

      {/* Slides list */}
      <div className="space-y-4">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {slides.map((slide) => (
          <Card key={slide.id} className={!slide.isActive ? 'opacity-60' : ''} hover>
            <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden bg-gray-200">
              <img
                src={slide.image}
                alt={slide.title || 'Slide'}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="mb-4">
              {slide.title && (
                <h3 className="font-semibold text-lg mb-1">{slide.title}</h3>
              )}
              {slide.subtitle && (
                <p className="text-sm text-gray-600 line-clamp-2">{slide.subtitle}</p>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2">
                <Badge variant={slide.isActive ? 'success' : 'default'} size="sm">
                  {slide.isActive ? 'Aktív' : 'Inaktív'}
                </Badge>
                <span className="text-xs text-gray-500">#{slide.order}</span>
              </div>
              <Link
                href={`/${locale}/admin/cms/slideshow/${slide.id}`}
                className="text-primary-600 hover:underline text-sm"
              >
                Szerkesztés
              </Link>
            </div>
          </Card>
        ))}
      </div>

        {slides.length === 0 && (
          <Card className="text-center py-12">
            <p className="text-gray-600">Még nincs slideshow slide</p>
          </Card>
        )}
      </div>
    </div>
  );
}

