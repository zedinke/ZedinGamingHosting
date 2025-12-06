/**
 * Admin: Rust Mod Management
 * Manage available mods in the marketplace
 */

'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';

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
  isActive: boolean;
  isFeatured: boolean;
  downloadUrl: string;
}

export default function AdminRustModManagement() {
  const [mods, setMods] = useState<RustMod[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<RustMod>>({
    displayName: '',
    name: '',
    description: '',
    author: '',
    version: '1.0.0',
    category: 'Utility',
    price: 0,
    currency: 'USD',
    downloadUrl: '',
    isActive: true,
  });

  useEffect(() => {
    fetchMods();
  }, []);

  const fetchMods = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/rust-mods');
      const data = await res.json();
      setMods(data.mods || []);
    } catch (error) {
      console.error('Failed to fetch mods:', error);
      toast.error('Failed to load mods');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMod = async () => {
    try {
      if (!formData.displayName || !formData.downloadUrl) {
        toast.error('Please fill in all required fields');
        return;
      }

      const res = await fetch('/api/admin/rust-mods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error('Failed to create mod');
      }

      toast.success('Mod added successfully');
      setShowForm(false);
      setFormData({
        displayName: '',
        name: '',
        description: '',
        author: '',
        version: '1.0.0',
        category: 'Utility',
        price: 0,
        currency: 'USD',
        downloadUrl: '',
        isActive: true,
      });
      fetchMods();
    } catch (error) {
      console.error('Add mod error:', error);
      toast.error('Failed to add mod');
    }
  };

  const handleEditMod = async (mod: RustMod) => {
    try {
      const res = await fetch(`/api/admin/rust-mods/${mod.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mod),
      });

      if (!res.ok) {
        throw new Error('Failed to update mod');
      }

      toast.success('Mod updated successfully');
      setEditingId(null);
      fetchMods();
    } catch (error) {
      console.error('Edit mod error:', error);
      toast.error('Failed to update mod');
    }
  };

  const handleDeleteMod = async (modId: string) => {
    if (!confirm('Are you sure you want to delete this mod?')) return;

    try {
      const res = await fetch(`/api/admin/rust-mods/${modId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete mod');
      }

      toast.success('Mod deleted successfully');
      fetchMods();
    } catch (error) {
      console.error('Delete mod error:', error);
      toast.error('Failed to delete mod');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Rust Mod Management</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            <Plus className="w-5 h-5" />
            Add New Mod
          </button>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-slate-800 rounded-lg p-6 mb-8 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4">Add New Mod</h2>

            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Display Name"
                value={formData.displayName || ''}
                onChange={(e) =>
                  setFormData({ ...formData, displayName: e.target.value })
                }
                className="px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-orange-500"
              />
              <input
                type="text"
                placeholder="Mod Name (slug)"
                value={formData.name || ''}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-orange-500"
              />
              <input
                type="text"
                placeholder="Author"
                value={formData.author || ''}
                onChange={(e) =>
                  setFormData({ ...formData, author: e.target.value })
                }
                className="px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-orange-500"
              />
              <select
                value={formData.category || 'Utility'}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-orange-500"
              >
                <option>Utility</option>
                <option>Combat</option>
                <option>Quality of Life</option>
                <option>Building</option>
                <option>Admin</option>
              </select>
              <input
                type="number"
                placeholder="Price (USD)"
                value={formData.price || 0}
                onChange={(e) =>
                  setFormData({ ...formData, price: parseFloat(e.target.value) })
                }
                className="px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-orange-500"
              />
              <input
                type="text"
                placeholder="Version"
                value={formData.version || '1.0.0'}
                onChange={(e) =>
                  setFormData({ ...formData, version: e.target.value })
                }
                className="px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-orange-500"
              />
            </div>

            <textarea
              placeholder="Description"
              value={formData.description || ''}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full mt-4 px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-orange-500"
              rows={3}
            />

            <input
              type="url"
              placeholder="Download URL"
              value={formData.downloadUrl || ''}
              onChange={(e) =>
                setFormData({ ...formData, downloadUrl: e.target.value })
              }
              className="w-full mt-4 px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-orange-500"
            />

            <div className="mt-4 flex gap-2">
              <button
                onClick={handleAddMod}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Save Mod
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Mods Table */}
        {loading ? (
          <div className="text-center text-slate-400">Loading mods...</div>
        ) : (
          <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-700 bg-slate-700/50">
                <tr>
                  <th className="px-6 py-4 font-semibold text-white">Mod Name</th>
                  <th className="px-6 py-4 font-semibold text-white">Author</th>
                  <th className="px-6 py-4 font-semibold text-white">Category</th>
                  <th className="px-6 py-4 font-semibold text-white">Price</th>
                  <th className="px-6 py-4 font-semibold text-white">Version</th>
                  <th className="px-6 py-4 font-semibold text-white">Active</th>
                  <th className="px-6 py-4 font-semibold text-white">Featured</th>
                  <th className="px-6 py-4 font-semibold text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mods.map((mod) => (
                  <tr key={mod.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                    <td className="px-6 py-4 text-white font-medium">{mod.displayName}</td>
                    <td className="px-6 py-4 text-slate-400">{mod.author}</td>
                    <td className="px-6 py-4 text-slate-400">{mod.category}</td>
                    <td className="px-6 py-4 text-slate-400">
                      {mod.price === 0 ? 'Free' : `$${mod.price.toFixed(2)}`}
                    </td>
                    <td className="px-6 py-4 text-slate-400">{mod.version}</td>
                    <td className="px-6 py-4">
                      {mod.isActive ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <X className="w-5 h-5 text-red-500" />
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {mod.isFeatured ? (
                        <Check className="w-5 h-5 text-yellow-500" />
                      ) : (
                        <X className="w-5 h-5 text-slate-500" />
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingId(mod.id);
                            setFormData(mod);
                          }}
                          className="p-2 hover:bg-slate-700 rounded"
                        >
                          <Edit2 className="w-4 h-4 text-blue-400" />
                        </button>
                        <button
                          onClick={() => handleDeleteMod(mod.id)}
                          className="p-2 hover:bg-slate-700 rounded"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
