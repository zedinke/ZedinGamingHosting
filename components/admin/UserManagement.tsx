'use client';

import { useState } from 'react';
import Link from 'next/link';
import { UserRole } from '@prisma/client';
import { Search, Edit, CheckCircle2, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  emailVerified: Date | null;
  createdAt: Date;
  _count: {
    servers: number;
    subscriptions: number;
  };
}

interface UserManagementProps {
  users: User[];
  currentPage: number;
  totalPages: number;
  locale: string;
}

export function UserManagement({
  users,
  currentPage,
  totalPages,
  locale,
}: UserManagementProps) {
  const [search, setSearch] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    window.location.href = `/${locale}/admin/users?${params.toString()}`;
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'MODERATOR':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Keresés */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Keresés email vagy név alapján..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
            />
          </div>
          <button
            type="submit"
            className="bg-primary-600 text-white px-6 py-2.5 rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-sm hover:shadow-md"
          >
            Keresés
          </button>
        </form>
      </div>

      {/* Felhasználók táblázata */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Név
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Email
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Szerepkör
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Megerősítve
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Szerverek
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Regisztrálva
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Műveletek
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {user.name || <span className="text-gray-400">-</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getRoleBadgeColor(
                        user.role
                      )}`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.emailVerified ? (
                      <span className="inline-flex items-center text-green-600">
                        <CheckCircle2 className="w-5 h-5" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-red-600">
                        <XCircle className="w-5 h-5" />
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user._count.servers}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString('hu-HU', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={`/${locale}/admin/users/${user.id}`}
                      className="inline-flex items-center text-primary-600 hover:text-primary-800 transition-colors"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Szerkesztés
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagináció */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4">
          <div className="text-sm text-gray-700">
            Oldal <span className="font-medium">{currentPage}</span> /{' '}
            <span className="font-medium">{totalPages}</span>
          </div>
          <div className="flex gap-2">
            {currentPage > 1 && (
              <Link
                href={`/${locale}/admin/users?page=${currentPage - 1}`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Előző
              </Link>
            )}
            {currentPage < totalPages && (
              <Link
                href={`/${locale}/admin/users?page=${currentPage + 1}`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Következő
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

