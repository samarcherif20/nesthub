"use client";

import { useTranslations } from "next-intl";
import { IoNotificationsOutline } from "react-icons/io5";
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
  const t = useTranslations("NotificationList");

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-gray-400 mt-2">{t("loading")}</p>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
        <div className="p-8 text-center">
          <div className="flex justify-center mb-2">
            <IoNotificationsOutline className="text-5xl text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-sm text-gray-400">{t("noNotifications")}</p>
        </div>
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