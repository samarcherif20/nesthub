"use client";

import NotificationItem from "./NotificationItem";

interface Notification {
  id: string;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  data?: any;
}

interface NotificationListProps {
  notifications: Notification[];
  loading: boolean;
  onMarkAsRead: (id: string) => void;
  onAccept?: (infoRequestId: string, notificationId: string) => void;
  onReject?: (infoRequestId: string, notificationId: string) => void;
  onClose: () => void;
  processingAction?: string | null;
}

export default function NotificationList({
  notifications,
  loading,
  onMarkAsRead,
  onAccept,
  onReject,
  onClose,
  processingAction,
}: NotificationListProps) {
  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-gray-400 mt-2">Chargement...</p>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-4xl mb-2">🔔</div>
        <p className="text-sm text-gray-400">Aucune notification</p>
      </div>
    );
  }

  return (
    <div className="max-h-96 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onMarkAsRead={onMarkAsRead}
          onAccept={onAccept}
          onReject={onReject}
          onClose={onClose}
          processingAction={processingAction}
        />
      ))}
    </div>
  );
}
