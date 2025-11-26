'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

interface ServerDeleteDialogProps {
  serverId: string;
  serverName: string;
  locale: string;
  onClose: () => void;
  onDeleted: () => void;
}

export function ServerDeleteDialog({
  serverId,
  serverName,
  locale,
  onClose,
  onDeleted,
}: ServerDeleteDialogProps) {
  const [reason, setReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!reason.trim()) {
      toast.error('Kérjük, add meg az indoklást a szerver törléséhez');
      return;
    }

    if (reason.trim().length < 10) {
      toast.error('Az indoklásnak legalább 10 karakter hosszúnak kell lennie');
      return;
    }

    if (
      !confirm(
        `Biztosan törölni szeretnéd a(z) "${serverName}" szervert?\n\nEz a művelet VISSZAVONHATATLAN!\n\nIndoklás: ${reason}`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/servers/${serverId}/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: reason.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Szerver törlése sikertelen');
        return;
      }

      toast.success('Szerver sikeresen törölve');
      onDeleted();
      onClose();
    } catch (error) {
      toast.error('Hiba történt a szerver törlése során');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Szerver Törlése</h2>

        <div className="mb-4">
          <p className="text-gray-700 mb-2">
            Biztosan törölni szeretnéd a következő szervert?
          </p>
          <p className="font-semibold text-lg text-red-600 mb-4">{serverName}</p>
          <p className="text-sm text-red-600 font-medium mb-4">
            ⚠️ Figyelem: Ez a művelet VISSZAVONHATATLAN! A szerver minden fájlja, backup-ja és
            konfigurációja véglegesen törlődik.
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Indoklás <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Add meg az indoklást, miért törlöd ezt a szervert. Ez az indoklás megjelenik a felhasználónak, manager-nek és admin-nek értesítésben és email-ben."
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
            disabled={isDeleting}
          />
          <p className="text-xs text-gray-500 mt-1">
            Minimum 10 karakter. ({reason.length} / 10)
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Mégse
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting || !reason.trim() || reason.trim().length < 10}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isDeleting ? 'Törlés...' : 'Szerver Törlése'}
          </button>
        </div>
      </div>
    </div>
  );
}

