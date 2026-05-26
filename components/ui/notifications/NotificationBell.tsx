"use client";

import { useState, useEffect, useCallback } from "react";
import {
  IoNotificationsOutline,
  IoNotifications,
  IoNotificationsOffOutline,
  IoNotificationsOff,
} from "react-icons/io5";
import NotificationList from "./NotificationList";

interface Notification {
  id: string;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  data?: any;
}

interface NotificationBellProps {
  muted?: boolean;
}

export default function NotificationBell({ muted = false }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (muted) return;

    setLoading(true);
    try {
      const response = await fetch("/api/notifications?limit=50");
      const data = await response.json();
      const notificationsArray = Array.isArray(data)
        ? data
        : data.notifications || [];

      const oldUnreadCount = unreadCount;
      const newUnreadCount = notificationsArray.filter(
        (n: Notification) => !n.isRead,
      ).length;

      setNotifications(notificationsArray);
      setUnreadCount(newUnreadCount);

      if (newUnreadCount > oldUnreadCount && newUnreadCount > 0) {
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 1000);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [unreadCount, muted]);

  useEffect(() => {
    if (!muted) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [fetchNotifications, muted]);

  const handleMarkAsRead = async (notificationId: string) => {
    if (muted) return;
    try {
      const response = await fetch(
        `/api/notifications/${notificationId}/read`,
        { method: "PUT" },
      );
      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notificationId ? { ...notif, isRead: true } : notif,
          ),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleAccept = async (
    infoRequestId: string,
    notificationId: string,
  ) => {
    if (muted) return;
    setProcessingAction(notificationId);
    try {
      const response = await fetch(
        `/api/info-requests/${infoRequestId}/respond`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "ACCEPTED" }),
        },
      );
      if (response.ok) {
        await handleMarkAsRead(notificationId);
        await fetchNotifications();
      }
    } catch (error) {
      console.error("Error accepting:", error);
    } finally {
      setProcessingAction(null);
    }
  };

  const handleReject = async (
    infoRequestId: string,
    notificationId: string,
  ) => {
    if (muted) return;
    setProcessingAction(notificationId);
    try {
      const response = await fetch(
        `/api/info-requests/${infoRequestId}/respond`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "REJECTED" }),
        },
      );
      if (response.ok) {
        await handleMarkAsRead(notificationId);
        await fetchNotifications();
      }
    } catch (error) {
      console.error("Error rejecting:", error);
    } finally {
      setProcessingAction(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (muted) return;
    try {
      await fetch("/api/notifications/read-all", { method: "PUT" });
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true })),
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  // ✅ CAS 1: Muet - Bell OFF (barrée)
  if (muted) {
    return (
      <div className="relative">
        <button
          className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors focus:outline-none opacity-60 cursor-not-allowed"
          disabled
          title="Notifications désactivées"
        >
          <IoNotificationsOff className="text-2xl text-gray-400 dark:text-gray-500" />
        </button>
      </div>
    );
  }

  // ✅ CAS 2: Non muet - Bell pleine si notifications, vide sinon
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors focus:outline-none ${
          isAnimating ? "animate-swing" : ""
        }`}
      >
        {unreadCount > 0 ? (
          <>
            <IoNotifications className="text-2xl text-blue-500" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md shadow-rose-500/30">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          </>
        ) : (
          <IoNotificationsOutline className="text-2xl text-gray-500 dark:text-gray-400" />
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 z-[9999] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-800">
              <h3 className="font-bold text-gray-900 dark:text-white">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-blue-500 hover:text-blue-600 transition"
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>
            <NotificationList
              notifications={notifications}
              loading={loading}
              onMarkAsRead={handleMarkAsRead}
              onAccept={handleAccept}
              onReject={handleReject}
              onClose={() => setIsOpen(false)}
              processingAction={processingAction}
            />
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes swing {
          0% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(15deg);
          }
          50% {
            transform: rotate(-15deg);
          }
          75% {
            transform: rotate(8deg);
          }
          100% {
            transform: rotate(0deg);
          }
        }
        .animate-swing {
          animation: swing 0.6s ease-in-out;
          transform-origin: top center;
        }
      `}</style>
    </div>
  );
}