'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Page {
  id: string;
  slug: string;
  title: string;
  isPublished: boolean;
  locale: string;
  updatedAt: Date;
}

interface PageManagementProps {
  pages: Page[];
  currentPage: number;
  totalPages: number;
  locale: string;
  localeFilter?: string;
}

export function PageManagement({
  pages,
  currentPage,
  totalPages,
  locale,
  localeFilter,
}: PageManagementProps) {
  const [search, setSearch] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (localeFilter) params.set('localeFilter', localeFilter);
    window.location.href = `/${locale}/admin/cms/pages?${params.toString()}`;
  };

  return (
    <div className="space-y-4">
      {/* Keresés és szűrők */}
      <div className="flex gap-2 flex-wrap">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[300px]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Keresés cím vagy slug alapján..."
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
          />
          <button
            type="submit"
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
          >
            Keresés
          </button>
        </form>
        
        {/* Nyelv szűrők */}
        <div className="flex gap-2">
          <Link
            href={`/${locale}/admin/cms/pages`}
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
              href={`/${locale}/admin/cms/pages?localeFilter=${loc}`}
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
      </div>

      {/* Oldalak táblázata */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3">Cím</th>
              <th className="text-left p-3">Slug</th>
              <th className="text-left p-3">Nyelv</th>
              <th className="text-left p-3">Státusz</th>
              <th className="text-left p-3">Frissítve</th>
              <th className="text-left p-3">Műveletek</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => (
              <tr key={page.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium">{page.title}</td>
                <td className="p-3 text-sm text-gray-600">{page.slug}</td>
                <td className="p-3">
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                    {page.locale.toUpperCase()}
                  </span>
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      page.isPublished
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {page.isPublished ? 'Közzétéve' : 'Piszkozat'}
                  </span>
                </td>
                <td className="p-3 text-sm text-gray-600">
                  {new Date(page.updatedAt).toLocaleDateString('hu-HU')}
                </td>
                <td className="p-3">
                  <Link
                    href={`/${locale}/admin/cms/pages/${page.id}`}
                    className="text-primary-600 hover:underline text-sm mr-3"
                  >
                    Szerkesztés
                  </Link>
                  <a
                    href={`/${page.locale}/${page.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline text-sm"
                  >
                    Megtekintés
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagináció */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {currentPage > 1 && (
            <Link
              href={`/${locale}/admin/cms/pages?page=${currentPage - 1}${localeFilter ? `&localeFilter=${localeFilter}` : ''}`}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Előző
            </Link>
          )}
          <span className="px-4 py-2">
            Oldal {currentPage} / {totalPages}
          </span>
          {currentPage < totalPages && (
            <Link
              href={`/${locale}/admin/cms/pages?page=${currentPage + 1}${localeFilter ? `&localeFilter=${localeFilter}` : ''}`}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Következő
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

