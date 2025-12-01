'use client';

import { useState, useEffect } from 'react';
import { CronJobAction } from '@prisma/client';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Play, Clock, Mail, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface CronJob {
  id: string;
  name: string;
  description?: string;
  cronExpression: string;
  action: CronJobAction;
  gameType?: string;
  notifyOnSuccess: boolean;
  notifyOnFailure: boolean;
  notifyAlways: boolean;
  isActive: boolean;
  enabled: boolean;
  lastRun?: Date | null;
  lastResult?: string | null;
  lastError?: string | null;
  nextRun?: Date | null;
  runCount: number;
  successCount: number;
  failureCount: number;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
  executionCount: number;
}

interface CronJobManagerProps {
  serverId: string;
  locale: string;
}

export function CronJobManager({ serverId, locale }: CronJobManagerProps) {
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCronJob, setEditingCronJob] = useState<CronJob | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cronExpression: '',
    action: 'START' as CronJobAction,
    notifyOnSuccess: false,
    notifyOnFailure: false,
    notifyAlways: false,
    timezone: 'Europe/Budapest',
    isActive: true,
    enabled: true,
  });

  // Cron kifejezés részletek
  const [cronMinute, setCronMinute] = useState('*');
  const [cronHour, setCronHour] = useState('*');
  const [cronDay, setCronDay] = useState('*');
  const [cronMonth, setCronMonth] = useState('*');
  const [cronWeekday, setCronWeekday] = useState('*');

  useEffect(() => {
    fetchCronJobs();
  }, [serverId]);

  const fetchCronJobs = async () => {
    try {
      const response = await fetch(`/api/servers/${serverId}/cron-jobs`);
      const data = await response.json();

      if (data.success) {
        setCronJobs(data.cronJobs || []);
      }
    } catch (error) {
      console.error('Error fetching cron jobs:', error);
      toast.error('Hiba történt a cron job-ok betöltése során');
    } finally {
      setLoading(false);
    }
  };

  const buildCronExpression = () => {
    return `${cronMinute} ${cronHour} ${cronDay} ${cronMonth} ${cronWeekday}`;
  };

  const parseCronExpression = (expression: string) => {
    const parts = expression.split(' ');
    if (parts.length === 5) {
      setCronMinute(parts[0]);
      setCronHour(parts[1]);
      setCronDay(parts[2]);
      setCronMonth(parts[3]);
      setCronWeekday(parts[4]);
    }
  };

  const handleCreateOrUpdate = async () => {
    const cronExpression = buildCronExpression();

    if (!formData.name || !cronExpression || !formData.action) {
      toast.error('Név, cron kifejezés és művelet megadása kötelező');
      return;
    }

    try {
      const url = editingCronJob
        ? `/api/servers/${serverId}/cron-jobs/${editingCronJob.id}`
        : `/api/servers/${serverId}/cron-jobs`;

      const response = await fetch(url, {
        method: editingCronJob ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          cronExpression,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Hiba történt');
        return;
      }

      toast.success(editingCronJob ? 'Cron job frissítve' : 'Cron job létrehozva');
      setShowCreateModal(false);
      setEditingCronJob(null);
      resetForm();
      fetchCronJobs();
    } catch (error) {
      console.error('Error creating/updating cron job:', error);
      toast.error('Hiba történt');
    }
  };

  const handleDelete = async (cronJobId: string) => {
    if (!confirm('Biztosan törölni szeretnéd ezt a cron job-ot?')) {
      return;
    }

    try {
      const response = await fetch(`/api/servers/${serverId}/cron-jobs/${cronJobId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Hiba történt');
        return;
      }

      toast.success('Cron job törölve');
      fetchCronJobs();
    } catch (error) {
      console.error('Error deleting cron job:', error);
      toast.error('Hiba történt');
    }
  };

  const handleExecute = async (cronJobId: string) => {
    try {
      const response = await fetch(`/api/servers/${serverId}/cron-jobs/${cronJobId}/execute`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Hiba történt');
        return;
      }

      if (data.success) {
        toast.success('Cron job sikeresen végrehajtva');
      } else {
        toast.error(`Cron job végrehajtása sikertelen: ${data.error || 'Ismeretlen hiba'}`);
      }

      fetchCronJobs();
    } catch (error) {
      console.error('Error executing cron job:', error);
      toast.error('Hiba történt');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      cronExpression: '',
      action: 'START',
      notifyOnSuccess: false,
      notifyOnFailure: false,
      notifyAlways: false,
      timezone: 'Europe/Budapest',
      isActive: true,
      enabled: true,
    });
    setCronMinute('*');
    setCronHour('*');
    setCronDay('*');
    setCronMonth('*');
    setCronWeekday('*');
  };

  const openEditModal = (cronJob: CronJob) => {
    setEditingCronJob(cronJob);
    setFormData({
      name: cronJob.name,
      description: cronJob.description || '',
      cronExpression: cronJob.cronExpression,
      action: cronJob.action,
      notifyOnSuccess: cronJob.notifyOnSuccess,
      notifyOnFailure: cronJob.notifyOnFailure,
      notifyAlways: cronJob.notifyAlways,
      timezone: cronJob.timezone,
      isActive: cronJob.isActive,
      enabled: cronJob.enabled,
    });
    parseCronExpression(cronJob.cronExpression);
    setShowCreateModal(true);
  };

  const getActionLabel = (action: CronJobAction): string => {
    const labels: Record<CronJobAction, string> = {
      START: 'Indítás',
      STOP: 'Leállítás',
      RESTART: 'Újraindítás',
      UPDATE: 'Frissítés',
      WIPE: 'Teljes Wipe',
      BACKUP: 'Backup',
      CLEANUP: 'Cleanup',
      SAVE: 'Save Mentés',
    };
    return labels[action] || action;
  };

  const getResultIcon = (result?: string | null) => {
    if (!result) return null;
    switch (result) {
      case 'SUCCESS':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'SKIPPED':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Cron job-ok betöltése...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Fejléc és Új gomb */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Időzített Feladatok (Cron Jobs)</h2>
          <p className="text-gray-600 mt-1">Állíts be automatikus műveleteket a szerverhez</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingCronJob(null);
            setShowCreateModal(true);
          }}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Új Cron Job
        </button>
      </div>

      {/* Cron Job Lista */}
      {cronJobs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Még nincs időzített feladat</p>
          <button
            onClick={() => {
              resetForm();
              setEditingCronJob(null);
              setShowCreateModal(true);
            }}
            className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            Hozz létre egyet
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {cronJobs.map((cronJob) => (
            <div
              key={cronJob.id}
              className={`bg-white rounded-xl shadow-sm border ${
                cronJob.isActive && cronJob.enabled
                  ? 'border-green-200'
                  : 'border-gray-200 opacity-60'
              } p-6`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{cronJob.name}</h3>
                    {!cronJob.isActive || !cronJob.enabled ? (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                        Inaktív
                      </span>
                    ) : null}
                    {getResultIcon(cronJob.lastResult)}
                  </div>
                  
                  {cronJob.description && (
                    <p className="text-gray-600 text-sm mb-3">{cronJob.description}</p>
                  )}

                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Művelet</div>
                      <div className="font-medium">{getActionLabel(cronJob.action)}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Cron Kifejezés</div>
                      <div className="font-mono text-sm">{cronJob.cronExpression}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Következő Futás</div>
                      <div className="font-medium">
                        {cronJob.nextRun
                          ? new Date(cronJob.nextRun).toLocaleString('hu-HU', { timeZone: cronJob.timezone })
                          : 'Nincs beállítva'}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Utolsó Futás</div>
                      <div className="font-medium">
                        {cronJob.lastRun
                          ? new Date(cronJob.lastRun).toLocaleString('hu-HU', { timeZone: cronJob.timezone })
                          : 'Még nem futott'}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-600 mb-1">Statisztikák</div>
                      <div className="text-sm">
                        <span className="text-green-600 font-medium">{cronJob.successCount}</span> sikeres /{' '}
                        <span className="text-red-600 font-medium">{cronJob.failureCount}</span> sikertelen /{' '}
                        <span className="text-gray-600">{cronJob.runCount}</span> összes
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-600 mb-1">Email Értesítések</div>
                      <div className="flex items-center gap-2">
                        {cronJob.notifyAlways || cronJob.notifyOnSuccess || cronJob.notifyOnFailure ? (
                          <>
                            <Mail className="w-4 h-4 text-blue-600" />
                            <span className="text-sm">
                              {cronJob.notifyAlways
                                ? 'Mindig'
                                : `${cronJob.notifyOnSuccess ? 'Siker' : ''}${
                                    cronJob.notifyOnFailure ? 'Hiba' : ''
                                  }`}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm text-gray-400">Nincs</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {cronJob.lastError && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                      <div className="text-sm text-red-800 font-medium mb-1">Utolsó hiba:</div>
                      <div className="text-sm text-red-600">{cronJob.lastError}</div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => handleExecute(cronJob.id)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    title="Manuális végrehajtás"
                  >
                    <Play className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => openEditModal(cronJob)}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded"
                    title="Szerkesztés"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(cronJob.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    title="Törlés"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Létrehozás/Szerkesztés Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                {editingCronJob ? 'Cron Job Szerkesztése' : 'Új Cron Job Létrehozása'}
              </h3>
            </div>

            <div className="p-6 space-y-6">
              {/* Alapadatok */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Név *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="pl: Napi újraindítás"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Művelet *
                  </label>
                  <select
                    value={formData.action}
                    onChange={(e) => setFormData({ ...formData, action: e.target.value as CronJobAction })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="START">Indítás</option>
                    <option value="STOP">Leállítás</option>
                    <option value="RESTART">Újraindítás</option>
                    <option value="UPDATE">Frissítés</option>
                    <option value="WIPE">Teljes Wipe</option>
                    <option value="BACKUP">Backup</option>
                    <option value="CLEANUP">Cleanup</option>
                    <option value="SAVE">Save Mentés</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Leírás (opcionális)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={2}
                  placeholder="Rövid leírás a cron job-ról..."
                />
              </div>

              {/* Cron kifejezés beállítása */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Időzítés Beállítása</h4>
                
                <div className="grid md:grid-cols-5 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Perc (0-59)
                    </label>
                    <input
                      type="text"
                      value={cronMinute}
                      onChange={(e) => setCronMinute(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm"
                      placeholder="* vagy 0-59"
                    />
                    <p className="text-xs text-gray-500 mt-1">* = minden perc</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Óra (0-23)
                    </label>
                    <input
                      type="text"
                      value={cronHour}
                      onChange={(e) => setCronHour(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm"
                      placeholder="* vagy 0-23"
                    />
                    <p className="text-xs text-gray-500 mt-1">* = minden óra</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nap (1-31)
                    </label>
                    <input
                      type="text"
                      value={cronDay}
                      onChange={(e) => setCronDay(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm"
                      placeholder="* vagy 1-31"
                    />
                    <p className="text-xs text-gray-500 mt-1">* = minden nap</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hónap (1-12)
                    </label>
                    <input
                      type="text"
                      value={cronMonth}
                      onChange={(e) => setCronMonth(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm"
                      placeholder="* vagy 1-12"
                    />
                    <p className="text-xs text-gray-500 mt-1">* = minden hónap</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hét Napja (0-7)
                    </label>
                    <input
                      type="text"
                      value={cronWeekday}
                      onChange={(e) => setCronWeekday(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm"
                      placeholder="* vagy 0-7"
                    />
                    <p className="text-xs text-gray-500 mt-1">0,7 = vasárnap</p>
                  </div>
                </div>

                {/* Előre definiált sablonok */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gyors sablonok:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setCronMinute('0');
                        setCronHour('3');
                        setCronDay('*');
                        setCronMonth('*');
                        setCronWeekday('*');
                      }}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                    >
                      Minden nap 3:00
                    </button>
                    <button
                      onClick={() => {
                        setCronMinute('0');
                        setCronHour('*/6');
                        setCronDay('*');
                        setCronMonth('*');
                        setCronWeekday('*');
                      }}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                    >
                      6 óránként
                    </button>
                    <button
                      onClick={() => {
                        setCronMinute('0');
                        setCronHour('0');
                        setCronDay('*');
                        setCronMonth('*');
                        setCronWeekday('0');
                      }}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                    >
                      Minden vasárnap éjfél
                    </button>
                    <button
                      onClick={() => {
                        setCronMinute('30');
                        setCronHour('2');
                        setCronDay('1');
                        setCronMonth('*');
                        setCronWeekday('*');
                      }}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                    >
                      Havi 1. nap 2:30
                    </button>
                    <button
                      onClick={() => {
                        setCronMinute('*/15');
                        setCronHour('*');
                        setCronDay('*');
                        setCronMonth('*');
                        setCronWeekday('*');
                      }}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                    >
                      15 percenként
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Cron kifejezés:</div>
                  <div className="font-mono text-lg font-bold">
                    {buildCronExpression()}
                  </div>
                </div>
              </div>

              {/* Email értesítések */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Email Értesítések</h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.notifyAlways}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          notifyAlways: e.target.checked,
                          notifyOnSuccess: e.target.checked,
                          notifyOnFailure: e.target.checked,
                        });
                      }}
                      className="w-5 h-5 text-primary-600 rounded"
                    />
                    <span className="text-gray-700">Mindig küldj email-t (sikeres és sikertelen futásokról)</span>
                  </label>
                  
                  {!formData.notifyAlways && (
                    <>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.notifyOnSuccess}
                          onChange={(e) =>
                            setFormData({ ...formData, notifyOnSuccess: e.target.checked })
                          }
                          className="w-5 h-5 text-primary-600 rounded"
                        />
                        <span className="text-gray-700">Email küldése sikeres végrehajtáskor</span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.notifyOnFailure}
                          onChange={(e) =>
                            setFormData({ ...formData, notifyOnFailure: e.target.checked })
                          }
                          className="w-5 h-5 text-primary-600 rounded"
                        />
                        <span className="text-gray-700">Email küldése sikertelen végrehajtáskor</span>
                      </label>
                    </>
                  )}
                </div>
              </div>

              {/* További beállítások */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">További Beállítások</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Időzóna
                    </label>
                    <select
                      value={formData.timezone}
                      onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="Europe/Budapest">Europe/Budapest (UTC+1/+2)</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">America/New_York (UTC-5/-4)</option>
                      <option value="Europe/London">Europe/London (UTC+0/+1)</option>
                      <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-5 h-5 text-primary-600 rounded"
                    />
                    <span className="text-gray-700">Aktív</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enabled}
                      onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                      className="w-5 h-5 text-primary-600 rounded"
                    />
                    <span className="text-gray-700">Engedélyezve</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingCronJob(null);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Mégse
              </button>
              <button
                onClick={handleCreateOrUpdate}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                {editingCronJob ? 'Frissítés' : 'Létrehozás'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

