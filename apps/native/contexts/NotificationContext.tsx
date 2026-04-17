import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import {
  registerForPushNotificationsAsync,
  addNotificationListeners,
  setBadgeCount,
} from '../lib/pushNotifications';
import { useAuth } from './AuthContext';

type NotificationContextType = {
  pushToken: string | null;
  notification: Notifications.Notification | null;
  unreadCount: number;
  clearUnreadCount: () => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const listenerCleanup = useRef<(() => void) | null>(null);

  const clearUnreadCount = useCallback(async () => {
    setUnreadCount(0);
    await setBadgeCount(0);
  }, []);

  useEffect(() => {
    if (!user) {
      setPushToken(null);
      setUnreadCount(0);
      return;
    }

    registerForPushNotificationsAsync().then(token => {
      if (token) setPushToken(token);
    });

    listenerCleanup.current = addNotificationListeners(
      incoming => {
        setNotification(incoming);
        setUnreadCount(prev => {
          const next = prev + 1;
          setBadgeCount(next);
          return next;
        });
      },
      response => {
        const data = response.notification.request.content.data;
        console.log('Notification tapped:', data);
      },
    );

    return () => {
      if (listenerCleanup.current) listenerCleanup.current();
    };
  }, [user]);

  return (
    <NotificationContext.Provider value={{ pushToken, notification, unreadCount, clearUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
