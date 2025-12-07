'use client';

import { useState, useEffect, useMemo } from 'react';
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

interface NotificationsListProps {
  locale: string;
}

export function NotificationsList({ locale }: NotificationsListProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(true);

  useEffect(() => {
    loadNotifications();
    // Auto-refresh 30 másodpercenként
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAll]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/notifications?limit=100&unreadOnly=${!showAll}`);
      const data = await response.json();

      if (response.ok) {
        // Duplikációk eltávolítása ID alapján
        const notificationsData = (data.notifications || []) as Notification[];
        const uniqueNotifications: Notification[] = Array.from(
          new Map(notificationsData.map((n: Notification) => [n.id, n])).values()
        );
        setNotifications(uniqueNotifications);
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
        loadNotifications(); // Frissítés
      }
    } catch (error) {
      toast.error('An error occurred');
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
        toast.success('All notifications marked as read');
        loadNotifications(); // Refresh
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  // Filter notifications (duplikációk nélkül)
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification, index, self) =>
      index === self.findIndex((n) => n.id === notification.id)
    );
  }, [notifications]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          Értesítések
          {unreadCount > 0 && (
            <span className="ml-2 px-2.5 py-1 bg-red-500 text-white text-sm rounded-full">
              {unreadCount}
            </span>
          )}
        </h2>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Összes olvasottnak jelöl
            </button>
          )}
          <button
            onClick={() => setShowAll(!showAll)}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            {showAll ? 'Csak olvasatlanok' : 'Összes'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-600">Loading...</div>
      ) : filteredNotifications.length === 0 ? (
        <div className="text-center py-12 text-gray-600">No notifications</div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 border rounded-lg cursor-pointer hover:shadow-md transition-all ${
                !notification.read
                  ? 'bg-white border-gray-300 shadow-sm'
                  : 'bg-blue-50 border-blue-200'
              }`}
              onClick={() => !notification.read && markAsRead(notification.id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                    )}
                  </div>
                  <p className="text-sm mt-1 text-gray-700">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(notification.createdAt).toLocaleString('hu-HU', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
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

