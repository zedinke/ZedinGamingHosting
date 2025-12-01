'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import toast from 'react-hot-toast';
import { Package, Check, X } from 'lucide-react';

interface Module {
  name: string;
  displayName: string;
  description: string;
  category: string;
  version: string;
  isInstalled?: boolean;
  isActive?: boolean;
}

interface InstalledModule extends Module {
  id: string;
  settings?: Array<{
    key: string;
    value: string;
    isSecret: boolean;
  }>;
}

export default function SystemInstallationPage() {
  const [availableModules, setAvailableModules] = useState<Module[]>([]);
  const [installedModules, setInstalledModules] = useState<InstalledModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [config, setConfig] = useState<Record<string, string>>({});
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const response = await fetch('/api/admin/modules');
      const data = await response.json();
      setAvailableModules(data.available || []);
      setInstalledModules(data.installed || []);
    } catch (error) {
      console.error('Modules fetch error:', error);
      toast.error('Hiba történt a modulok betöltése során');
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = async (module: Module) => {
    setSelectedModule(module);
    setConfig({});
  };

  const handleSubmitInstall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModule) return;

    setInstalling(true);
    try {
      const response = await fetch('/api/admin/modules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          moduleName: selectedModule.name,
          config,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Modul telepítés sikertelen');
        return;
      }

      toast.success('Modul sikeresen telepítve!');
      setSelectedModule(null);
      setConfig({});
      fetchModules();
    } catch (error) {
      console.error('Module installation error:', error);
      toast.error('Hiba történt a modul telepítése során');
    } finally {
      setInstalling(false);
    }
  };

  const handleUninstall = async (moduleName: string) => {
    if (!confirm(`Biztosan eltávolítod a(z) ${moduleName} modult?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/modules?moduleName=${moduleName}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Modul eltávolítás sikertelen');
        return;
      }

      toast.success('Modul sikeresen eltávolítva!');
      fetchModules();
    } catch (error) {
      console.error('Module uninstallation error:', error);
      toast.error('Hiba történt a modul eltávolítása során');
    }
  };

  const getCategoryName = (category: string) => {
    const categories: Record<string, string> = {
      DATABASE: 'Adatbázis',
      COMMUNICATION: 'Kommunikáció',
      PAYMENT: 'Fizetés',
      FEATURE: 'Funkció',
      INTEGRATION: 'Integráció',
    };
    return categories[category] || category;
  };

  const isInstalled = (moduleName: string) => {
    return installedModules.some((m) => m.name === moduleName && m.isInstalled);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Modulok betöltése...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Modul telepítés</h1>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Elérhető modulok */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Elérhető modulok</h2>
            <div className="space-y-4">
              {availableModules.map((module) => (
                <Card key={module.name}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-5 h-5 text-primary-600" />
                        <h3 className="font-semibold text-gray-900">{module.displayName}</h3>
                        <Badge variant="info">{getCategoryName(module.category)}</Badge>
                        {isInstalled(module.name) && (
                          <Badge variant="success">Telepítve</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{module.description}</p>
                      <p className="text-xs text-gray-500">Verzió: {module.version}</p>
                    </div>
                    <div className="ml-4">
                      {isInstalled(module.name) ? (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleUninstall(module.name)}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Eltávolítás
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleInstall(module)}
                        >
                          Telepítés
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Telepítés form */}
          {selectedModule && (
            <div>
              <Card>
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {selectedModule.displayName} telepítése
                </h2>
                <form onSubmit={handleSubmitInstall} className="space-y-4">
                  {/* Itt kellene dinamikusan generálni a konfigurációs mezőket */}
                  {/* Egyszerűsített verzió - manuális mezők */}
                  {selectedModule.category === 'DATABASE' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Host
                        </label>
                        <Input
                          value={config.host || ''}
                          onChange={(e) => setConfig({ ...config, host: e.target.value })}
                          required
                          disabled={installing}
                          placeholder="localhost"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Port
                        </label>
                        <Input
                          type="number"
                          value={config.port || ''}
                          onChange={(e) => setConfig({ ...config, port: e.target.value })}
                          required
                          disabled={installing}
                          placeholder="3306"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Felhasználónév
                        </label>
                        <Input
                          value={config.username || ''}
                          onChange={(e) => setConfig({ ...config, username: e.target.value })}
                          required
                          disabled={installing}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Jelszó
                        </label>
                        <Input
                          type="password"
                          value={config.password || ''}
                          onChange={(e) => setConfig({ ...config, password: e.target.value })}
                          required
                          disabled={installing}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Adatbázis név
                        </label>
                        <Input
                          value={config.database || ''}
                          onChange={(e) => setConfig({ ...config, database: e.target.value })}
                          required
                          disabled={installing}
                        />
                      </div>
                    </>
                  )}

                  {selectedModule.category === 'COMMUNICATION' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SMTP Host
                        </label>
                        <Input
                          value={config.host || ''}
                          onChange={(e) => setConfig({ ...config, host: e.target.value })}
                          required
                          disabled={installing}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SMTP Port
                        </label>
                        <Input
                          type="number"
                          value={config.port || ''}
                          onChange={(e) => setConfig({ ...config, port: e.target.value })}
                          required
                          disabled={installing}
                          placeholder="587"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Felhasználónév
                        </label>
                        <Input
                          value={config.username || ''}
                          onChange={(e) => setConfig({ ...config, username: e.target.value })}
                          required
                          disabled={installing}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Jelszó
                        </label>
                        <Input
                          type="password"
                          value={config.password || ''}
                          onChange={(e) => setConfig({ ...config, password: e.target.value })}
                          required
                          disabled={installing}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Küldő email
                        </label>
                        <Input
                          type="email"
                          value={config.from || ''}
                          onChange={(e) => setConfig({ ...config, from: e.target.value })}
                          required
                          disabled={installing}
                        />
                      </div>
                    </>
                  )}

                  <div className="flex gap-4">
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={installing}
                    >
                      Telepítés
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSelectedModule(null);
                        setConfig({});
                      }}
                      disabled={installing}
                    >
                      Mégse
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          )}

          {/* Telepített modulok lista */}
          {installedModules.length > 0 && !selectedModule && (
            <div className="lg:col-span-2">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Telepített modulok</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {installedModules.map((module) => (
                  <Card key={module.id}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Check className="w-5 h-5 text-green-600" />
                          <h3 className="font-semibold text-gray-900">{module.displayName}</h3>
                          {module.isActive && <Badge variant="success">Aktív</Badge>}
                        </div>
                        <p className="text-sm text-gray-600">{module.description}</p>
                        <p className="text-xs text-gray-500 mt-1">Verzió: {module.version}</p>
                      </div>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleUninstall(module.name)}
                      >
                        Eltávolítás
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

