import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { LicenseInfo } from '@/components/admin/LicenseInfo';
import { UpdateInfo } from '@/components/admin/UpdateInfo';
import { Card } from '@/components/ui/Card';

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{session.user?.email}</span>
              <a
                href="/api/auth/signout"
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Kijelentkezés
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-6">
          <LicenseInfo locale="hu" />
          <UpdateInfo />

          <Card>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Gyors műveletek</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a
                href="/admin/license"
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 mb-2">License kezelés</h3>
                <p className="text-sm text-gray-600">License aktiválása és kezelése</p>
              </a>
              <a
                href="/admin/system-installation"
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 mb-2">Modul telepítés</h3>
                <p className="text-sm text-gray-600">Modulok telepítése és konfigurálása</p>
              </a>
              <a
                href="/admin/settings"
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 mb-2">Beállítások</h3>
                <p className="text-sm text-gray-600">Rendszer beállítások</p>
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

