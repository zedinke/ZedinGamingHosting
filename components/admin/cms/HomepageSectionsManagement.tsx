'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

interface HomepageSection {
  id: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  isActive: boolean;
  order: number;
  locale: string;
  createdAt: Date;
}

interface HomepageSectionsManagementProps {
  sections: HomepageSection[];
  locale: string;
}

export function HomepageSectionsManagement({
  sections,
  locale,
}: HomepageSectionsManagementProps) {
  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      hero: 'Hero',
      features: 'Funkciók',
      stats: 'Statisztikák',
      cta: 'CTA',
      slideshow: 'Slideshow',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section) => (
          <Card key={section.id} className={!section.isActive ? 'opacity-60' : ''} hover>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg">{section.title || 'Névtelen szekció'}</h3>
                <p className="text-sm text-gray-600 mt-1">{section.subtitle || ''}</p>
              </div>
              <Badge variant={section.isActive ? 'success' : 'default'} size="sm">
                {section.isActive ? 'Aktív' : 'Inaktív'}
              </Badge>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2">
                <Badge variant="outline" size="sm">
                  {getTypeLabel(section.type)}
                </Badge>
                <span className="text-xs text-gray-500">#{section.order}</span>
              </div>
              <Link
                href={`/${locale}/admin/cms/homepage/${section.id}`}
                className="text-primary-600 hover:underline text-sm"
              >
                Szerkesztés
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {sections.length === 0 && (
        <Card className="text-center py-12">
          <p className="text-gray-600">Még nincs homepage szekció</p>
        </Card>
      )}
    </div>
  );
}

