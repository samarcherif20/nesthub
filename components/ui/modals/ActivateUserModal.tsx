'use client';

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { User } from "@/lib/types/user";
import { RiUserFollowLine } from "react-icons/ri";
import { useTranslations } from "next-intl";

interface ActivateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onConfirm: (userId: string) => Promise<void>;
}

export default function ActivateUserModal({
  isOpen,
  onClose,
  user,
  onConfirm,
}: ActivateUserModalProps) {

  const t = useTranslations("admin.usersManagement.activateModal");
  const [loading, setLoading] = useState(false);

  // Reset quand le modal se ferme
  useEffect(() => {
    if (!isOpen) {
      setLoading(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await onConfirm(user.id);
      onClose();
    } catch (error) {
      console.error("Erreur réactivation :", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const statusMap: Record<string, string> = {
    TEMPORARILY_SUSPENDED: t("status.suspended"),
    PERMANENTLY_BANNED: t("status.banned"),
    SECURITY_LOCKED: t("status.locked"),
    INACTIVE: t("status.inactive"),
    REJECTED: t("status.rejected"),
  };

  const statusText = statusMap[user.status] ?? t("status.unknown");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={true}
      className="max-w-md"
      title={
        <div className="flex flex-col items-center w-full ml-23">
          {/* Icon au centre */}
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 text-emerald-600 dark:text-emerald-400 mb-3 ">
            <RiUserFollowLine className="text-2xl" />
          </div>
          
          {/* Titre */}
          <h2 className="text-lg font-bold text-gray-900 dark:text-white text-center">
            {t("title")}
          </h2>
          
          {/* Statut */}
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
            {t("currentStatus", { status: statusText })}
          </p>
        </div>
      }
    >
      {/* BODY - compact comme les autres modals */}
      <div className="space-y-3 p-1">
        <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
          {t("description")}
        </p>

        {/* User Card - compact */}
        <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700">
          {user?.profilePictureUrl ? (
            <img
              src={user.profilePictureUrl}
              alt="avatar"
              className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-600"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <RiUserFollowLine className="text-gray-500 dark:text-gray-400 text-sm" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-medium text-gray-900 dark:text-white truncate">
              {user?.firstName} {user?.lastName}
            </h3>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
              {user?.email}
            </p>
          </div>
        </div>
      </div>

      {/* FOOTER - compact comme les autres modals */}
      <div className="flex justify-end gap-2 pt-3 mt-2 border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={onClose}
          className="px-3 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          {t("cancel")}
        </button>
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 shadow-sm transition-all disabled:opacity-50 flex items-center gap-1"
        >
          {loading ? (
            <>
              <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{t("processing")}</span>
            </>
          ) : (
            t("confirm")
          )}
        </button>
      </div>
    </Modal>
  );
}