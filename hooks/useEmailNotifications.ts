// hooks/useEmailNotification.ts
import { useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';

interface NotificationData {
  userId: string;
  actionType: 'SUSPEND' | 'BAN' | 'WARNING' | 'ACTIVATE' | 'LOCK' | 'UNLOCK' | 'ESCALATE';
  motif?: string;
  reason?:string;
  duration?: number;
  level?: number;
}

export function useEmailNotification() {
  const { getToken } = useAuth();

  const sendNotification = useCallback(async (data: NotificationData) => {
    try {
      const token = await getToken({ template: 'my-app-template' });
      
      if (!token) {
        throw new Error('Token non disponible');
      }

      console.log(' Envoi notification:', data);

      const response = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Erreur envoi notification');
      }

      console.log(' Notification envoyée:', responseData);
      return responseData;

    } catch (error) {
      console.error(' Erreur envoi notification:', error);
      throw error;
    }
  }, [getToken]);

  return { sendNotification };
}