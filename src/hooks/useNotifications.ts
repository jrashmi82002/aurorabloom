import { useEffect, useState, useCallback } from "react";
import { useAuth } from "./useAuth";
import { notificationsService, type Notification } from "@/services/notifications.service";

/**
 * Loads + subscribes to the current user's notifications. Provides actions
 * to mark read, mark all read, and remove.
 */
export function useNotifications() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setItems(await notificationsService.list(user.id));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user) return;
    return notificationsService.subscribe(user.id, (n) => {
      setItems((prev) => [n, ...prev]);
    });
  }, [user]);

  const unreadCount = items.filter((n) => !n.is_read).length;

  return {
    items,
    loading,
    unreadCount,
    refresh,
    markRead: async (id: string) => {
      await notificationsService.markRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    },
    markAllRead: async () => {
      if (!user) return;
      await notificationsService.markAllRead(user.id);
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    },
    remove: async (id: string) => {
      await notificationsService.remove(id);
      setItems((prev) => prev.filter((n) => n.id !== id));
    },
  };
}
