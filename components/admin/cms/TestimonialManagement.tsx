'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Star } from 'lucide-react';

interface Testimonial {
  id: string;
  name: string;
  role: string | null;
  content: string;
  avatar: string | null;
  rating: number;
  locale: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
}

interface TestimonialManagementProps {
  testimonials: Testimonial[];
  locale: string;
  localeFilter?: string;
}

export function TestimonialManagement({
  testimonials,
  locale,
  localeFilter,
}: TestimonialManagementProps) {
  return (
    <div className="space-y-4">
      {/* Nyelv szűrők */}
      <div className="flex gap-2">
        <Link
          href={`/${locale}/admin/cms/testimonials`}
          className={`px-4 py-2 rounded-lg text-sm ${
            !localeFilter
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Összes
        </Link>
        {['hu', 'en'].map((loc) => (
          <Link
            key={loc}
            href={`/${locale}/admin/cms/testimonials?localeFilter=${loc}`}
            className={`px-4 py-2 rounded-lg text-sm ${
              localeFilter === loc
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {loc.toUpperCase()}
          </Link>
        ))}
      </div>

      {/* Testimonials grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.map((testimonial) => (
          <Card
            key={testimonial.id}
            className={!testimonial.isActive ? 'opacity-60' : ''}
            hover
          >
            <div className="flex items-start gap-4 mb-4">
              {testimonial.avatar ? (
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-xl">
                  {testimonial.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{testimonial.name}</h3>
                {testimonial.role && (
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                )}
                <div className="flex items-center gap-1 mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < testimonial.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <p className="text-gray-700 mb-4 line-clamp-4">{testimonial.content}</p>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2">
                <Badge variant={testimonial.isActive ? 'success' : 'default'} size="sm">
                  {testimonial.isActive ? 'Aktív' : 'Inaktív'}
                </Badge>
                <span className="text-xs text-gray-500">
                  {testimonial.locale.toUpperCase()}
                </span>
                <span className="text-xs text-gray-500">#{testimonial.order}</span>
              </div>
              <Link
                href={`/${locale}/admin/cms/testimonials/${testimonial.id}`}
                className="text-primary-600 hover:underline text-sm"
              >
                Szerkesztés
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {testimonials.length === 0 && (
        <Card className="text-center py-12">
          <p className="text-gray-600">Még nincs vélemény</p>
        </Card>
      )}
    </div>
  );
}

