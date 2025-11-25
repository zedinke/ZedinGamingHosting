'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { getNestedValue } from '@/lib/translations';

interface CTASectionProps {
  locale: string;
  translations: any;
}

export function CTASection({ locale, translations }: CTASectionProps) {
  const t = (key: string) => getNestedValue(translations, key) || key;

  return (
    <section className="py-20 bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Készen állsz a kezdésre?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Regisztrálj most és kapj 24 órás ingyenes próbaidőt!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={`/${locale}/register`}>
              <Button size="lg" variant="secondary" className="w-full sm:w-auto bg-white text-primary-600 hover:bg-gray-100">
                Ingyenes Regisztráció
              </Button>
            </Link>
            <Link href={`/${locale}/pricing`}>
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white/10">
                Árazás Megtekintése
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

