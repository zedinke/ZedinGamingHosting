'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  read: boolean;
  createdAt: string;
}

interface NotificationsPanelProps {
  locale: string;
}

export function NotificationsPanel({ locale }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadNotifications();
    // Auto-refresh 30 másodpercenként
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [showAll]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/notifications?limit=${showAll ? 50 : 10}&unreadOnly=${!showAll}`);
      const data = await response.json();

      if (response.ok) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Load notifications error:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      toast.error('Hiba történt');
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
      });

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
        toast.success('Összes értesítés olvasottnak jelölve');
      }
    } catch (error) {
      toast.error('Hiba történt');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">
          Értesítések
          {unreadCount > 0 && (
            <span className="ml-2 px-2 py-1 bg-red-500 text-white text-sm rounded-full">
              {unreadCount}
            </span>
          )}
        </h2>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
            >
              Összes olvasottnak jelöl
            </button>
          )}
          <button
            onClick={() => setShowAll(!showAll)}
            className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
          >
            {showAll ? 'Csak olvasatlanok' : 'Összes'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Betöltés...</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Nincs értesítés</div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                !notification.read ? 'bg-blue-50 border-blue-200' : ''
              } ${getPriorityColor(notification.priority)}`}
              onClick={() => !notification.read && markAsRead(notification.id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{notification.title}</h3>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    )}
                  </div>
                  <p className="text-sm mt-1">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(notification.createdAt).toLocaleString('hu-HU')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

