'use client';

import Link from 'next/link';
import Image from 'next/image';
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
}

export function SlideshowManagement({ slides, locale }: SlideshowManagementProps) {
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {slides.map((slide) => (
          <Card key={slide.id} className={!slide.isActive ? 'opacity-60' : ''} hover>
            <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden bg-gray-200">
              <Image
                src={slide.image}
                alt={slide.title || 'Slide'}
                fill
                className="object-cover"
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
  );
}

