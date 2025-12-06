/**
 * Rust Mod Store Component
 * User-facing mod marketplace with one-click install
 */

'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Package, Star, Download, Zap, Loader } from 'lucide-react';

interface RustMod {
  id: string;
  name: string;
  displayName: string;
  description: string;
  author: string;
  version: string;
  category: string;
  imageUrl?: string;
  price: number;
  currency: string;
  popularity: number;
  rating: number;
  reviews: number;
  isFeatured: boolean;
}

interface RustModStoreProps {
  serverId: string;
  serverName: string;
}

export default function RustModStore({ serverId, serverName }: RustModStoreProps) {
  const [mods, setMods] = useState<RustMod[]>([]);
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const categories = ['All', 'Utility', 'Combat', 'Quality of Life', 'Building', 'Admin'];

  useEffect(() => {
    fetchMods();
  }, [activeCategory, searchQuery, page]);

  const fetchMods = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...(activeCategory !== 'All' && { category: activeCategory }),
        ...(searchQuery && { search: searchQuery }),
      });

      const res = await fetch(`/api/rust-mods?${params}`);
      const data = await res.json();

      setMods(data.mods || []);
      setTotalPages(data.pagination?.pages || 0);
    } catch (error) {
      console.error('Failed to fetch mods:', error);
      toast.error('Failed to load mods');
    } finally {
      setLoading(false);
    }
  };

  const handleInstallMod = async (mod: RustMod) => {
    try {
      setInstalling(mod.id);

      const res = await fetch('/api/rust-mods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modId: mod.id, serverId }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to install mod');
        return;
      }

      if (mod.price === 0) {
        toast.success(`${mod.displayName} installed successfully!`);
      } else {
        toast.success('Proceeding to payment...');
        // Redirect to payment
        window.location.href = `/checkout?mod=${mod.id}&server=${serverId}`;
      }

      // Refresh mods list
      fetchMods();
    } catch (error) {
      console.error('Install error:', error);
      toast.error('Installation failed');
    } finally {
      setInstalling(null);
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Package className="w-10 h-10 text-orange-500" />
            Rust Mod Store
          </h1>
          <p className="text-slate-400">
            Install mods on: <span className="text-orange-400 font-semibold">{serverName}</span>
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search mods by name, author, or description..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-orange-500 focus:outline-none"
          />
        </div>

        {/* Category Tabs */}
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => {
                setActiveCategory(category);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-all ${
                activeCategory === category
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Mods Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <Loader className="w-12 h-12 text-orange-500 animate-spin" />
          </div>
        ) : mods.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No mods found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {mods.map((mod) => (
                <div
                  key={mod.id}
                  className="bg-slate-700/50 border border-slate-600 rounded-lg overflow-hidden hover:border-orange-500 transition-all hover:shadow-lg hover:shadow-orange-500/20"
                >
                  {/* Mod Image */}
                  {mod.imageUrl && (
                    <div className="h-40 bg-gradient-to-b from-orange-500/20 to-transparent overflow-hidden">
                      <img
                        src={mod.imageUrl}
                        alt={mod.displayName}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                  )}

                  {/* Mod Info */}
                  <div className="p-4">
                    {/* Featured Badge */}
                    {mod.isFeatured && (
                      <div className="flex items-center gap-1 mb-2 text-orange-400 text-sm font-semibold">
                        <Zap className="w-4 h-4" />
                        Featured
                      </div>
                    )}

                    {/* Title & Author */}
                    <h3 className="text-lg font-bold text-white mb-1">{mod.displayName}</h3>
                    <p className="text-sm text-slate-400 mb-3">by {mod.author}</p>

                    {/* Description */}
                    <p className="text-sm text-slate-300 mb-4 line-clamp-2">{mod.description}</p>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mb-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-slate-200">
                          {mod.rating.toFixed(1)} ({mod.reviews} reviews)
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <Download className="w-4 h-4" />
                        {mod.popularity} downloads
                      </div>
                    </div>

                    {/* Category & Version */}
                    <div className="flex items-center gap-2 mb-4 text-xs">
                      <span className="px-2 py-1 bg-slate-600 text-slate-300 rounded">
                        {mod.category}
                      </span>
                      <span className="px-2 py-1 bg-slate-600 text-slate-300 rounded">
                        v{mod.version}
                      </span>
                    </div>

                    {/* Price & Install Button */}
                    <div className="flex items-center gap-3">
                      {mod.price > 0 ? (
                        <div className="text-lg font-bold text-orange-400">
                          ${mod.price.toFixed(2)}
                        </div>
                      ) : (
                        <div className="text-sm font-semibold text-green-400">FREE</div>
                      )}

                      <button
                        onClick={() => handleInstallMod(mod)}
                        disabled={installing === mod.id}
                        className={`flex-1 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                          installing === mod.id
                            ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                            : 'bg-orange-500 text-white hover:bg-orange-600 active:scale-95'
                        }`}
                      >
                        {installing === mod.id ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            Installing...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4" />
                            Install
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600"
                >
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = page <= 3 ? i + 1 : page + i - 2;
                    if (pageNum > totalPages) return null;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`px-3 py-2 rounded-lg transition-all ${
                          pageNum === page
                            ? 'bg-orange-500 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Info Box */}
        <div className="mt-12 bg-slate-700/50 border border-slate-600 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-2">ℹ️ About Rust Mods</h3>
          <ul className="text-slate-300 space-y-2 text-sm">
            <li>
              • All mods require the <strong>Oxide framework</strong> to be installed on your server
            </li>
            <li>• Free mods are installed automatically within 1-2 minutes</li>
            <li>• Premium mods are installed after payment verification</li>
            <li>• You can manage installed mods from the Server Control Panel</li>
            <li>• Mods are updated automatically when new versions are available</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
