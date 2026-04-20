"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import {
  IoCheckmarkCircle,
  IoCloseCircleOutline,
  IoPersonOutline,
  IoCalendarOutline,
  IoMailOutline,
  IoTimeOutline,
} from "react-icons/io5";

interface Notification {
  id: string;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  data?: {
    infoRequestId?: string;
    listingId?: string;
    tenantId?: string;
    tenantName?: string;
    tenantEmail?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
  };
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onAccept?: (infoRequestId: string, notificationId: string) => void;
  onReject?: (infoRequestId: string, notificationId: string) => void;
  onClose: () => void;
  processingAction?: string | null;
}

const getIcon = (type: string) => {
  switch (type) {
    case "INFO_REQUEST_RECEIVED":
      return <IoCalendarOutline className="text-amber-500 text-xl" />;
    case "INFO_REQUEST_ACCEPTED":
      return <IoCheckmarkCircle className="text-emerald-500 text-xl" />;
    case "INFO_REQUEST_REJECTED":
      return <IoCloseCircleOutline className="text-red-500 text-xl" />;
    case "INFO_REQUEST_EXPIRED":
      return <IoTimeOutline className="text-gray-500 text-xl" />;
    default:
      return <IoCalendarOutline className="text-gray-500 text-xl" />;
  }
};

export default function NotificationItem({
  notification,
  onMarkAsRead,
  onAccept,
  onReject,
  onClose,
  processingAction,
}: NotificationItemProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleMarkAsRead = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
  };

  const handleAccept = async () => {
    if (onAccept && notification.data?.infoRequestId) {
      setIsProcessing(true);
      try {
        const response = await fetch(
          `/api/info-requests/${notification.data.infoRequestId}/accept`,
          {
            method: "POST",
          },
        );
        if (response.ok) {
          onAccept(notification.data.infoRequestId, notification.id);
        } else {
          const error = await response.json();
          console.error("Erreur:", error);
        }
      } catch (error) {
        console.error("Erreur acceptation:", error);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleReject = async () => {
    if (onReject && notification.data?.infoRequestId) {
      setIsProcessing(true);
      try {
        const response = await fetch(
          `/api/info-requests/${notification.data.infoRequestId}/reject`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              reason: "Le propriétaire n'est pas disponible pour ces dates",
            }),
          },
        );
        if (response.ok) {
          onReject(notification.data.infoRequestId, notification.id);
        }
      } catch (error) {
        console.error("Erreur refus:", error);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: fr,
  });

  const isInfoRequest = notification.type === "INFO_REQUEST_RECEIVED";
  const isProcessingAction =
    processingAction === notification.id || isProcessing;

  return (
    <div
      className={`p-4 transition-colors ${
        notification.isRead
          ? "bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800"
          : "bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/30"
      }`}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
            {getIcon(notification.type)}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {notification.title}
            </p>
            <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
              {timeAgo}
            </span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {notification.content}
          </p>

          {/* Détails supplémentaires pour les demandes d'information */}
          {isInfoRequest && notification.data && (
            <div className="mt-2 p-2 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <IoPersonOutline className="text-sky-500" />
                <span className="font-medium">Locataire:</span>{" "}
                {notification.data.tenantName || "Non spécifié"}
              </p>
              {notification.data.tenantEmail && (
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                  <IoMailOutline className="text-sky-500" />
                  <span className="font-medium">Email:</span>{" "}
                  {notification.data.tenantEmail}
                </p>
              )}
              {notification.data.checkIn && notification.data.checkOut && (
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                  <IoCalendarOutline className="text-sky-500" />
                  <span className="font-medium">Dates:</span>{" "}
                  {new Date(notification.data.checkIn).toLocaleDateString(
                    "fr-FR",
                  )}{" "}
                  →{" "}
                  {new Date(notification.data.checkOut).toLocaleDateString(
                    "fr-FR",
                  )}
                </p>
              )}
              {notification.data.guests && (
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                  <IoPersonOutline className="text-sky-500" />
                  <span className="font-medium">Voyageurs:</span>{" "}
                  {notification.data.guests} personne
                  {notification.data.guests > 1 ? "s" : ""}
                </p>
              )}
            </div>
          )}

          {/* Boutons d'action pour les demandes d'information non traitées */}
          {isInfoRequest && !notification.isRead && onAccept && onReject && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleAccept}
                disabled={isProcessingAction}
                className="px-3 py-1.5 text-xs font-semibold bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition disabled:opacity-50 flex items-center gap-1"
              >
                <IoCheckmarkCircle className="text-sm" />
                Accepter
              </button>
              <button
                onClick={handleReject}
                disabled={isProcessingAction}
                className="px-3 py-1.5 text-xs font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50 flex items-center gap-1"
              >
                <IoCloseCircleOutline className="text-sm" />
                Refuser
              </button>
              <button
                onClick={handleMarkAsRead}
                disabled={isProcessingAction}
                className="px-3 py-1.5 text-xs font-semibold bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition disabled:opacity-50"
              >
                Ignorer
              </button>
            </div>
          )}

          {/* Lien pour voir le profil si disponible */}
          {notification.data?.tenantId && (
            <Link
              href={`/fr/dashboard/owner/tenant/${notification.data.tenantId}`}
              className="inline-block mt-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
              onClick={handleMarkAsRead}
            >
              Voir le profil du locataire →
            </Link>
          )}

          {/* Bouton simple "Marquer comme lu" pour les autres types */}
          {!notification.isRead && !isInfoRequest && (
            <button
              onClick={handleMarkAsRead}
              className="mt-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Marquer comme lu
            </button>
          )}
        </div>

        {/* Indicateur non lu */}
        {!notification.isRead && (
          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
        )}
      </div>
    </div>
  );
}
