import { dataService } from './dataService';

export const DEFAULT_VAPID_PUBLIC_KEY =
  import.meta.env.VITE_VAPID_PUBLIC_KEY ||
  'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const notificationService = {
  isPushSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  },

  getPermissionState(): NotificationPermission {
    if (!('Notification' in window)) return 'denied';
    return Notification.permission;
  },

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Push notifications are not supported in this browser.');
    }
    return await Notification.requestPermission();
  },

  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) return null;
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((resolve) => setTimeout(resolve, 1500))
      ]);
      return reg;
    } catch (err) {
      console.warn('ServiceWorker registration note:', err);
      return null;
    }
  },

  async subscribeUser(userId: string): Promise<PushSubscription | null> {
    const reg = await this.registerServiceWorker();
    if (!reg) return null;

    try {
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        const convertedVapidKey = urlBase64ToUint8Array(DEFAULT_VAPID_PUBLIC_KEY);
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey as unknown as BufferSource
        });
      }
      if (sub && userId) {
        try {
          const jsonSub = sub.toJSON();
          if (jsonSub.keys && jsonSub.endpoint) {
            localStorage.setItem(`lf_push_sub_${userId}`, JSON.stringify(jsonSub));
          }
        } catch {
          // non-critical
        }
      }
      return sub;
    } catch (err) {
      console.warn('Push subscription note:', err);
      return null;
    }
  },

  async unsubscribeUser(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) return false;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        return await sub.unsubscribe();
      }
      return true;
    } catch {
      return false;
    }
  },

  async sendTestNotification(
    userId: string,
    channel: 'browser_push' | 'whatsapp' | 'sms' = 'browser_push',
    recipientNumber?: string
  ): Promise<{ delivered: boolean; preview: string }> {
    const title = 'LectureFlow: Upcoming Lecture Alert';
    const body = 'Database Management Systems starts in 10 minutes at Room 301 (Dr. Ramesh Sharma).';

    if (channel === 'whatsapp') {
      // Log WhatsApp dispatch preview (actual delivery occurs via Edge Function + Meta Cloud API)
      await dataService.addNotificationLog({
        user_id: userId,
        channel: 'whatsapp',
        delivery_status: 'preview',
        message_preview: `WhatsApp to ${recipientNumber || 'registered number'}: ${body}`,
        idempotency_key: `wa_test_${Date.now()}`
      });
      return {
        delivered: true,
        preview: `WhatsApp template prepared for ${recipientNumber || 'your number'}: "${body}"`
      };
    }

    if (channel === 'sms') {
      await dataService.addNotificationLog({
        user_id: userId,
        channel: 'sms',
        delivery_status: 'preview',
        message_preview: `SMS to ${recipientNumber || 'registered number'}: ${body}`,
        idempotency_key: `sms_test_${Date.now()}`
      });
      return {
        delivered: true,
        preview: `SMS payload prepared for ${recipientNumber || 'your number'}: "${body}"`
      };
    }

    const perm = this.getPermissionState();
    if (perm !== 'granted') {
      const newPerm = await this.requestPermission();
      if (newPerm !== 'granted') {
        throw new Error('Browser notification permission was denied.');
      }
    }

    try {
      if ('serviceWorker' in navigator) {
        const reg = await Promise.race([
          navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(() => navigator.serviceWorker.ready),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 1000))
        ]);
        if (reg && reg.showNotification) {
          await reg.showNotification(title, {
            body,
            icon: '/vite.svg',
            badge: '/vite.svg',
            tag: `test-reminder-${Date.now()}`,
            data: { url: '/dashboard' }
          });

          await dataService.addNotificationLog({
            user_id: userId,
            channel: 'test',
            delivery_status: 'delivered',
            message_preview: body,
            idempotency_key: `test_${Date.now()}`
          });
          return { delivered: true, preview: body };
        }
      }
    } catch {
      // fallback to window Notification
    }

    // Direct browser Notification fallback (instant, never hangs)
    new Notification(title, { body, icon: '/vite.svg', tag: `test-reminder-${Date.now()}` });
    await dataService.addNotificationLog({
      user_id: userId,
      channel: 'test',
      delivery_status: 'delivered',
      message_preview: body,
      idempotency_key: `test_${Date.now()}`
    });

    return { delivered: true, preview: body };
  }
};
