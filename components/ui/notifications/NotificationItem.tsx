"use client";

import { useState, useEffect } from "react";
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
  IoHomeOutline,
  IoCreateOutline,
  IoGitBranchOutline,
  IoChatbubbleOutline,
  IoStarOutline,
  IoCardOutline,
  IoPricetagOutline,
  IoCheckmarkDoneCircle,
  IoCloseCircle,
  IoDocumentTextOutline,
  IoCashOutline,
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
    listingTitle?: string;
    tenantId?: string;
    tenantName?: string;
    tenantUsername?: string;
    tenantEmail?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    rejectionReason?: string;
    changes?: any[];
    currentCheckOut?: string;
    requestedCheckOut?: string;
    additionalNights?: number;
    additionalPrice?: number;
    message?: string;
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

// Icônes avec couleurs différenciées
const getIcon = (type: string) => {
  // Demandes d'information
  if (type === "INFO_REQUEST_RECEIVED")
    return <IoCalendarOutline className="text-amber-500" />;
  if (type === "INFO_REQUEST_ACCEPTED")
    return <IoCheckmarkCircle className="text-emerald-500" />;
  if (type === "INFO_REQUEST_REJECTED")
    return <IoCloseCircleOutline className="text-red-500" />;
  if (type === "INFO_REQUEST_EXPIRED")
    return <IoTimeOutline className="text-gray-400" />;

  // Annonces - nouvelles
  if (type === "LISTING_PENDING_REVIEW")
    return <IoCreateOutline className="text-orange-500" />;
  if (type === "LISTING_APPROVED")
    return <IoCheckmarkDoneCircle className="text-emerald-500" />;
  if (type === "LISTING_REJECTED")
    return <IoCloseCircle className="text-red-500" />;
  if (type === "LISTING_ACTIVATED")
    return <IoHomeOutline className="text-emerald-500" />;

  // Annonces - modifications
  if (type === "LISTING_REVISION_APPROVED")
    return <IoGitBranchOutline className="text-purple-500" />;
  if (type === "LISTING_REVISION_REJECTED")
    return <IoGitBranchOutline className="text-red-500" />;

  // Demandes de prolongation
  if (type === "BOOKING_REQUEST")
    return <IoCalendarOutline className="text-blue-500" />;

  // Autres
  if (type === "NEW_MESSAGE")
    return <IoChatbubbleOutline className="text-sky-500" />;
  if (type === "NEW_REVIEW")
    return <IoStarOutline className="text-yellow-500" />;
  if (type === "PAYMENT_RECEIVED")
    return <IoCashOutline className="text-emerald-500" />;
  if (type === "PAYMENT_REFUNDED")
    return <IoCardOutline className="text-red-500" />;
  if (type === "FAVORITE_PRICE_CHANGE")
    return <IoPricetagOutline className="text-pink-500" />;

  // Offres
  if (type === "OFFER_CREATED")
    return <IoDocumentTextOutline className="text-blue-500" />;
  if (type === "OFFER_ACCEPTED")
    return <IoCheckmarkCircle className="text-emerald-500" />;
  if (type === "OFFER_REJECTED")
    return <IoCloseCircleOutline className="text-red-500" />;

  // Default
  return <IoHomeOutline className="text-gray-400" />;
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

  // Debug log
  useEffect(() => {
    if (notification.type === "BOOKING_REQUEST") {
      console.log("🔔 NOTIFICATION BOOKING_REQUEST:", notification);
      console.log("   - data:", notification.data);
    }
  }, [notification]);

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
          { method: "POST" },
        );
        if (response.ok) {
          onAccept(notification.data.infoRequestId, notification.id);
        }
      } catch (error) {
        console.error("Erreur:", error);
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
        console.error("Erreur:", error);
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
  const isBookingRequest = notification.type === "BOOKING_REQUEST";
  const isProcessingAction =
    processingAction === notification.id || isProcessing;

  // Récupérer le nom d'affichage (username ou nom complet)
  const displayName =
    notification.data?.tenantUsername ||
    notification.data?.tenantName ||
    "Un locataire";

  return (
    <div
      className={`p-4 transition-colors ${
        notification.isRead
          ? "bg-white dark:bg-gray-950"
          : "bg-gray-50 dark:bg-gray-900/50"
      } hover:bg-gray-100 dark:hover:bg-gray-900 border-b border-gray-100 dark:border-gray-800`}
    >
      <div className="flex gap-3">
        {/* Icône colorée */}
        <div className="flex-shrink-0 text-lg mt-0.5">
          {getIcon(notification.type)}
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap justify-between items-start gap-1">
            <p
              className={`text-sm font-medium ${notification.isRead ? "text-gray-600 dark:text-gray-400" : "text-gray-900 dark:text-gray-100"}`}
            >
              {notification.title}
            </p>
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {timeAgo}
            </span>
          </div>

          <p
            className={`text-xs mt-0.5 ${notification.isRead ? "text-gray-500" : "text-gray-600 dark:text-gray-400"}`}
          >
            {notification.content}
          </p>

          {/* Détails pour les demandes d'information */}
          {isInfoRequest && notification.data && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-500 space-y-0.5">
              {displayName && (
                <p className="flex items-center gap-1.5">
                  <IoPersonOutline className="text-gray-400 text-[11px]" />
                  <span>@{displayName}</span>
                </p>
              )}
              {notification.data.checkIn && notification.data.checkOut && (
                <p className="flex items-center gap-1.5">
                  <IoCalendarOutline className="text-gray-400 text-[11px]" />
                  <span>
                    {new Date(notification.data.checkIn).toLocaleDateString(
                      "fr-FR",
                    )}{" "}
                    →{" "}
                    {new Date(notification.data.checkOut).toLocaleDateString(
                      "fr-FR",
                    )}
                  </span>
                </p>
              )}
              {notification.data.guests && (
                <p className="flex items-center gap-1.5">
                  <IoPersonOutline className="text-gray-400 text-[11px]" />
                  <span>
                    {notification.data.guests} voyageur
                    {notification.data.guests > 1 ? "s" : ""}
                  </span>
                </p>
              )}
            </div>
          )}

          {/* Actions pour les demandes d'information */}
          {isInfoRequest && !notification.isRead && onAccept && onReject && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleAccept}
                disabled={isProcessingAction}
                className="px-3 py-1 text-xs font-medium bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition disabled:opacity-50"
              >
                Accepter
              </button>
              <button
                onClick={handleReject}
                disabled={isProcessingAction}
                className="px-3 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition disabled:opacity-50"
              >
                Refuser
              </button>
              <button
                onClick={handleMarkAsRead}
                className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition"
              >
                Ignorer
              </button>
            </div>
          )}

          {/* Actions pour les demandes de prolongation */}
          {isBookingRequest && !notification.isRead && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => {
                  console.log("🔍 NOTIFICATION COMPLETE:", notification);
                  console.log("🔍 NOTIFICATION ID:", notification.id);
                  console.log("🔍 TYPES:", typeof notification.id);

                  const id = notification.id;
                  if (!id || id === "undefined") {
                    console.error("❌ ID invalide");
                    // Marquer comme lu et continuer
                    handleMarkAsRead();
                    return;
                  }

                  window.location.href = `/fr/dashboard/owner/reservations/extensions/${id}`;
                }}
                className="flex-1 px-3 py-1.5 text-xs font-semibold bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
              >
                Voir la demande
              </button>
              <button
                onClick={handleMarkAsRead}
                className="px-3 py-1.5 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                Marquer comme lu
              </button>
            </div>
          )}

          {/* Marquer comme lu simple pour les autres types */}
          {!notification.isRead && !isInfoRequest && !isBookingRequest && (
            <button
              onClick={handleMarkAsRead}
              className="mt-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              Marquer comme lu
            </button>
          )}
        </div>

        {/* Point non lu */}
        {!notification.isRead && (
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0 mt-2 animate-pulse" />
        )}
      </div>
    </div>
  );
}
