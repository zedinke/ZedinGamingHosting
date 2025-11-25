'use client';

import { useState } from 'react';
import Link from 'next/link';
import { UserRole } from '@prisma/client';

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
        return 'bg-red-100 text-red-800';
      case 'MODERATOR':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Keresés */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Keresés email vagy név alapján..."
          className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
        />
        <button
          type="submit"
          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
        >
          Keresés
        </button>
      </form>

      {/* Felhasználók táblázata */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3">Név</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Szerepkör</th>
              <th className="text-left p-3">Megerősítve</th>
              <th className="text-left p-3">Szerverek</th>
              <th className="text-left p-3">Regisztrálva</th>
              <th className="text-left p-3">Műveletek</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <td className="p-3">{user.name || '-'}</td>
                <td className="p-3">{user.email}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${getRoleBadgeColor(
                      user.role
                    )}`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="p-3">
                  {user.emailVerified ? (
                    <span className="text-green-600">✓</span>
                  ) : (
                    <span className="text-red-600">✗</span>
                  )}
                </td>
                <td className="p-3">{user._count.servers}</td>
                <td className="p-3 text-sm text-gray-600">
                  {new Date(user.createdAt).toLocaleDateString('hu-HU')}
                </td>
                <td className="p-3">
                  <Link
                    href={`/${locale}/admin/users/${user.id}`}
                    className="text-primary-600 hover:underline text-sm"
                  >
                    Szerkesztés
                  </Link>
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
              href={`/${locale}/admin/users?page=${currentPage - 1}`}
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
              href={`/${locale}/admin/users?page=${currentPage + 1}`}
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

