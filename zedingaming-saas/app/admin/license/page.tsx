'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { Key } from 'lucide-react';

export default function LicensePage() {
  const router = useRouter();
  const [licenseKey, setLicenseKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/license/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ licenseKey }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'License aktiválás sikertelen');
        return;
      }

      toast.success('License sikeresen aktiválva!');
      router.push('/admin');
    } catch (error) {
      console.error('License activation error:', error);
      toast.error('Hiba történt a license aktiválása során');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">License aktiválás</h1>
            <a
              href="/admin"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Vissza a dashboard-ra
            </a>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <Key className="w-6 h-6 text-primary-600" />
              <h2 className="text-xl font-bold text-gray-900">License Key megadása</h2>
            </div>

            <form onSubmit={handleActivate} className="space-y-6">
              <div>
                <label htmlFor="licenseKey" className="block text-sm font-medium text-gray-700 mb-2">
                  License Key
                </label>
                <Input
                  id="licenseKey"
                  type="text"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                  required
                  disabled={isLoading}
                  placeholder="ZED-XXXX-XXXX-XXXX-XXXX"
                  className="font-mono"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Add meg a vásárolt license key-t. A formátum: ZED-XXXX-XXXX-XXXX-XXXX
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isLoading}
                >
                  Aktiválás
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => router.push('/admin')}
                  disabled={isLoading}
                >
                  Mégse
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

