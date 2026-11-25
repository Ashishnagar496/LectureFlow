import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { NotificationPreferences, NotificationLog } from '../types';
import { dataService } from '../services/dataService';
import { notificationService } from '../services/notificationService';
import { useAuth } from './AuthContext';
import { useTimetable } from './TimetableContext';

interface NotificationContextType {
  preferences: NotificationPreferences | null;
  logs: NotificationLog[];
  loading: boolean;
  permissionStatus: NotificationPermission;
  toggleMasterNotifications: (enabled: boolean) => Promise<void>;
  quickEnablePush: () => Promise<boolean>;
  updatePreferences: (updates: Partial<NotificationPreferences>) => Promise<void>;
  sendTestAlert: (channel?: 'browser_push' | 'whatsapp' | 'sms') => Promise<{ delivered: boolean; preview: string }>;
  refreshLogs: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { todayLectures, isHolidayToday } = useTimetable();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [prefs, userLogs] = await Promise.all([
        dataService.getNotificationPreferences(user.id),
        dataService.getNotificationLogs(user.id)
      ]);
      setPreferences(prefs);
      setLogs(userLogs);
    } catch (e) {
      console.error('Error loading notification data:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleMasterNotifications = async (enabled: boolean) => {
    if (!user || !preferences) return;

    // 1. Update state & database immediately so UI toggle never hangs
    const updated = await dataService.updateNotificationPreferences(user.id, {
      enabled,
      browser_push_enabled: enabled ? preferences.browser_push_enabled : false,
      whatsapp_enabled: enabled ? (preferences.whatsapp_enabled ?? true) : preferences.whatsapp_enabled
    });
    setPreferences(updated);

    // 2. Sync browser push / service worker non-blockingly with a timeout
    if (enabled) {
      try {
        if (notificationService.isPushSupported()) {
          const perm = await notificationService.requestPermission();
          setPermissionStatus(perm);
          if (perm === 'granted') {
            await Promise.race([
              notificationService.subscribeUser(user.id),
              new Promise((resolve) => setTimeout(resolve, 2000))
            ]);
            const pushUpdated = await dataService.updateNotificationPreferences(user.id, {
              browser_push_enabled: true
            });
            setPreferences(pushUpdated);
          }
        }
      } catch {
        // Browser push optional if WhatsApp/SMS is used
      }
    } else {
      try {
        await Promise.race([
          notificationService.unsubscribeUser(),
          new Promise((resolve) => setTimeout(resolve, 1500))
        ]);
      } catch {
        // Non-blocking
      }
    }
  };

  // Automatic live lecture reminder scheduler (runs every 30s when enabled)
  useEffect(() => {
    if (!user || !preferences?.enabled || isHolidayToday || !todayLectures.length) return;

    const checkUpcomingLectures = async () => {
      const now = new Date();
      const nowTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      // Respect quiet hours
      if (preferences.quiet_hours_start && preferences.quiet_hours_end) {
        if (nowTimeStr >= preferences.quiet_hours_start || nowTimeStr <= preferences.quiet_hours_end) {
          return;
        }
      }

      const todayStr = now.toISOString().split('T')[0];
      const leadMins = preferences.reminder_minutes || 10;

      for (const lecture of todayLectures) {
        const [h, m] = lecture.start_time.split(':').map(Number);
        const start = new Date(now);
        start.setHours(h, m, 0, 0);
        const diffMins = Math.round((start.getTime() - now.getTime()) / 60000);

        if (diffMins >= 0 && diffMins <= leadMins) {
          const idempotencyKey = `auto_${user.id}_${lecture.id}_${todayStr}`;
          if (localStorage.getItem(idempotencyKey)) continue;

          localStorage.setItem(idempotencyKey, '1');
          const title = `Upcoming: ${lecture.subject_name}`;
          const body = `Starts in ${diffMins === 0 ? 'less than a minute' : `${diffMins} min`} at ${lecture.classroom || 'Classroom'}${lecture.faculty_name ? ` (${lecture.faculty_name})` : ''}.`;

          if (notificationService.getPermissionState() === 'granted') {
            try {
              if ('serviceWorker' in navigator) {
                const reg = await Promise.race([
                  navigator.serviceWorker.ready,
                  new Promise<null>((r) => setTimeout(() => r(null), 1000))
                ]);
                if (reg && 'showNotification' in reg) {
                  await reg.showNotification(title, { body, icon: '/vite.svg', tag: idempotencyKey });
                } else {
                  new Notification(title, { body, icon: '/vite.svg' });
                }
              } else {
                new Notification(title, { body, icon: '/vite.svg' });
              }
            } catch {
              // ignore browser restriction
            }
          }

          await dataService.addNotificationLog({
            user_id: user.id,
            lecture_id: lecture.id,
            channel: preferences.whatsapp_enabled ? 'whatsapp' : 'browser_push',
            delivery_status: 'delivered',
            message_preview: body,
            idempotency_key: idempotencyKey
          });
          await refreshLogs();
        }
      }
    };

    checkUpcomingLectures();
    const interval = setInterval(checkUpcomingLectures, 30000);
    return () => clearInterval(interval);
  }, [user, preferences, todayLectures, isHolidayToday]);

  const quickEnablePush = async (): Promise<boolean> => {
    if (!user) return false;
    await toggleMasterNotifications(true);
    try {
      await sendTestAlert('browser_push');
    } catch {
      // Permission might be blocked; master toggle still saved
    }
    return true;
  };

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    if (!user || !preferences) return;
    const updated = await dataService.updateNotificationPreferences(user.id, updates);
    setPreferences(updated);
  };

  const sendTestAlert = async (channel: 'browser_push' | 'whatsapp' | 'sms' = 'browser_push') => {
    if (!user) return { delivered: false, preview: '' };
    const recipient = channel === 'whatsapp' ? preferences?.whatsapp_number : preferences?.sms_number;
    const res = await notificationService.sendTestNotification(user.id, channel, recipient);
    if (res.delivered) {
      await refreshLogs();
    }
    return res;
  };

  const refreshLogs = async () => {
    if (!user) return;
    const userLogs = await dataService.getNotificationLogs(user.id);
    setLogs(userLogs);
  };

  return (
    <NotificationContext.Provider
      value={{
        preferences,
        logs,
        loading,
        permissionStatus,
        toggleMasterNotifications,
        quickEnablePush,
        updatePreferences,
        sendTestAlert,
        refreshLogs
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within a NotificationProvider');
  return context;
};
