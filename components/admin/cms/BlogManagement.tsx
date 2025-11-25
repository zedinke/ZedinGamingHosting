'use client';

import { useState } from 'react';
import Link from 'next/link';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  isPublished: boolean;
  publishedAt: Date | null;
  locale: string;
  createdAt: Date;
}

interface BlogManagementProps {
  posts: BlogPost[];
  currentPage: number;
  totalPages: number;
  locale: string;
  localeFilter?: string;
}

export function BlogManagement({
  posts,
  currentPage,
  totalPages,
  locale,
  localeFilter,
}: BlogManagementProps) {
  const [search, setSearch] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (localeFilter) params.set('localeFilter', localeFilter);
    window.location.href = `/${locale}/admin/cms/blog?${params.toString()}`;
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
            href={`/${locale}/admin/cms/blog`}
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
              href={`/${locale}/admin/cms/blog?localeFilter=${loc}`}
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

      {/* Blog bejegyzések grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <div
            key={post.id}
            className={`card ${!post.isPublished ? 'opacity-60' : ''}`}
          >
            {post.coverImage && (
              <div className="mb-4 aspect-video relative rounded-lg overflow-hidden bg-gray-200">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                {post.locale.toUpperCase()}
              </span>
              {post.isPublished ? (
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                  Közzétéve
                </span>
              ) : (
                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                  Piszkozat
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold mb-2 line-clamp-2">{post.title}</h3>
            {post.excerpt && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">{post.excerpt}</p>
            )}
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">
                {post.publishedAt
                  ? new Date(post.publishedAt).toLocaleDateString('hu-HU')
                  : new Date(post.createdAt).toLocaleDateString('hu-HU')}
              </span>
              <Link
                href={`/${locale}/admin/cms/blog/${post.id}`}
                className="text-primary-600 hover:underline text-sm"
              >
                Szerkesztés
              </Link>
            </div>
          </div>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-600">Még nincs blog bejegyzés</p>
        </div>
      )}

      {/* Pagináció */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {currentPage > 1 && (
            <Link
              href={`/${locale}/admin/cms/blog?page=${currentPage - 1}${localeFilter ? `&localeFilter=${localeFilter}` : ''}`}
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
              href={`/${locale}/admin/cms/blog?page=${currentPage + 1}${localeFilter ? `&localeFilter=${localeFilter}` : ''}`}
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

