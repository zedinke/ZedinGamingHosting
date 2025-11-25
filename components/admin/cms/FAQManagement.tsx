'use client';

import Link from 'next/link';
import { useState } from 'react';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  order: number;
  locale: string;
  isActive: boolean;
}

interface FAQManagementProps {
  faqs: FAQ[];
  locale: string;
  localeFilter?: string;
}

export function FAQManagement({ faqs, locale, localeFilter }: FAQManagementProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Nyelv szűrők */}
      <div className="flex gap-2">
        <Link
          href={`/${locale}/admin/cms/faq`}
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
            href={`/${locale}/admin/cms/faq?localeFilter=${loc}`}
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

      {/* FAQ lista */}
      <div className="space-y-2">
        {faqs.map((faq) => (
          <div
            key={faq.id}
            className={`card ${!faq.isActive ? 'opacity-60' : ''}`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-500">#{faq.order}</span>
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                    {faq.locale.toUpperCase()}
                  </span>
                  {!faq.isActive && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                      Inaktív
                    </span>
                  )}
                </div>
                <h3 className="font-semibold mb-2">{faq.question}</h3>
                {expandedId === faq.id ? (
                  <div>
                    <p className="text-gray-700 whitespace-pre-wrap mb-2">{faq.answer}</p>
                    <button
                      onClick={() => setExpandedId(null)}
                      className="text-primary-600 hover:underline text-sm"
                    >
                      Összecsukás
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-700 line-clamp-2 mb-2">{faq.answer}</p>
                    <button
                      onClick={() => setExpandedId(faq.id)}
                      className="text-primary-600 hover:underline text-sm"
                    >
                      Tovább olvasás
                    </button>
                  </div>
                )}
              </div>
              <div className="ml-4">
                <Link
                  href={`/${locale}/admin/cms/faq/${faq.id}`}
                  className="text-primary-600 hover:underline text-sm"
                >
                  Szerkesztés
                </Link>
              </div>
            </div>
          </div>
        ))}

        {faqs.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-gray-600">Még nincs FAQ bejegyzés</p>
          </div>
        )}
      </div>
    </div>
  );
}

